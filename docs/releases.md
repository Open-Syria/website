# Releases

The website uses release-please to automate version bumps, changelog updates, Git tags, and GitHub Releases.

Production deployment still uses SHA-pinned Docker images:

```text
ghcr.io/open-syria/website:sha-<short-sha>
```

`package.json` versions and GitHub Releases are human-facing release metadata, not the deployment selector.

## How It Works

`.github/workflows/release-please.yml` runs on pushes to `main`.

The workflow reads:

```text
release-please-config.json
.release-please-manifest.json
```

When release-worthy Conventional Commits land on `main`, release-please opens or updates a release pull request.

Merging that release pull request:

1. Updates `package.json`.
2. Updates `.release-please-manifest.json`.
3. Updates `CHANGELOG.md`.
4. Creates a Git tag such as `v0.1.0`.
5. Creates a GitHub Release.

No package is published to npm.

## Commit Types

Release-worthy examples:

```text
feat: add dataset browser shell
fix: correct canonical metadata
perf: reduce landing page payload
```

Breaking changes use standard Conventional Commit syntax:

```text
feat!: redesign public navigation
```

or:

```text
feat: redesign public navigation

BREAKING CHANGE: navigation routes changed
```

Non-release examples:

```text
docs: update deployment notes
chore: update dependencies
test: add component coverage
ci: update workflow permissions
```

## Tokens

The workflow falls back to `GITHUB_TOKEN`.

If release-please pull requests need CI checks to run automatically under branch protection, add a repository secret named:

```text
RELEASE_PLEASE_TOKEN
```

Use a fine-grained token or GitHub App token with permission to create pull requests and write contents for this repository.

## Bootstrap

The release config uses `bootstrap-sha` so the initial public website launch history is treated as already released at `0.0.1`.

Future release PRs should only include release-worthy commits after that bootstrap point.
