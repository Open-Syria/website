# OpenSyria Website

This is the Next.js application for opensyria.org.

## Repository

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Changelog](CHANGELOG.md)
- [Supply Chain Security](docs/supply-chain-security.md)

## Development

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

Application source code lives under `src/`.

## Checks

```bash
pnpm check
pnpm typecheck
pnpm build
```

Run all CI checks with:

```bash
pnpm verify
```

The repository uses pnpm workspace supply-chain protections in
`pnpm-workspace.yaml`, including release-age checks and explicit dependency
build-script approvals. See [Supply Chain Security](docs/supply-chain-security.md).

## Adding components

To add components to your app, run the following command:

```bash
pnpm dlx shadcn@latest add button
```

This will place UI components under `src/components`.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
