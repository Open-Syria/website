export function GET() {
  return Response.json(
    {
      ok: true,
      service: "opensyria-website",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
