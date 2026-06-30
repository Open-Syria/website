# Pull Request Workflow

OpenSyria Website is maintainer-led. Public issues and small corrections are welcome, but broad implementation work should be discussed before a pull request is opened.

## Branches

Use short, descriptive branch names:

```text
fix/header-focus-state
docs/update-local-setup
chore/update-dependencies
```

## Scope

Good pull requests are focused and easy to review. Keep unrelated refactors, formatting churn, generated files, and dependency updates out of feature or bug-fix PRs.

Dataset record corrections, missing records, source disagreements, and dataset schema proposals belong in the relevant dataset repository.

## Before Opening

Before opening a PR:

- make sure the change belongs in `website`,
- keep the change focused,
- update docs when commands, configuration, routes, content, analytics, or deployment steps change,
- include screenshots or notes for visual changes,
- consider keyboard, screen-reader, focus, contrast, and responsive behavior,
- do not commit secrets, local `.env` files, private data, or generated local artifacts,
- avoid new production dependencies unless clearly necessary.

## Validation

Run:

```bash
pnpm verify
```

For focused local work:

```bash
pnpm check
pnpm typecheck
pnpm build
```

Use `pnpm check:write` for Biome formatting and safe fixes. Use
`pnpm check:write:unsafe` only when intentionally accepting unsafe Biome fixes.

Deployment changes should also update [Deployment](deployment.md) and, when the
server runtime files change, [deploy/website/README.md](../deploy/website/README.md).

## Commit Messages

Use Conventional Commits:

```text
feat: add dataset browser shell
fix: correct navigation focus state
docs: update contribution notes
chore: update dependencies
```
