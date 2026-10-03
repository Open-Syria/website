import { mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const root = fileURLToPath(new URL("../", import.meta.url))
const outputDirectory = path.join(
  root,
  "src/app/[locale]/admissions/_assets/social"
)
const fontDirectory = path.join(root, "scripts/assets/ibm-plex-sans-arabic")
const width = 1200
const colors = {
  cream: "#fbfaf3",
  ink: "#173d31",
  green: "#007156",
  muted: "#566b60",
  gold: "#d8c998",
}

function illustration(height, rtl) {
  const panelX = rtl ? 0 : 784
  const middleY = height / 2 - 5

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="#fff" stroke-opacity=".08"/>
        </pattern>
      </defs>
      <rect width="1200" height="${height}" fill="${colors.cream}"/>
      <g transform="translate(${panelX} 0)">
        <rect width="416" height="${height}" fill="${colors.ink}"/>
        <rect width="416" height="${height}" fill="url(#grid)"/>
        <circle cx="208" cy="${middleY}" r="174" fill="none" stroke="#86b29c" stroke-opacity=".28"/>
        <circle cx="208" cy="${middleY}" r="137" fill="none" stroke="#86b29c" stroke-opacity=".2"/>
        <g transform="translate(60 ${middleY - 120})">
          <path d="M38 224H260M49 211H249" fill="none" stroke="${colors.gold}" stroke-width="3"/>
          <path d="M57 109L149 66L241 109Z" fill="${colors.cream}"/>
          <path d="M49 120H249" stroke="${colors.cream}" stroke-width="8"/>
          <path d="M67 195H231" stroke="${colors.cream}" stroke-width="8"/>
          <g fill="${colors.cream}">
            <rect x="69" y="133" width="19" height="52" rx="2"/>
            <rect x="116" y="133" width="19" height="52" rx="2"/>
            <rect x="163" y="133" width="19" height="52" rx="2"/>
            <rect x="210" y="133" width="19" height="52" rx="2"/>
          </g>
          <path d="M149 67V22M149 22H183L176 33L183 44H149" fill="none" stroke="${colors.gold}" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="149" cy="96" r="6" fill="${colors.green}"/>
          <path d="M22 79V93M15 86H29M271 150V164M264 157H278" stroke="${colors.gold}" stroke-width="2"/>
        </g>
        <g transform="translate(149 ${height - 131})" fill="none" stroke="${colors.gold}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M0 16L11 27L30 5M51 16L62 27L81 5M102 16L113 27L132 5"/>
        </g>
      </g>
      <path d="M${rtl ? 480 : 64} ${height - 89}H${rtl ? 1136 : 720}" stroke="#d9dfd4"/>
    </svg>
  `)
}

function escapeMarkup(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

async function textLayer(
  value,
  { x, y, size, color, align = "left", bold = false, maxWidth = 656 }
) {
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${color}">${escapeMarkup(value)}</span>`,
      font: `IBM Plex Sans Arabic ${bold ? "SemiBold" : "Regular"} ${size}`,
      fontfile: path.join(
        fontDirectory,
        `IBMPlexSansArabic-${bold ? "SemiBold" : "Regular"}.ttf`
      ),
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true })

  if (info.width > maxWidth) {
    throw new Error(`Social image text is too wide (${info.width}px): ${value}`)
  }

  return {
    input: data,
    left: Math.round(align === "right" ? x - info.width : x),
    top: y,
  }
}

async function render(locale, kind, height, copy) {
  const rtl = locale === "ar"
  const x = rtl ? 1136 : 64
  const align = rtl ? "right" : "left"
  const offset = height === 600 ? -15 : 0
  const common = { x, align }
  const layers = []

  // Render sequentially so each bundled font is registered before it is reused.
  for (const [text, options] of [
    [
      "OpenSyria",
      { ...common, y: 48, size: 29, color: colors.green, bold: true },
    ],
    [
      copy.eyebrow,
      { ...common, y: 126 + offset, size: 20, color: colors.green, bold: true },
    ],
    [
      copy.titleLine1,
      {
        ...common,
        y: 180 + offset,
        size: rtl ? 67 : 68,
        color: colors.ink,
        bold: true,
      },
    ],
    [
      copy.titleLine2,
      {
        ...common,
        y: 266 + offset,
        size: rtl ? 67 : 68,
        color: colors.ink,
        bold: true,
      },
    ],
    [
      copy.descriptionLine1,
      { ...common, y: 369 + offset, size: 27, color: colors.muted },
    ],
    [
      copy.descriptionLine2,
      { ...common, y: 410 + offset, size: 27, color: colors.muted },
    ],
    [
      copy.branches,
      { ...common, y: 477 + offset, size: 23, color: colors.green, bold: true },
    ],
    [
      locale === "ar"
        ? "opensyria.org/ar/admissions"
        : "opensyria.org/admissions",
      { ...common, y: height - 59, size: 22, color: colors.ink },
    ],
    [
      copy.season,
      {
        x: rtl ? 72 : 856,
        y: 51,
        size: 36,
        color: colors.gold,
        bold: true,
        maxWidth: 300,
      },
    ],
  ]) {
    layers.push(await textLayer(text, options))
  }

  const output = path.join(outputDirectory, `admissions-${kind}-${locale}.png`)
  await sharp(illustration(height, rtl))
    .composite(layers)
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(output)
  console.log(`Generated ${path.relative(root, output)} (${width}×${height})`)
}

await mkdir(outputDirectory, { recursive: true })
for (const locale of ["ar", "en"]) {
  const messages = JSON.parse(
    await readFile(path.join(root, `messages/${locale}.json`), "utf8")
  )
  await render(locale, "og", 630, messages.Admissions.social)
  await render(locale, "twitter", 600, messages.Admissions.social)
}
