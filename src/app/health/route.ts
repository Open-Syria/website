export function GET() {
  const version = process.env.DEPLOYMENT_VERSION?.trim() || "development"

  return Response.json(
    {
      ok: true,
      service: "opensyria-website",
      version,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
