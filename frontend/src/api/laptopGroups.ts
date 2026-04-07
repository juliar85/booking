import client from "./client";

export interface LaptopGroup {
  id: string;
  building: string;
  floor: number;
  laptop_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLaptopGroupPayload {
  building: string;
  floor: number;
  laptop_count: number;
}

export interface UpdateLaptopGroupPayload {
  building?: string;
  floor?: number;
  laptop_count?: number;
}

export const laptopGroupsApi = {
  list: () => client.get<LaptopGroup[]>("/laptop-groups"),
  create: (payload: CreateLaptopGroupPayload) =>
    client.post<LaptopGroup>("/laptop-groups", payload),
  update: (id: string, payload: UpdateLaptopGroupPayload) =>
    client.patch<LaptopGroup>(`/laptop-groups/${id}`, payload),
  deactivate: (id: string) =>
    client.delete<{ message: string }>(`/laptop-groups/${id}`),
};
