import type { SVGProps } from "react"

function OpenSyriaHorizontalLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      viewBox="0 0 370 96"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="var(--primary)" height="60" rx="16" width="60" x="6" y="18" />
      <text
        fill="var(--primary-foreground)"
        fontFamily="var(--font-display), var(--font-body), Arial, sans-serif"
        fontSize="27"
        fontWeight="800"
        textAnchor="middle"
        x="36"
        y="57"
      >
        OS
      </text>
      <path
        d="M 16 68 H 56"
        stroke="var(--background)"
        strokeLinecap="round"
        strokeOpacity="0.82"
        strokeWidth="4"
      />
      <text
        fill="var(--foreground)"
        fontFamily="var(--font-display), var(--font-body), Arial, sans-serif"
        fontSize="45"
        fontWeight="800"
        x="80"
        y="62"
      >
        Open
        <tspan fill="var(--primary)">Syria</tspan>
      </text>
    </svg>
  )
}

export { OpenSyriaHorizontalLogo }
