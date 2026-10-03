import assert from "node:assert/strict"

const decode = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    ([tag]) =>
      Object.fromEntries(
        [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [
          key.toLowerCase(),
          decode(value),
        ])
      )
  )
}

async function getPage(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: { "User-Agent": "Googlebot" },
  })
  assert.equal(response.status, 200, `${path} must return a page, not redirect`)
  assert.match(response.headers.get("content-type") ?? "", /text\/html/i)
  const html = await response.text()
  return { response, html, links: tags(html, "link"), meta: tags(html, "meta") }
}

function canonical(links) {
  const urls = links.filter((link) => link.rel === "canonical")
  assert.equal(urls.length, 1, "Every page must have exactly one canonical")
  // A host with an empty path and one with '/' are the same URL.
  return new URL(urls[0].href).href
}

function assertIndexable(page, path) {
  assert.doesNotMatch(
    page.response.headers.get("x-robots-tag") ?? "",
    /noindex/i,
    `Clean page must remain indexable: ${path}`
  )
  for (const meta of page.meta.filter((m) =>
    ["robots", "googlebot"].includes(m.name)
  )) {
    assert.doesNotMatch(meta.content, /noindex|nofollow/i, path)
  }
}

export async function verifySeo(baseUrl) {
  const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
  assert.equal(sitemapResponse.status, 200)
  const xml = await sitemapResponse.text()
  assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/)
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
    ([, entry]) => {
      const location = entry.match(/<loc>([^<]+)<\/loc>/)?.[1]
      assert.ok(location, "Sitemap entry needs a URL")
      return {
        url: new URL(decode(location)),
        alternates: tags(entry, "xhtml:link"),
      }
    }
  )
  assert.ok(
    entries.length >= 8,
    "Sitemap must include the main bilingual routes"
  )
  const sitemapUrls = new Set(entries.map(({ url }) => url.href))
  assert.equal(sitemapUrls.size, entries.length, "No duplicate sitemap URLs")
  const origin = entries[0].url.origin
  const robots = await (await fetch(`${baseUrl}/robots.txt`)).text()
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
  assert.doesNotMatch(
    robots,
    /^Disallow:\s*\S/m,
    "Pages and assets must be crawlable"
  )

  for (const path of ["/admissions", "/ar/admissions"]) {
    assert.ok(
      sitemapUrls.has(`${origin}${path}`),
      `${path} must be in the sitemap`
    )
  }

  const titles = new Set()
  const descriptions = new Set()
  const images = new Set()
  for (const { url, alternates } of entries) {
    assert.equal(url.protocol, "https:")
    assert.equal(url.origin, origin)
    assert.equal(url.search, "", "Sitemap must omit query variants")
    assert.equal(url.hash, "", "Sitemap must omit fragments")
    assert.doesNotMatch(url.pathname, /^\/en(?:\/|$)/)
    const page = await getPage(baseUrl, url.pathname)
    assertIndexable(page, url.pathname)
    assert.equal(canonical(page.links), url.href)
    const title = decode(page.html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "")
    const description = page.meta.find((m) => m.name === "description")?.content
    assert.ok(
      title && !titles.has(title),
      `Missing/duplicate title: ${url.pathname}`
    )
    assert.ok(
      description && !descriptions.has(description),
      `Missing/duplicate description: ${url.pathname}`
    )
    titles.add(title)
    descriptions.add(description)
    assert.equal([...page.html.matchAll(/<h1\b/gi)].length, 1, url.pathname)
    assert.equal(
      tags(page.html, "html")[0]?.lang,
      url.pathname.startsWith("/ar") ? "ar" : "en"
    )

    const expectedLanguages = new Map(
      alternates.map((link) => [link.hreflang, new URL(link.href).href])
    )
    assert.deepEqual([...expectedLanguages.keys()].sort(), [
      "ar",
      "en",
      "x-default",
    ])
    const actualLanguages = new Map(
      page.links
        .filter((link) => link.hreflang)
        .map((link) => [link.hreflang, new URL(link.href).href])
    )
    assert.deepEqual(
      actualLanguages,
      expectedLanguages,
      `Language URLs differ: ${url.pathname}`
    )
    for (const href of expectedLanguages.values())
      assert.ok(sitemapUrls.has(href))

    const metadata = new Map(
      page.meta.map((m) => [m.property ?? m.name, m.content])
    )
    assert.equal(new URL(metadata.get("og:url")).href, url.href)
    assert.ok(metadata.get("og:title") && metadata.get("og:description"))
    assert.ok(
      metadata.get("twitter:title") && metadata.get("twitter:description")
    )
    assert.equal(metadata.get("twitter:card"), "summary_large_image")
    for (const name of ["og:image", "twitter:image"]) {
      const image = new URL(metadata.get(name))
      assert.equal(image.protocol, "https:")
      assert.equal(image.origin, origin)
      images.add(image.pathname + image.search)
    }

    const graphs = [
      ...page.html.matchAll(
        /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
      ),
    ].map(([, json]) => JSON.parse(json))
    const nodes = graphs.flatMap((graph) => graph["@graph"] ?? [graph])
    for (const type of ["Organization", "WebSite", "WebPage"]) {
      assert.ok(
        nodes.some((node) => node["@type"] === type),
        `${url.pathname}: missing ${type}`
      )
    }
    const webPage = nodes.find((node) => node["@type"] === "WebPage")
    assert.equal(new URL(webPage.url).href, url.href)
    if (url.pathname.endsWith("/admissions")) {
      assert.ok(nodes.some((node) => node["@type"] === "BreadcrumbList"))
      const faq = nodes.find((node) => node["@type"] === "FAQPage")
      assert.ok(faq?.mainEntity.length > 0)
      for (const question of faq.mainEntity) {
        assert.ok(question.name && question.acceptedAnswer.text)
      }
    }
  }

  for (const path of images) {
    const response = await fetch(`${baseUrl}${path}`)
    assert.equal(response.status, 200, `Missing social image: ${path}`)
    assert.match(response.headers.get("content-type") ?? "", /image\//)
    assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex/)
    await response.arrayBuffer()
  }

  await verifyQueryIndexing(baseUrl, origin)
  console.log(
    `SEO checks passed for ${entries.length} clean sitemap URLs and query variants`
  )
}

