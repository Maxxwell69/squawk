# Squawk overlay — Pirate Maxx / First Mate Squawks (Next.js standalone).
# The local-bridge should stay on your stream PC; deploy this image if you want
# a hosted overlay URL for OBS (WebSocket must reach your bridge — use tunneling or local WS).

FROM node:22-alpine AS base
RUN corepack enable pnpm
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/overlay/package.json apps/overlay/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/overlay apps/overlay
ENV DOCKER_BUILD=1
# Set at build time in Railway (bridge public WebSocket URL, usually wss://…)
ARG NEXT_PUBLIC_WS_URL=
ARG NEXT_PUBLIC_BRIDGE_HTTP=
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_BRIDGE_HTTP=$NEXT_PUBLIC_BRIDGE_HTTP
# Auth + Prisma run during `next build`; placeholders only for compile (runtime uses Railway variables).
ARG DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/prisma_build_placeholder
ENV DATABASE_URL=$DATABASE_URL
ENV EMAIL_SERVER=smtp://build:build@127.0.0.1:587
ENV EMAIL_FROM="Captain Squawks <noreply@build.invalid>"
ENV AUTH_SECRET=docker_build_auth_secret_not_used_at_runtime
ENV AUTH_URL=http://127.0.0.1:3000
ENV ADMIN_EMAIL=build@example.invalid
# Overlay resolves @captain-squawks/shared via next.config webpack alias → packages/shared/src (pnpm Docker-safe)
RUN pnpm --filter @captain-squawks/overlay build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN npm install -g prisma@6

# Next standalone + outputFileTracingRoot: server lives under apps/overlay/server.js
COPY --from=build /repo/apps/overlay/.next/standalone ./
COPY --from=build /repo/apps/overlay/.next/static ./apps/overlay/.next/static
COPY --from=build /repo/apps/overlay/public ./apps/overlay/public
COPY --from=build /repo/apps/overlay/prisma ./apps/overlay/prisma

EXPOSE 3000
CMD ["sh", "-c", "prisma migrate deploy --schema=./apps/overlay/prisma/schema.prisma && node apps/overlay/server.js"]
