# Captain Squawks — browser overlay only (Next.js standalone).
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
# Shared package exports ./dist — must exist before Next can resolve @captain-squawks/shared
RUN pnpm --filter @captain-squawks/shared run build
RUN pnpm --filter @captain-squawks/overlay build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next standalone + outputFileTracingRoot: server lives under apps/overlay/server.js
COPY --from=build /repo/apps/overlay/.next/standalone ./
COPY --from=build /repo/apps/overlay/.next/static ./apps/overlay/.next/static
COPY --from=build /repo/apps/overlay/public ./apps/overlay/public

EXPOSE 3000
CMD ["node", "apps/overlay/server.js"]
