# Supply Chain Security

The website repository uses pnpm workspace-level supply-chain controls based on
the official pnpm supply-chain security guidance:
https://pnpm.io/supply-chain-security.

## pnpm Version

Use Corepack and the pinned pnpm version from `package.json`:

```bash
corepack enable pnpm
pnpm install
```

CI uses the same pnpm version.

## Dependency Resolution

`pnpm-workspace.yaml` configures:

- `minimumReleaseAge: 1440` to avoid package versions published in the last 24 hours,
- `minimumReleaseAgeStrict: true` and `minimumReleaseAgeIgnoreMissingTime: false` so missing or too-new publish times fail,
- `blockExoticSubdeps: true` to reject exotic transitive dependency sources,
- `strictDepBuilds: true` and `dangerouslyAllowAllBuilds: false` so new dependency build scripts fail closed,
- `trustPolicy: no-downgrade` to guard against dependency trust regressions,
- `verifyDepsBeforeRun: install` so pnpm checks dependency state before scripts run.

## Build Scripts

Dependency build scripts are denied by default. Only packages listed under
`allowBuilds` may run install/build scripts.

Approved:

- `sharp`
- `unrs-resolver`

Review build-script changes before approving new entries.
