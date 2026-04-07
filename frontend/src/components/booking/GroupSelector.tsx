import React, { useEffect, useState } from "react";
import type { LaptopGroup } from "../../api/laptopGroups";
import { laptopGroupsApi } from "../../api/laptopGroups";

interface Props {
  selectedGroupId: string | null;
  onGroupSelect: (group: LaptopGroup | null) => void;
}

export default function GroupSelector({ selectedGroupId, onGroupSelect }: Props) {
  const [groups, setGroups] = useState<LaptopGroup[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("__all__");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    laptopGroupsApi
      .list()
      .then((res) => {
        setGroups(res.data);
        if (!selectedGroupId) {
          // Default: show all buildings
          onGroupSelect(null);
        } else {
          const g = res.data.find((g) => g.id === selectedGroupId);
          if (g) setSelectedBuilding(g.building);
        }
      })
      .catch(() => setError("Failed to load laptop groups"));
  }, []);

  const buildings = Array.from(new Set(groups.map((g) => g.building))).sort();
  const floorsForBuilding = groups
    .filter((g) => g.building === selectedBuilding)
    .sort((a, b) => a.floor - b.floor);

  const handleBuildingChange = (building: string) => {
    setSelectedBuilding(building);
    if (building === "__all__") {
      onGroupSelect(null);
    } else {
      const firstFloor = groups
        .filter((g) => g.building === building)
        .sort((a, b) => a.floor - b.floor)[0];
      if (firstFloor) onGroupSelect(firstFloor);
    }
  };

  const handleFloorChange = (groupId: string) => {
    const g = groups.find((g) => g.id === groupId);
    if (g) onGroupSelect(g);
  };

  if (error) return <span style={{ color: "#ef4444", fontSize: 13 }}>{error}</span>;
  if (groups.length === 0)
    return <span style={{ color: "#6b7280", fontSize: 13 }}>No laptop groups available</span>;

  const selectStyle: React.CSSProperties = {
    padding: "4px 8px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    color: "#374151",
    background: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Building:</label>
      <select
        value={selectedBuilding}
        onChange={(e) => handleBuildingChange(e.target.value)}
        style={selectStyle}
        aria-label="Select building"
      >
        <option value="__all__">All buildings</option>
        {buildings.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      {selectedBuilding !== "__all__" && floorsForBuilding.length > 0 && (
        <>
          <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Floor:</label>
          <select
            value={selectedGroupId ?? ""}
            onChange={(e) => handleFloorChange(e.target.value)}
            style={selectStyle}
            aria-label="Select floor"
          >
            {floorsForBuilding.map((g) => (
              <option key={g.id} value={g.id}>
                Floor {g.floor} ({g.laptop_count} laptops)
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
