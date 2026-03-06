FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/merge-pulse-dashboard/package.json apps/merge-pulse-dashboard/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm --filter merge-pulse-dashboard run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/apps/merge-pulse-dashboard/public ./public
COPY --from=build /app/apps/merge-pulse-dashboard/.next/standalone ./
COPY --from=build /app/apps/merge-pulse-dashboard/.next/static ./.next/static
USER appuser
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/merge-pulse-dashboard/server.js"]
