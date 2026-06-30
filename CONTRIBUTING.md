# Contributing

Thanks for your interest in OpenSyria Website.

This repository contains the public website for OpenSyria. The code is public for transparency, auditability, and reuse, but website implementation is maintainer-led.

Broad public contribution is intended primarily for the dataset repositories.

## Table of Contents

- [What Belongs Here](#what-belongs-here)
- [Before Opening an Issue](#before-opening-an-issue)
- [Local Setup](#local-setup)
- [Pull Requests](#pull-requests)
- [Validation](#validation)
- [Supply Chain Security](#supply-chain-security)
- [Accessibility and Content](#accessibility-and-content)
- [Commit Messages](#commit-messages)

## What Belongs Here

Accepted in this repository:

- reproducible website bug reports,
- accessibility issues,
- documentation and content corrections,
- broken links, metadata issues, and responsive layout bugs,
- CI, tooling, dependency, or deployment maintenance,
- maintainer-authored implementation work,
- maintainer-requested changes,
- automated dependency update pull requests,
- private security reports through the security policy.

Not accepted here as unsolicited pull requests:

- new product features,
- authentication, admin, subscription, billing, or backend behavior,
- dataset source changes,
- dataset record corrections,
- dataset schema changes,
- broad refactors unrelated to a tracked issue.

Dataset corrections and missing records should go to the relevant dataset repository.

## Before Opening an Issue

Use the GitHub issue forms:

- **Website Bug Report** for reproducible website behavior.
- **Accessibility Issue** for keyboard, screen-reader, focus, contrast, semantic markup, or responsive accessibility problems.
- **Documentation or Content Correction** for stale commands, broken links, unclear docs, or website content issues.
- **Maintainer Proposal** for ideas that need maintainer review before implementation.

Do not include secrets, tokens, private URLs, personal data, or restricted data in public issues.

Security vulnerabilities should be reported privately through [SECURITY.md](SECURITY.md).

Project conduct expectations are documented in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Local Setup

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

Source code lives under `src/`.

## Pull Requests

Open a pull request only when it is maintainer-authored, requested by a maintainer, a documentation or content correction, a reproducible bug fix, an accessibility fix, a tooling/deployment fix, or an automated dependency update.

Follow [docs/pull-request-workflow.md](docs/pull-request-workflow.md) for branch names, commit messages, review expectations, and validation.

Before opening a PR:

- make sure the change belongs in `website`,
- keep the change focused,
- update docs when routes, content, commands, config, or deployment steps change,
- include screenshots or notes for visual changes,
- consider accessibility for UI changes,
- do not commit secrets or local `.env` files,
- do not commit generated local artifacts,
- avoid new production dependencies unless clearly necessary.

## Validation

Run the same checks used by CI:

```bash
pnpm verify
```

For focused local work:

```bash
pnpm check
pnpm typecheck
pnpm build
```

Use `pnpm check:write` to apply Biome formatting, safe lint fixes, import
organization, duplicate class cleanup, and package.json ordering.

Use `pnpm check:write:unsafe` when you intentionally want Biome to apply
unsafe fixes, including Tailwind class sorting.

## Supply Chain Security

The pnpm workspace policy intentionally blocks package versions published
inside the configured release-age window and only permits approved dependency
build scripts. If a dependency install fails because a version is too new, wait
for the release-age window to pass or choose an older approved version.

Review [docs/supply-chain-security.md](docs/supply-chain-security.md) before
changing dependency policy, build-script approvals, or the pinned pnpm version.

## Accessibility and Content

Website changes should preserve:

- semantic HTML and accessible names for controls,
- keyboard navigation and visible focus states,
- useful page titles and metadata,
- responsive behavior across mobile and desktop,
- source and licensing boundaries for any public data or media,
- avoidance of private, personal, restricted, military, or surveillance-related information.

## Commit Messages

Use Conventional Commits:

```text
feat: add dataset browser shell
fix: correct locale switcher focus state
docs: update contribution notes
chore: update dependencies
```

Husky runs `lint-staged` before commits and commitlint for commit messages.
