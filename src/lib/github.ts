import { cacheLife } from "next/cache"

const GITHUB_ORGANIZATION = "Open-Syria"
const GITHUB_API_BASE = "https://api.github.com"
const EXCLUDED_REPOSITORY_NAMES = new Set([".github"])

type GitHubRepository = {
  name?: string
  stargazers_count?: number
}

type GitHubContributor = {
  avatar_url?: string
  contributions?: number
  html_url?: string
  login?: string
  type?: string
}

export type Contributor = {
  avatarUrl: string
  contributions: number
  login: string
  url: string
}

export type GitHubOverview = {
  contributors: Contributor[]
  stars: number | null
}

export async function getGithubOverview(): Promise<GitHubOverview> {
  "use cache"

  cacheLife("hours")

  try {
    const repositories = await getPublicRepositories()
    const visibleRepositories = repositories.filter(isVisibleRepository)

    const contributorGroups = new Map<string, Contributor>()
    const contributorResponses = await Promise.all(
      visibleRepositories.map((repository) =>
        fetch(
          `${GITHUB_API_BASE}/repos/${GITHUB_ORGANIZATION}/${encodeURIComponent(repository.name)}/contributors?per_page=100`,
          {
            headers: githubHeaders(),
          }
        )
      )
    )

    for (const response of contributorResponses) {
      if (!response.ok) {
        continue
      }

      const contributors = (await response.json()) as GitHubContributor[]

      for (const contributor of contributors) {
        if (!isHumanContributor(contributor)) {
          continue
        }

        const existing = contributorGroups.get(contributor.login)

        contributorGroups.set(contributor.login, {
          avatarUrl: contributor.avatar_url,
          contributions:
            (existing?.contributions ?? 0) + contributor.contributions,
          login: contributor.login,
          url: contributor.html_url,
        })
      }
    }

    return {
      contributors: Array.from(contributorGroups.values())
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 12),
      stars: visibleRepositories.reduce(
        (stars, repository) => stars + (repository.stargazers_count ?? 0),
        0
      ),
    }
  } catch {
    return fallbackOverview()
  }
}

async function getPublicRepositories() {
  const repositories: GitHubRepository[] = []

  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `${GITHUB_API_BASE}/orgs/${GITHUB_ORGANIZATION}/repos?type=public&per_page=100&page=${page}`,
      {
        headers: githubHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch GitHub repositories")
    }

    const pageRepositories = (await response.json()) as GitHubRepository[]

    repositories.push(...pageRepositories)

    if (pageRepositories.length < 100) {
      return repositories
    }
  }
}

function isVisibleRepository(
  repository: GitHubRepository
): repository is Required<GitHubRepository> {
  return (
    typeof repository.name === "string" &&
    !EXCLUDED_REPOSITORY_NAMES.has(repository.name) &&
    typeof repository.stargazers_count === "number"
  )
}

function isHumanContributor(
  contributor: GitHubContributor
): contributor is Required<GitHubContributor> {
  return (
    contributor.type === "User" &&
    typeof contributor.login === "string" &&
    typeof contributor.avatar_url === "string" &&
    typeof contributor.html_url === "string" &&
    typeof contributor.contributions === "number"
  )
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "OpenSyria-Website",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

function fallbackOverview(): GitHubOverview {
  return {
    contributors: [],
    stars: null,
  }
}
