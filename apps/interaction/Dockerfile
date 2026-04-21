# Captain Squawks — crew portal (email login, admin → moderators).
# Build from monorepo root: docker build -f apps/interaction/Dockerfile .
# Railway: new service → config file railway.interaction.toml (or Dockerfile path apps/interaction/Dockerfile).

FROM node:22-alpine AS base
RUN corepack enable pnpm
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/overlay/package.json apps/overlay/
COPY apps/local-bridge/package.json apps/local-bridge/
COPY apps/interaction/package.json apps/interaction/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/interaction apps/interaction
COPY packages/shared packages/shared
ENV DOCKER_BUILD=1
ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/prisma_build_placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm --filter @captain-squawks/interaction exec prisma generate
RUN pnpm --filter @captain-squawks/interaction run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN npm install -g prisma@6

COPY --from=build /repo/apps/interaction/.next/standalone ./
COPY --from=build /repo/apps/interaction/.next/static ./apps/interaction/.next/static
COPY --from=build /repo/apps/interaction/public ./apps/interaction/public
COPY --from=build /repo/apps/interaction/prisma ./apps/interaction/prisma

EXPOSE 3000
CMD ["sh", "-c", "prisma migrate deploy --schema=./apps/interaction/prisma/schema.prisma && node apps/interaction/server.js"]
