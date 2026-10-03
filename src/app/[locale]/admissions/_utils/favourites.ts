// Year-scoped and shared across languages. No marks or personal answers are stored here.
export const favouritesKey = "opensyria:admissions:2026-2027:favourites"

export function readFavourites(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "null")
    if (!Array.isArray(value) || value.length > 20000) return []
    return [
      ...new Set(
        value.filter(
          (id): id is string =>
            typeof id === "string" &&
            /^(?:(?:service-scientific|service-literary|service-sharia|service-vocational|special-scientific|special-literary|special-sharia|special-vocational|older-scientific|older-literary|older-vocational|older-foreign-scientific|older-foreign-literary|older-foreign-vocational|literary|sharia|vocational|non-syrian-scientific|non-syrian-literary|non-syrian-vocational|foreign-scientific|foreign-literary|foreign-vocational)-)?(public|private)-\d{2}-\d{3}$/.test(
              id
            )
        )
      ),
    ]
  } catch {
    return []
  }
}
