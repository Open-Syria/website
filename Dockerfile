# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV HUSKY=0

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable pnpm

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile

FROM deps AS build

ARG NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=$NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID

COPY . .

RUN pnpm run build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=
ENV PORT=3000

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
