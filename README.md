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

## 🏁 Empezando en Local

Sigue estos pasos para levantar el entorno de desarrollo completo usando Docker.

### Requisitos Previos

* Docker y Docker Compose instalados.
* Node.js (Versión LTS, ej. v20+) y npm/pnpm.
* Una **GitHub App** creada y configurada (necesitarás el ID, Private Key y Webhook Secret).
* Una API Key de tu proveedor de IA (OpenAI o Anthropic).

### Instalación

1. **Clonar el repositorio:**

```bash
git clone [https://github.com/tu-usuario/mergepulse.git](https://github.com/tu-usuario/mergepulse.git)
cd mergepulse

```

1. **Configurar Variables de Entorno:**

Crea un archivo `.env` en la raíz basado en el ejemplo (asegúrate de llenar tus credenciales de GitHub y IA):

```bash
cp .env.example .env

```

1. **Levantar la Infraestructura (BD y Redis):**

```bash
docker-compose up -d postgres redis

```

1. **Instalar dependencias y preparar la Base de Datos:**

```bash
npm install
# Ejecutar migraciones de Prisma
npx prisma migrate dev --name init

```

1. **Ejecutar los servicios (Frontend y Backend) en modo desarrollo:**

```bash
npm run dev

```

* El **Frontend** estará disponible en `http://localhost:3000`
* La **API** estará disponible en `http://localhost:3001`
* *(Opcional)* Para recibir webhooks en local, usa una herramienta como `ngrok` para exponer tu puerto 3001.

---

## 🔮 Roadmap

El desarrollo actual se centra en la Fase 1 (MVP).

* [x] **Fase 1: Fundamentos (Actual)** - Autenticación GitHub, Webhooks básicos, Dashboard inicial, Motor de revisión IA manual.
* [ ] **Fase 2: Métricas Avanzadas** - Tiempo promedio de merge (Cycle Time), tamaño de PRs, exportación de reportes CSV.
* [ ] **Fase 3: Integraciones & Pro** - Notificaciones en Slack/Discord, sistema de facturación (Stripe) y límites de plan.

## Estructura de carpetas

### Backend

```plaintext
apps/backend/src/
├── common/                  # Cosas compartidas y genéricas
│   ├── decorators/          # @CurrentUser(), @Public()
│   ├── guards/              # JwtAuthGuard, GithubWebhookGuard
│   ├── filters/             # Manejo global de errores
│   └── utils/               # Funciones helper puras
│
├── config/                  # Configuración de entorno (env vars)
│   └── env.validation.ts    # Validación con Joi/Zod
│
├── modules/                 # EL CORAZÓN DE TU APP (Feature Modules)
│   ├── auth/                # Login, JWT, Estrategias Passport
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   │
│   ├── github/              # Integración con GitHub
│   │   ├── webhooks/        # Controlador de Webhooks
│   │   └── client/          # Servicio para llamar a la API de GitHub
│   │
│   ├── ai-reviewer/         # El cerebro (BullMQ + OpenAI/Claude)
│   │   ├── queues/          # Productores de eventos
│   │   ├── workers/         # Procesadores (Consumers)
│   │   └── ai.service.ts    # Lógica de prompts
│   │
│   ├── metrics/             # Endpoints de Dashboard y Ranking
│   │
│   ├── organizations/       # CRUD y gestión multi-tenant
│   │
│   └── pull-requests/       # Gestión de PRs (lectura/escritura DB)
│
├── prisma/                  # Módulo de base de datos
│   ├── prisma.service.ts    # Conexión única
│   └── prisma.module.ts
│
├── app.module.ts            # Importa todos los módulos anteriores
└── main.ts                  # Punto de entrada
```

### Frontend

```plaintext
apps/web/
├── app/                      # SOLO Rutas y Layouts (El esqueleto)
│   ├── (auth)/               # Agrupación de rutas (login, callback)
│   ├── dashboard/            # Ruta principal
│   │   └── page.tsx          # "Pega" los componentes de la carpeta features
│   ├── prs/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   └── layout.tsx            # Layout global (Providers)
│
├── components/               # UI "Tonta" y Genérica (Design System)
│   ├── ui/                   # Aquí vive shadcn (Button, Card, Input...)
│   ├── layouts/              # Sidebar, Navbar, Footer
│   └── icons/                # Iconos específicos si no usas lucide-react
│
├── features/                 # EL CEREBRO (Componentes inteligentes por dominio)
│   ├── auth/
│   │   ├── components/       # LoginForm.tsx, AuthGuard.tsx
│   │   └── hooks/            # useAuth.ts
│   │
│   ├── dashboard/            # Todo lo del dashboard
│   │   ├── components/       # RankingTable.tsx, ActivityChart.tsx
│   │   └── hooks/            # useDashboardMetrics.ts
│   │
│   ├── ai-review/            # Todo lo relacionado a la IA
│   │   ├── components/       # ReviewButton.tsx, IssuesList.tsx, ScoreCard.tsx
│   │   └── api/              # review-api.ts (llamadas específicas)
│   │
│   └── prs/
│       └── components/       # PrStatusBadge.tsx, PrDiffViewer.tsx
│
├── lib/                      # Configuración y Utilidades
│   ├── api.ts                # Tu cliente Axios configurado (Interceptor JWT)
│   └── utils.ts              # Helpers de clases (cn de tailwind)
│
├── hooks/                    # Hooks globales (no de negocio)
│   ├── use-mobile.ts
│   └── use-toast.ts
│
└── types/                    # Tipos compartidos
```

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](https://www.google.com/search?q=LICENSE).
