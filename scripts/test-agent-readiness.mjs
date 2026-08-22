import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { access, cp, mkdtemp, rm } from "node:fs/promises"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { fileURLToPath } from "node:url"

const crawlerUserAgents = [
  "ChatGPT-User/1.0",
  "GPTBot/1.2",
  "ClaudeBot/1.0",
  "Google-Extended",
  "DeepSeekBot/1.0",
  "PerplexityBot/1.0",
  "ora-agent/1.0",
]

const configuredBaseUrl = process.env.AGENT_READINESS_BASE_URL?.replace(
  /\/+$/,
  ""
)
const projectRoot = fileURLToPath(new URL("../", import.meta.url))
let serverProcess
let serverLogs = ""
let temporaryDirectory

try {
  const baseUrl = configuredBaseUrl ?? (await startLocalServer())

  await verifyCrawlerReachability(baseUrl)
  await verifyCanonicalEnglishPaths(baseUrl)
  await verifyHomepage(baseUrl)
  await verifyArabicHomepage(baseUrl)
  await verifyDeveloperPage(baseUrl)
  await verifyNotFoundResponses(baseUrl)
  await verifyMachineReadableFiles(baseUrl)
  await verifyPublicAssets(baseUrl)
  await verifyDatasetsApi()

  console.log(`Agent readiness checks passed for ${baseUrl}`)
} finally {
  await stopLocalServer()

  if (temporaryDirectory) {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

async function startLocalServer() {
  const standaloneSource = fileURLToPath(
    new URL("../.next/standalone/server.js", import.meta.url)
  )

  await access(standaloneSource)

  temporaryDirectory = await mkdtemp(
    join(tmpdir(), "opensyria-agent-readiness-")
  )
  const runtimeDirectory = join(temporaryDirectory, "app")

  await cp(join(projectRoot, ".next", "standalone"), runtimeDirectory, {
    recursive: true,
  })
  await cp(
    join(projectRoot, ".next", "static"),
    join(runtimeDirectory, ".next", "static"),
    {
      recursive: true,
    }
  )
  await cp(join(projectRoot, "public"), join(runtimeDirectory, "public"), {
    recursive: true,
  })

  const port = await getAvailablePort()
  const baseUrl = `http://127.0.0.1:${port}`

  serverProcess = spawn(
    process.execPath,
    [join(runtimeDirectory, "server.js")],
    {
      cwd: runtimeDirectory,
      env: {
        ...process.env,
        HOSTNAME: "127.0.0.1",
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  )

  for (const stream of [serverProcess.stdout, serverProcess.stderr]) {
    stream.on("data", (chunk) => {
      serverLogs = `${serverLogs}${chunk}`.slice(-8000)
    })
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Local server exited early.\n${serverLogs}`)
    }

    try {
      const response = await fetch(`${baseUrl}/health`)

      if (response.ok) {
        return baseUrl
      }
    } catch {
      // The standalone server is still starting.
    }

    await delay(250)
  }

  throw new Error(`Timed out waiting for the local server.\n${serverLogs}`)
}

async function stopLocalServer() {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return
  }

  serverProcess.kill("SIGTERM")

  await Promise.race([
    once(serverProcess, "exit"),
    delay(5000).then(() => {
      if (serverProcess?.exitCode === null) {
        serverProcess.kill("SIGKILL")
      }
    }),
  ])
}

async function verifyCrawlerReachability(baseUrl) {
  for (const userAgent of crawlerUserAgents) {
    const response = await fetch(`${baseUrl}/`, {
      headers: { "User-Agent": userAgent },
    })

    assert.equal(
      response.status,
      200,
      `${userAgent} must be able to fetch the homepage`
    )
  }
}

async function verifyCanonicalEnglishPaths(baseUrl) {
  for (const [source, destination] of [
    ["/en", "/"],
    ["/en/api?utm_source=agent-test", "/api"],
    ["/api?utm_source=agent-test", "/api"],
  ]) {
    const response = await fetch(`${baseUrl}${source}`, {
      redirect: "manual",
    })

    assert.equal(response.status, 308, `${source} must redirect permanently`)
    assert.equal(response.headers.get("location"), destination)
  }
}

async function verifyHomepage(baseUrl) {
  const response = await fetch(`${baseUrl}/`, {
    headers: { "User-Agent": "ora-agent/1.0" },
  })
  const html = await response.text()

  assert.equal(response.status, 200)
  assert.match(response.headers.get("content-type") ?? "", /text\/html/i)

  const mainHtml = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
  assert.ok(mainHtml, "Homepage must contain a server-rendered main element")

  const visibleText = stripHtml(mainHtml)
  assert.ok(
    visibleText.length >= 500,
    `Homepage raw HTML must expose at least 500 visible characters; found ${visibleText.length}`
  )

  const headings = Array.from(html.matchAll(/<h([1-6])\b[^>]*>/gi), (match) =>
    Number(match[1])
  )
  assert.equal(
    headings.filter((level) => level === 1).length,
    1,
    "Homepage must contain exactly one H1"
  )
  assert.ok(headings.includes(2), "Homepage must contain H2 sections")
  assert.ok(headings.includes(3), "Homepage cards must use H3 headings")

  for (let index = 1; index < headings.length; index += 1) {
    assert.ok(
      headings[index] - headings[index - 1] <= 1,
      `Homepage heading structure jumps from H${headings[index - 1]} to H${headings[index]}`
    )
  }

  assert.match(html, /OpenSyria developer resources for APIs and agents/i)
  assert.match(html, /href="\/api"/i)
  assert.match(html, /https:\/\/api\.opensyria\.org\/openapi\.json/i)
  assert.match(html, /href="\/llms\.txt"/i)
}

async function verifyDeveloperPage(baseUrl) {
  const response = await fetch(`${baseUrl}/api`)
  const html = await response.text()

  assert.equal(response.status, 200)
  assert.match(
    html,
    /<title>OpenSyria Developer Resources &amp; Syrian Data API<\/title>/i
  )
  assert.match(
    stripHtml(html),
    /OpenSyria developer resources and Syrian datasets API/i
  )
  assert.match(html, /https:\/\/api\.opensyria\.org\/docs/i)
  assert.match(html, /https:\/\/api\.opensyria\.org\/openapi\.json/i)

  const arabicResponse = await fetch(`${baseUrl}/ar/api`)
  const arabicHtml = await arabicResponse.text()

  assert.equal(arabicResponse.status, 200)
  assert.match(arabicHtml, /dir="rtl"/i)
  assert.match(
    stripHtml(arabicHtml),
    /موارد OpenSyria للمطورين وواجهة البيانات السورية/
  )
}

async function verifyArabicHomepage(baseUrl) {
  const response = await fetch(`${baseUrl}/ar`)
  const html = await response.text()

  assert.equal(response.status, 200)
  assert.match(html, /dir="rtl"/i)
  assert.match(html, /موارد OpenSyria للمطورين وواجهات API والوكلاء/)
}

async function verifyNotFoundResponses(baseUrl) {
  for (const path of [
    "/this-agent-path-does-not-exist",
    "/ar/this-agent-path-does-not-exist",
    "/this-agent-file-does-not-exist.txt",
  ]) {
    const response = await fetch(`${baseUrl}${path}`)
    const html = await response.text()

    assert.equal(response.status, 404, `${path} must return a real HTTP 404`)
    assert.match(response.headers.get("content-type") ?? "", /text\/html/i)
    assert.doesNotMatch(html, /data-agent-recovery="markdown"/i)
    assert.doesNotMatch(html, /# OpenSyria 404 recovery/i)
    assert.match(html, /https:\/\/opensyria\.org\/api/i)
    assert.match(html, /https:\/\/opensyria\.org\/sitemap\.xml/i)
    assert.match(html, /https:\/\/opensyria\.org\/llms\.txt/i)
  }

  const localizedResponse = await fetch(
    `${baseUrl}/datasets/this-dataset-does-not-exist`
  )
  const localizedHtml = await localizedResponse.text()

  assert.equal(localizedResponse.status, 404)
  assert.match(
    localizedResponse.headers.get("content-type") ?? "",
    /text\/html/i
  )
  assert.doesNotMatch(localizedHtml, /data-agent-recovery="markdown"/i)
  assert.doesNotMatch(localizedHtml, /# OpenSyria 404 recovery/i)

  const markdownResponse = await fetch(
    `${baseUrl}/this-markdown-agent-path-does-not-exist`,
    {
      headers: {
        Accept: "text/markdown",
        "User-Agent": "ora-agent/1.0",
      },
    }
  )
  const markdown = await markdownResponse.text()

  assert.equal(markdownResponse.status, 404)
  assert.match(
    markdownResponse.headers.get("content-type") ?? "",
    /text\/markdown/i
  )
  assert.match(markdown, /^# OpenSyria 404 recovery/)
  assert.match(markdown, /https:\/\/opensyria\.org\/sitemap\.xml/i)
  assert.doesNotMatch(markdown, /<html/i)

  const headResponse = await fetch(
    `${baseUrl}/this-head-agent-path-does-not-exist`,
    {
      method: "HEAD",
    }
  )
  assert.equal(headResponse.status, 404)
}

async function verifyMachineReadableFiles(baseUrl) {
  const robots = await fetchText(baseUrl, "/robots.txt", 200, /text\/plain/i)

  for (const crawler of crawlerUserAgents.map((userAgent) =>
    userAgent.replace(/\/.*$/, "")
  )) {
    assert.match(
      robots,
      new RegExp(`User-agent: ${escapeRegExp(crawler)}\\nAllow: /`, "i")
    )
  }
  assert.match(robots, /Sitemap: https:\/\/opensyria\.org\/sitemap\.xml/i)

  const llms = await fetchText(baseUrl, "/llms.txt", 200, /text\/plain/i)
  assert.match(llms, /## OpenSyria Developer Resources/i)
  assert.match(llms, /\/auth\.md/i)
  assert.match(
    llms,
    /does not currently offer webhooks or a public MCP server/i
  )

  const markdownIndex = await fetchText(
    baseUrl,
    "/index.md",
    200,
    /text\/markdown/i
  )
  assert.equal(markdownIndex, llms)

  await fetchText(baseUrl, "/auth.md", 200, /text\/markdown/i)

  const apiCatalog = await fetchJson(
    baseUrl,
    "/.well-known/api-catalog",
    200,
    /application\/linkset\+json/i
  )
  assert.ok(Array.isArray(apiCatalog.linkset))

  const skillsIndex = await fetchJson(
    baseUrl,
    "/.well-known/agent-skills/index.json",
    200,
    /application\/json/i
  )
  assert.equal(
    skillsIndex.$schema,
    "https://agentskills.io/schemas/agent-skills-index-v0.2.json"
  )
  assert.equal(skillsIndex.skills.length, 2)

  await fetchText(
    baseUrl,
    "/.well-known/agent-skills/opensyria-api/SKILL.md",
    200,
    /text\/markdown/i
  )
  await fetchText(
    baseUrl,
    "/.well-known/agent-skills/opensyria-datasets/SKILL.md",
    200,
    /text\/markdown/i
  )

  for (const path of [
    "/.well-known/mcp/server-card.json",
    "/.well-known/mcp/server-cards.json",
    "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-protected-resource",
    "/.well-known/openid-configuration",
  ]) {
    const problem = await fetchJson(
      baseUrl,
      path,
      404,
      /application\/problem\+json/i
    )
    assert.equal(problem.status, 404)
  }

  await fetchText(baseUrl, "/sitemap.xml", 200, /application\/xml|text\/xml/i)
  const health = await fetchJson(baseUrl, "/health", 200, /application\/json/i)
  assert.equal(health.ok, true)
}

async function verifyDatasetsApi() {
  const docsResponse = await fetch("https://api.opensyria.org/docs", {
    headers: { "User-Agent": "ora-agent/1.0" },
  })
  assert.equal(docsResponse.status, 200)
  assert.match(docsResponse.headers.get("content-type") ?? "", /text\/html/i)

  const openApiResponse = await fetch(
    "https://api.opensyria.org/openapi.json",
    {
      headers: { "User-Agent": "ora-agent/1.0" },
    }
  )
  assert.equal(openApiResponse.status, 200)
  assert.match(
    openApiResponse.headers.get("content-type") ?? "",
    /application\/json/i
  )
  const openApi = await openApiResponse.json()
  assert.match(openApi.openapi, /^3\.1\./)

  const healthResponse = await fetch("https://api.opensyria.org/health", {
    headers: { "User-Agent": "ora-agent/1.0" },
  })
  assert.equal(healthResponse.status, 200)
  assert.match(
    healthResponse.headers.get("content-type") ?? "",
    /application\/json/i
  )
}

async function verifyPublicAssets(baseUrl) {
  const assets = [
    ["/-/opengraph-image.png", /image\/png/i],
    ["/-/twitter-image.png", /image\/png/i],
    ["/apple-icon.png", /image\/png/i],
    ["/icon0.svg", /image\/svg\+xml/i],
    ["/icon1.png", /image\/png/i],
    ["/opengraph-image.png", /image\/png/i],
    ["/sy.svg", /image\/svg\+xml/i],
    ["/twitter-image.png", /image\/png/i],
    ["/web-app-manifest-192x192.png", /image\/png/i],
    ["/web-app-manifest-512x512.png", /image\/png/i],
  ]

  for (const [path, contentType] of assets) {
    const response = await fetch(`${baseUrl}${path}`)

    assert.equal(response.status, 200, `${path} must remain publicly reachable`)
    assert.match(
      response.headers.get("content-type") ?? "",
      contentType,
      `${path} returned an unexpected content type`
    )
  }

  const manifest = await fetchJson(
    baseUrl,
    "/manifest.json",
    200,
    /application\/manifest\+json|application\/json/i
  )
  assert.equal(manifest.name, "OpenSyria")
}

async function fetchText(baseUrl, path, status, contentType) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "User-Agent": "ora-agent/1.0" },
  })
  const body = await response.text()

  assert.equal(response.status, status, `${path} returned an unexpected status`)
  assert.match(
    response.headers.get("content-type") ?? "",
    contentType,
    `${path} returned an unexpected content type`
  )

  if (path !== "/robots.txt" && path !== "/sitemap.xml") {
    assert.match(
      response.headers.get("link") ?? "",
      /<\/\.well-known\/api-catalog>|<https:\/\/api\.opensyria\.org\/docs>/i,
      `${path} must advertise discovery links`
    )
  }

  return body
}

async function fetchJson(baseUrl, path, status, contentType) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "User-Agent": "ora-agent/1.0" },
  })

  assert.equal(response.status, status, `${path} returned an unexpected status`)
  assert.match(
    response.headers.get("content-type") ?? "",
    contentType,
    `${path} returned an unexpected content type`
  )

  return response.json()
}

function stripHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|#38);/gi, "&")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function getAvailablePort() {
  const server = createServer()
  server.unref()
  server.listen(0, "127.0.0.1")
  await once(server, "listening")

  const address = server.address()
  assert.ok(address && typeof address === "object")
  const { port } = address

  server.close()
  await once(server, "close")

  return port
}
