import { agentDiscoveryLinkHeader } from "@/lib/agent-discovery"
import { getNotFoundRecoveryMarkdown } from "@/lib/not-found-recovery"

type NotFoundRouteContext = Readonly<{
  params: Promise<{
    locale: string
    rest: string[]
  }>
}>

const notFoundCopy = {
  ar: {
    description:
      "المورد المطلوب غير موجود. استخدم الفهارس العامة التالية للمتابعة.",
    direction: "rtl",
    language: "ar",
    recovery: "فهرس الاستعادة للوكلاء والعملاء الآليين",
    title: "الصفحة غير موجودة",
  },
  en: {
    description:
      "The requested OpenSyria resource does not exist. Use these public indexes to continue.",
    direction: "ltr",
    language: "en",
    recovery: "Recovery index for agents and automated clients",
    title: "Page not found",
  },
} as const

export async function GET(request: Request, { params }: NotFoundRouteContext) {
  const { locale } = await params
  const copy = locale === "ar" ? notFoundCopy.ar : notFoundCopy.en
  const markdown = getNotFoundRecoveryMarkdown()

  if (request.headers.get("accept")?.toLowerCase().includes("text/markdown")) {
    return new Response(markdown, {
      headers: notFoundHeaders("text/markdown; charset=utf-8", copy.language),
      status: 404,
    })
  }

  return new Response(getNotFoundHtml(copy, markdown), {
    headers: notFoundHeaders("text/html; charset=utf-8", copy.language),
    status: 404,
  })
}

export async function HEAD(_: Request, context: NotFoundRouteContext) {
  const { locale } = await context.params
  const language = locale === "ar" ? "ar" : "en"

  return new Response(null, {
    headers: notFoundHeaders("text/html; charset=utf-8", language),
    status: 404,
  })
}

function notFoundHeaders(contentType: string, language: string) {
  return {
    "Cache-Control": "public, max-age=3600",
    "Content-Language": language,
    "Content-Type": contentType,
    Link: agentDiscoveryLinkHeader,
    "X-Robots-Tag": "noindex, follow",
  }
}

function getNotFoundHtml(
  copy: (typeof notFoundCopy)[keyof typeof notFoundCopy],
  markdown: string
) {
  return `<!doctype html>
<html lang="${copy.language}" dir="${copy.direction}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, follow">
    <title>${copy.title} | OpenSyria</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f8f7ef; color: #1e2219; }
      main { width: min(100% - 3rem, 48rem); margin: 0 auto; padding: 5rem 0; }
      .brand, a { color: #087a55; }
      .brand { font-size: 1.25rem; font-weight: 700; }
      .code { margin-top: 0.75rem; color: #087a55; font-weight: 600; }
      h1 { margin: 1rem 0 0; font-size: clamp(2.25rem, 7vw, 3.5rem); line-height: 1.1; }
      p { max-width: 40rem; line-height: 1.7; }
      nav { margin-top: 2rem; }
      ul { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; padding-inline-start: 1.25rem; }
      a { font-weight: 600; text-underline-offset: 0.2em; }
      section { margin-top: 2rem; border: 1px solid #d8d8cb; border-radius: 0.5rem; padding: 1rem; background: #fff; }
      h2 { margin: 0; font-size: 1.125rem; }
      pre { max-width: 100%; margin: 1rem 0 0; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; border-radius: 0.375rem; background: #1e2219; color: #f8f7ef; padding: 1rem; font-size: 0.75rem; line-height: 1.6; direction: ltr; text-align: left; }
      @media (prefers-color-scheme: dark) {
        body { background: #171a14; color: #f8f7ef; }
        section { border-color: #3d4138; background: #20241c; }
        pre { background: #0f110d; }
      }
    </style>
  </head>
  <body>
    <main>
      <a class="brand" href="https://opensyria.org/">OpenSyria</a>
      <p class="code">404</p>
      <h1>${copy.title}</h1>
      <p>${copy.description}</p>
      <nav aria-label="OpenSyria recovery">
        <ul>
          <li><a href="https://opensyria.org/">Homepage</a></li>
          <li><a href="https://opensyria.org/datasets">Dataset catalog</a></li>
          <li><a href="https://opensyria.org/api">Developer resources</a></li>
          <li><a href="https://opensyria.org/sitemap.xml">Sitemap</a></li>
          <li><a href="https://opensyria.org/llms.txt">Agent guide</a></li>
        </ul>
      </nav>
      <section aria-labelledby="agent-recovery-title">
        <h2 id="agent-recovery-title">${copy.recovery}</h2>
        <pre data-agent-recovery="markdown"><code>${markdown}</code></pre>
      </section>
    </main>
  </body>
</html>`
}
