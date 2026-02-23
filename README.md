# MergePulse

![MergePulse Banner](MergePulse.png)

> **Transforma la gestión de Pull Requests en un sistema observable, medible y optimizable.**

MergePulse es un Micro-SaaS de analítica y revisión inteligente diseñado para startups tecnológicas que utilizan GitHub. Proporciona métricas de productividad claras, rankings de contribución y, crucialmente, un sistema de **revisión automática de código impulsado por IA** bajo demanda.

El objetivo es aumentar la transparencia, mejorar la calidad del código y reducir drásticamente los tiempos de "Code Review" sin añadir fricción al flujo de trabajo existente.

---

## 🚀 Características Principales (MVP)

* **📊 Dashboard de Productividad:** Visualiza en tiempo real el flujo de trabajo de tu equipo con métricas de PRs abiertas, cerradas y mergeadas por día/mes.
* **🤖 Revisión de Código con IA:** Solicita una revisión instantánea de cualquier PR. Un potente LLM analiza el *diff*, busca bugs, problemas de seguridad y violaciones de estilo, otorgando un "Quality Score" (0-100).
* **🏆 Ranking de Desarrolladores:** Sistema de puntuación gamificado basado en la actividad de PRs para visibilizar las contribuciones más impactantes.
* **🏢 Arquitectura Multi-Tenant:** Diseñado desde el inicio para soportar múltiples organizaciones con aislamiento lógico de datos.
* **⚡ Integración Nativa con GitHub App:** Instalación sin fricción y actualizaciones en tiempo real mediante Webhooks seguros.

---

## 🛠️ Stack Tecnológico y Arquitectura

MergePulse utiliza una arquitectura moderna y escalable basada en un **Monorepo**.

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | Dashboard interactivo, visualización de datos con Recharts y estilizado con Tailwind CSS. |
| **Backend** | NestJS (Node.js) | API REST modular. Maneja la lógica de negocio, autenticación y webhooks. |
| **Base de Datos**| PostgreSQL + Prisma ORM | Almacenamiento relacional robusto con esquema tipado para gestión multi-tenant. |
| **Cola & Caché**| Redis + BullMQ | Gestión de trabajos asíncronos (Workers) para el procesamiento pesado de la IA. |
| **Infraestructura**| Docker & Docker Compose| Entorno de desarrollo y despliegue contenerizado y reproducible. |
| **Integración** | GitHub Apps & Webhooks | Conexión segura para leer código y recibir eventos en tiempo real. |

### Diagrama de Alto Nivel

```mermaid
graph TD
    GH[GitHub] -- Webhooks --> API[NestJS API Gateway]
    Client[Next.js Frontend] -- REST/JWT --> API
    API -- Lee/Escribe --> DB[(PostgreSQL)]
    API -- Encola Jobs --> Redis[(Redis Queue)]
    Redis -- Procesa Jobs --> Worker[NestJS Worker Process]
    Worker -- 1. Obtiene Diff --> GH
    Worker -- 2. Analiza Código --> LLM[Proveedor IA (e.g., Claude/OpenAI)]
    Worker -- 3. Guarda Resultados --> DB

```

## 📁 Project Structure

This project is organized as a **Turborepo monorepo** using pnpm workspaces:

```
MergePulse/
├── apps/
│   ├── web/          # Next.js frontend (App Router, Tailwind CSS)
│   ├── backend/      # NestJS REST API
│   └── docs/         # Documentation site
├── packages/
│   ├── ui/           # Shared UI component library
│   ├── eslint-config/        # Shared ESLint configuration
│   └── typescript-config/    # Shared TypeScript configuration
├── docker-compose.yml        # PostgreSQL & Redis for local development
├── turbo.json                # Turborepo task pipeline configuration
└── pnpm-workspace.yaml       # pnpm workspace definition
```

## 🏁 Getting Started Locally

Follow these steps to set up the full development environment.

### Prerequisites

| Tool | Minimum Version |
|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18 (LTS recommended) |
| [pnpm](https://pnpm.io/) | ≥ 9.0.0 |
| [Docker](https://www.docker.com/) & Docker Compose | Latest stable |

### 1. Clone the Repository

```bash
git clone https://github.com/KEVIN-117/MergePulse.git
cd MergePulse
```

### 2. Configure Environment Variables

Copy the example file and adjust values if needed:

```bash
cp .env.example .env
```

The defaults work out of the box for local development. See `.env.example` for all available variables.

### 3. Start Infrastructure (PostgreSQL & Redis)

```bash
docker compose up -d
```

This starts:

| Service | Port | Description |
|---|---|---|
| **PostgreSQL** | `5432` | Relational database |
| **Redis** | `6379` | Queue & cache (BullMQ) |

To verify the services are running:

```bash
docker compose ps
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run in Development Mode

```bash
pnpm dev
```

| App | URL | Source |
|---|---|---|
| **Frontend (Next.js)** | http://localhost:3001 | `apps/web` |
| **Backend (NestJS)** | http://localhost:3002 | `apps/backend` |

### Available Scripts

All scripts are run from the **repository root** via Turborepo:

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in watch/development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all apps and packages |
| `pnpm format` | Format files with Prettier |
| `pnpm check-types` | Run TypeScript type checking |

### Stopping Infrastructure

```bash
docker compose down
```

To also remove persisted data volumes:

```bash
docker compose down -v
```

---

## 🔮 Roadmap

El desarrollo actual se centra en la Fase 1 (MVP).

* [x] **Fase 1: Fundamentos (Actual)** - Autenticación GitHub, Webhooks básicos, Dashboard inicial, Motor de revisión IA manual.
* [ ] **Fase 2: Métricas Avanzadas** - Tiempo promedio de merge (Cycle Time), tamaño de PRs, exportación de reportes CSV.
* [ ] **Fase 3: Integraciones & Pro** - Notificaciones en Slack/Discord, sistema de facturación (Stripe) y límites de plan.

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](https://www.google.com/search?q=LICENSE).