async function verifyQueryIndexing(baseUrl, origin) {
  const params = [
    "q=medicine",
    "g=damascus",
    "f=health",
    "c=parallel",
    "s=all",
    "fav=true",
    "o=name",
    "p=2",
    "pp=%7B%22example%22%3A2%7D",
    `a=${encodeURIComponent(JSON.stringify({ previousGeneralAdmission: "no" }))}`,
    "unexpected=value",
    "q=",
  ]
  for (const path of ["/admissions", "/ar/admissions"]) {
    for (const query of params) {
      const page = await getPage(baseUrl, `${path}?${query}`)
      assert.equal(
        page.response.headers.get("x-robots-tag"),
        "noindex, follow",
        `${path}?${query}`
      )
      assert.equal(canonical(page.links), `${origin}${path}`)
    }
    // The same cached page must not inherit a query response's noindex header.
    assertIndexable(await getPage(baseUrl, path), path)
    assertIndexable(await getPage(baseUrl, `${path}?_rsc=transport`), path)
    const head = await fetch(`${baseUrl}${path}?q=medicine`, { method: "HEAD" })
    assert.equal(head.headers.get("x-robots-tag"), "noindex, follow")
  }
  for (const path of [
    "/",
    "/ar",
    "/datasets",
    "/ar/datasets/geography",
    "/api",
  ]) {
    const page = await getPage(baseUrl, `${path}?unexpected=value`)
    assert.equal(page.response.headers.get("x-robots-tag"), "noindex, follow")
    assert.equal(canonical(page.links), new URL(path, origin).href)
    assertIndexable(await getPage(baseUrl, path), path)
  }
  for (const [path, destination] of [
    ["/en/admissions?utm_source=test&q=medicine", "/admissions?q=medicine"],
    ["/ar/admissions?gclid=test", "/ar/admissions"],
    ["/admissions?UTM_Source=test", "/admissions"],
    ["/admissions/", "/admissions"],
  ]) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" })
    assert.equal(response.status, 308, path)
    const target = new URL(response.headers.get("location"), baseUrl)
    assert.equal(target.pathname + target.search, destination)
  }
}
