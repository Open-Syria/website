import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

const colors = {
  accent: "#b7a56a",
  background: "#fbfaf3",
  border: "#ddd8c7",
  foreground: "#1b2217",
  grid: "#e8e3d3",
  muted: "#536457",
  primary: "#007156",
  primaryDark: "#143820",
}

const socialAlt =
  "OpenSyria social preview showing the OpenSyria wordmark and Syria map."

function cleanInlineSvg(svg) {
  return svg
    .replace(/\s+(?:inkscape|sodipodi):[\w-]+="[^"]*"/g, "")
    .replace(/\s+xmlns(?::\w+)?="[^"]*"/g, "")
}

function normalizeSvg(svg) {
  return `${svg.replace(/[ \t]+$/gm, "").trim()}\n`
}

async function getSyriaMapGroup() {
  const source = await readFile(path.join(root, "public", "sy.svg"), "utf8")
  const match = source.match(/<g\s+id="geoBoundaries-SYR-ADM1"[\s\S]*?<\/g>/u)

  if (!match) {
    throw new Error("Could not find Syria map group in public/sy.svg")
  }

  return cleanInlineSvg(match[0])
}

function defs() {
  return `
    <defs>
      <linearGradient id="mapGradient" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${colors.primary}" />
        <stop offset="0.52" stop-color="${colors.primary}" />
        <stop offset="1" stop-color="${colors.primaryDark}" />
      </linearGradient>
      <linearGradient id="accentGradient" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${colors.primary}" />
        <stop offset="1" stop-color="${colors.accent}" />
      </linearGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 H 0 V 48" fill="none" stroke="${colors.grid}" stroke-width="1" />
      </pattern>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="14" flood-color="${colors.foreground}" flood-opacity="0.10" stdDeviation="18" />
      </filter>
    </defs>
  `
}

function mapLayer(mapGroup, { opacity, scale, x, y }) {
  const strokeWidth = 1.4 / scale

  return `
    <g
      fill="url(#mapGradient)"
      opacity="${opacity}"
      stroke="${colors.background}"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="${strokeWidth}"
      transform="translate(${x} ${y}) scale(${scale})"
    >
      ${mapGroup}
    </g>
  `
}

function socialSvg({ height, mapGroup }) {
  const isTwitter = height === 600
  const titleY = isTwitter ? 260 : 274
  const subtitleY = isTwitter ? 336 : 354
  const domainY = height - 76
  const mapY = isTwitter ? 70 : 86
  const circleY = isTwitter ? 300 : 320
  const mapScale = isTwitter ? 0.54 : 0.55
  const mapX = isTwitter ? 810 : 814

  return `
    <svg
      width="1200"
      height="${height}"
      viewBox="0 0 1200 ${height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${defs()}
      <rect width="1200" height="${height}" fill="${colors.background}" />
      <rect width="1200" height="${height}" fill="url(#grid)" opacity="0.82" />
      <circle cx="968" cy="${circleY}" r="318" fill="${colors.primary}" opacity="0.075" />
      <circle cx="968" cy="${circleY}" r="206" fill="none" stroke="${colors.primary}" stroke-opacity="0.18" stroke-width="1.5" />
      ${mapLayer(mapGroup, {
        opacity: "0.7",
        scale: mapScale,
        x: mapX,
        y: mapY,
      })}

      <g filter="url(#softShadow)">
        <rect
          x="84"
          y="78"
          width="302"
          height="54"
          rx="12"
          fill="${colors.background}"
          stroke="${colors.border}"
        />
        <circle cx="113" cy="105" r="8" fill="${colors.primary}" />
        <text
          x="134"
          y="113"
          fill="${colors.primary}"
          font-family="Inter, Arial, sans-serif"
          font-size="21"
          font-weight="700"
        >Open civic intelligence</text>
      </g>

      <text
        x="84"
        y="${titleY}"
        fill="${colors.foreground}"
        font-family="Sora, Inter, Arial, sans-serif"
        font-size="94"
        font-weight="800"
      >OpenSyria</text>
      <text
        x="88"
        y="${subtitleY}"
        fill="${colors.muted}"
        font-family="Inter, Arial, sans-serif"
        font-size="34"
        font-weight="500"
      >
        <tspan x="88" dy="0">Syrian open data and APIs</tspan>
        <tspan x="88" dy="46">for developers, maps, research,</tspan>
        <tspan x="88" dy="46">journalism, and civic tools.</tspan>
      </text>
      <text
        x="88"
        y="${domainY}"
        fill="${colors.primaryDark}"
        font-family="Inter, Arial, sans-serif"
        font-size="30"
        font-weight="800"
      >opensyria.org</text>
      <path d="M 88 ${domainY + 24} H 348" stroke="url(#accentGradient)" stroke-linecap="round" stroke-width="8" />
    </svg>
  `
}

function iconSvg({ mapGroup, size }) {
  return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${defs()}
      <rect width="1000" height="1000" fill="${colors.background}" />
      <rect width="1000" height="1000" fill="url(#grid)" opacity="0.72" />
      <circle cx="500" cy="500" r="365" fill="${colors.primary}" opacity="0.08" />
      <circle cx="500" cy="500" r="275" fill="none" stroke="${colors.primary}" stroke-opacity="0.18" stroke-width="4" />
      ${mapLayer(mapGroup, {
        opacity: "0.2",
        scale: 0.76,
        x: 244,
        y: 128,
      })}
      <text
        x="500"
        y="565"
        font-family="Sora, Inter, Arial, sans-serif"
        font-size="124"
        font-weight="800"
        text-anchor="middle"
      >
        <tspan fill="${colors.foreground}">Open</tspan><tspan fill="${colors.primary}">Syria</tspan>
      </text>
      <path d="M 266 638 H 734" stroke="url(#accentGradient)" stroke-linecap="round" stroke-width="22" />
    </svg>
  `
}

async function renderPng(svg, outputPath, size) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await sharp(Buffer.from(svg))
    .resize(size ? { height: size, width: size } : undefined)
    .png({ compressionLevel: 9 })
    .toFile(outputPath)
}

async function main() {
  const mapGroup = await getSyriaMapGroup()
  const openGraph = normalizeSvg(socialSvg({ height: 630, mapGroup }))
  const twitter = normalizeSvg(socialSvg({ height: 600, mapGroup }))
  const icon = normalizeSvg(iconSvg({ mapGroup, size: 1000 }))

  const outputs = [
    ["src/app/opengraph-image.png", openGraph, undefined],
    ["src/app/[locale]/opengraph-image.png", openGraph, undefined],
    ["src/app/twitter-image.png", twitter, undefined],
    ["src/app/[locale]/twitter-image.png", twitter, undefined],
    ["public/web-app-manifest-192x192.png", icon, 192],
    ["public/web-app-manifest-512x512.png", icon, 512],
    ["src/app/icon1.png", icon, 96],
    ["src/app/apple-icon.png", icon, 180],
  ]

  for (const [relativePath, svg, size] of outputs) {
    await renderPng(svg, path.join(root, relativePath), size)
  }

  await writeFile(path.join(root, "src/app/icon0.svg"), icon)

  for (const relativePath of [
    "src/app/opengraph-image.alt.txt",
    "src/app/[locale]/opengraph-image.alt.txt",
    "src/app/twitter-image.alt.txt",
    "src/app/[locale]/twitter-image.alt.txt",
  ]) {
    await writeFile(path.join(root, relativePath), `${socialAlt}\n`)
  }
}

await main()
