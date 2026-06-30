# Agent Notes

This repository uses current Next.js APIs that may differ from older training data.

Before changing framework behavior, routing, metadata, caching, or deployment code:

- prefer the checked-in patterns in this repository,
- read the relevant local Next.js docs in `node_modules/next/dist/docs/` when available,
- keep source code under `src/`,
- keep localization wired through `next-intl`,
- keep direction handling in both `<html dir>` and the Base UI `DirectionProvider`,
- run `pnpm verify` before handing off changes.

Do not commit local `.env` files, SSH keys, Cloudflare tokens, Tailscale credentials, generated local artifacts, or private infrastructure details.
