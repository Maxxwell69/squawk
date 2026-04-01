# Build from monorepo root: docker build -f apps/local-bridge/Dockerfile .
# Railway: set Dockerfile path to apps/local-bridge/Dockerfile, root directory = repo root.

FROM node:22-alpine
RUN corepack enable pnpm
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared packages/shared
COPY apps/local-bridge apps/local-bridge

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @captain-squawks/shared run build
RUN pnpm --filter @captain-squawks/local-bridge run build

ENV NODE_ENV=production
ENV LOCAL_BRIDGE_HOST=0.0.0.0

EXPOSE 8787
CMD ["node", "apps/local-bridge/dist/index.js"]
