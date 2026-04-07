.DEFAULT_GOAL := help

# ─── Colors ───────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
CYAN  := \033[36m
GREEN := \033[32m

# ─── Help ─────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "$(BOLD)Laptop Booking — available commands$(RESET)"
	@echo ""
	@echo "$(CYAN)Docker (full stack)$(RESET)"
	@grep -E '^(up|down|build|logs|ps):.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  $(GREEN)%-28s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Backend$(RESET)"
	@grep -E '^(be-install|be-run|be-test|be-coverage|be-migrate|be-migrate-new|be-migrate-down|be-migrate-history):.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  $(GREEN)%-28s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Frontend$(RESET)"
	@grep -E '^(fe-install|fe-run|fe-build|fe-test|fe-test-watch|fe-coverage):.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  $(GREEN)%-28s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Both test suites$(RESET)"
	@grep -E '^test:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  $(GREEN)%-28s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "Usage: $(BOLD)make <command>$(RESET)"
	@echo ""

# ─── Docker ───────────────────────────────────────────────────────────────────

.PHONY: up
up: ## Start all services in Docker (build if needed)
	docker compose up --build

.PHONY: up-detached
up-detached: ## Start all services in the background
	docker compose up --build -d

.PHONY: down
down: ## Stop and remove containers
	docker compose down

.PHONY: build
build: ## Rebuild Docker images without starting
	docker compose build

.PHONY: logs
logs: ## Follow logs for all services (Ctrl+C to stop)
	docker compose logs -f

.PHONY: ps
ps: ## Show running containers and their status
	docker compose ps

# ─── Backend ──────────────────────────────────────────────────────────────────

.PHONY: be-install
be-install: ## Install backend runtime + test dependencies
	cd backend && pip install -r requirements.txt -r requirements-test.txt

.PHONY: be-run
be-run: ## Start the backend dev server (requires local PostgreSQL)
	cd backend && uvicorn app.main:app --reload

.PHONY: be-test
be-test: ## Run backend tests
	cd backend && python -m pytest

.PHONY: be-coverage
be-coverage: ## Run backend tests with coverage report
	cd backend && python -m pytest --cov=app --cov-report=term-missing

.PHONY: be-migrate
be-migrate: ## Apply all pending migrations to the database
	cd backend && alembic upgrade head

.PHONY: be-migrate-new
be-migrate-new: ## Generate a new migration (usage: make be-migrate-new MSG="describe change")
ifndef MSG
	$(error MSG is required. Usage: make be-migrate-new MSG="describe your change")
endif
	cd backend && alembic revision --autogenerate -m "$(MSG)"

.PHONY: be-migrate-down
be-migrate-down: ## Roll back the last migration
	cd backend && alembic downgrade -1

.PHONY: be-migrate-history
be-migrate-history: ## Show migration history
	cd backend && alembic history --verbose

# ─── Frontend ─────────────────────────────────────────────────────────────────

.PHONY: fe-install
fe-install: ## Install frontend dependencies
	cd frontend && npm install

.PHONY: fe-run
fe-run: ## Start the frontend dev server
	cd frontend && npm run dev

.PHONY: fe-build
fe-build: ## Build the frontend for production
	cd frontend && npm run build

.PHONY: fe-test
fe-test: ## Run frontend tests
	cd frontend && npm test

.PHONY: fe-test-watch
fe-test-watch: ## Run frontend tests in watch mode
	cd frontend && npm run test:watch

.PHONY: fe-coverage
fe-coverage: ## Run frontend tests with coverage report
	cd frontend && npm run test:coverage

# ─── Combined ─────────────────────────────────────────────────────────────────

.PHONY: test
test: be-test fe-test ## Run ALL tests (backend + frontend)
