import { cacheLife, cacheTag } from "next/cache"

const GITHUB_ORGANIZATION = "Open-Syria"
const GITHUB_API_BASE = "https://api.github.com"
const EXCLUDED_REPOSITORY_NAMES = new Set([".github"])

type GitHubRepository = {
  archived?: boolean
  description?: string | null
  fork?: boolean
  html_url?: string
  name?: string
  stargazers_count?: number
  updated_at?: string | null
}

type GitHubOrganization = {
  blog?: string | null
  email?: string | null
  html_url?: string
  location?: string | null
  login?: string
  name?: string | null
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

export type GitHubProjectDirectory = {
  organization: {
    email: string | null
    location: string | null
    name: string
    url: string
    websiteUrl: string | null
  }
  repositories: {
    description: string | null
    name: string
    url: string
  }[]
}

export async function getGithubOverview(): Promise<GitHubOverview> {
  "use cache"

  cacheLife("hours")
  cacheTag("github-overview")

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

export async function getGithubProjectDirectory(): Promise<GitHubProjectDirectory> {
  "use cache"

  cacheLife("hours")
  cacheTag("github-project-directory")

  try {
    const [organization, repositories] = await Promise.all([
      getOrganization(),
      getPublicRepositories(),
    ])

    return {
      organization: {
        email: organization.email ?? null,
        location: organization.location ?? null,
        name: organization.name ?? organization.login ?? "OpenSyria",
        url:
          organization.html_url ?? `https://github.com/${GITHUB_ORGANIZATION}`,
        websiteUrl: organization.blog ?? null,
      },
      repositories: repositories
        .filter(isDirectoryRepository)
        .sort(sortRepositoriesByUpdate)
        .map((repository) => ({
          description: repository.description ?? null,
          name: repository.name,
          url: repository.html_url,
        })),
    }
  } catch {
    return fallbackProjectDirectory()
  }
}

async function getOrganization() {
  const response = await fetch(
    `${GITHUB_API_BASE}/orgs/${GITHUB_ORGANIZATION}`,
    {
      headers: githubHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub organization")
  }

  return (await response.json()) as GitHubOrganization
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
): repository is GitHubRepository & {
  name: string
  stargazers_count: number
} {
  return (
    typeof repository.name === "string" &&
    !EXCLUDED_REPOSITORY_NAMES.has(repository.name) &&
    typeof repository.stargazers_count === "number"
  )
}

function isDirectoryRepository(
  repository: GitHubRepository
): repository is GitHubRepository & {
  html_url: string
  name: string
} {
  return (
    typeof repository.name === "string" &&
    typeof repository.html_url === "string" &&
    !EXCLUDED_REPOSITORY_NAMES.has(repository.name) &&
    repository.archived !== true &&
    repository.fork !== true
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

function fallbackProjectDirectory(): GitHubProjectDirectory {
  return {
    organization: {
      email: null,
      location: null,
      name: "OpenSyria",
      url: `https://github.com/${GITHUB_ORGANIZATION}`,
      websiteUrl: null,
    },
    repositories: [],
  }
}

function sortRepositoriesByUpdate(
  first: GitHubRepository,
  second: GitHubRepository
) {
  const firstDate = Date.parse(first.updated_at ?? "")
  const secondDate = Date.parse(second.updated_at ?? "")

  return (
    (Number.isNaN(secondDate) ? 0 : secondDate) -
    (Number.isNaN(firstDate) ? 0 : firstDate)
  )
}
