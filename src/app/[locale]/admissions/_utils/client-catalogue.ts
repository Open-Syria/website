import type { AdmissionsData, CatalogueId } from "./types"

// Literal imports produce separate immutable assets; only the selected route is downloaded.
export async function loadCatalogue(
  catalogue: CatalogueId
): Promise<AdmissionsData> {
  switch (catalogue) {
    case "service-scientific":
      return (await import("../_data/2026-2027/service-scientific.json"))
        .default as AdmissionsData
    case "service-literary":
      return (await import("../_data/2026-2027/service-literary.json"))
        .default as AdmissionsData
    case "service-sharia":
      return (await import("../_data/2026-2027/service-sharia.json"))
        .default as AdmissionsData
    case "service-vocational":
      return (await import("../_data/2026-2027/service-vocational.json"))
        .default as AdmissionsData

    case "special-scientific":
      return (await import("../_data/2026-2027/special-scientific.json"))
        .default as AdmissionsData
    case "special-literary":
      return (await import("../_data/2026-2027/special-literary.json"))
        .default as AdmissionsData
    case "special-sharia":
      return (await import("../_data/2026-2027/special-sharia.json"))
        .default as AdmissionsData
    case "special-vocational":
      return (await import("../_data/2026-2027/special-vocational.json"))
        .default as AdmissionsData

    case "older-scientific":
      return (await import("../_data/2026-2027/older-scientific.json"))
        .default as AdmissionsData
    case "older-literary":
      return (await import("../_data/2026-2027/older-literary.json"))
        .default as AdmissionsData
    case "older-vocational":
      return (await import("../_data/2026-2027/older-vocational.json"))
        .default as AdmissionsData
    case "older-foreign-scientific":
      return (await import("../_data/2026-2027/older-foreign-scientific.json"))
        .default as AdmissionsData
    case "older-foreign-literary":
      return (await import("../_data/2026-2027/older-foreign-literary.json"))
        .default as AdmissionsData
    case "older-foreign-vocational":
      return (await import("../_data/2026-2027/older-foreign-vocational.json"))
        .default as AdmissionsData

    case "sharia":
      return (await import("../_data/2026-2027/sharia.json"))
        .default as AdmissionsData
    case "non-syrian-vocational":
      return (await import("../_data/2026-2027/non-syrian-vocational.json"))
        .default as AdmissionsData
    case "foreign-scientific":
      return (await import("../_data/2026-2027/foreign-scientific.json"))
        .default as AdmissionsData
    case "foreign-vocational":
      return (await import("../_data/2026-2027/foreign-vocational.json"))
        .default as AdmissionsData
    case "foreign-literary":
      return (await import("../_data/2026-2027/foreign-literary.json"))
        .default as AdmissionsData
    case "non-syrian-scientific":
      return (await import("../_data/2026-2027/non-syrian-scientific.json"))
        .default as AdmissionsData
    case "non-syrian-literary":
      return (await import("../_data/2026-2027/non-syrian-literary.json"))
        .default as AdmissionsData
    case "literary":
      return (await import("../_data/2026-2027/literary.json"))
        .default as AdmissionsData
    case "vocational":
      return (await import("../_data/2026-2027/vocational.json"))
        .default as AdmissionsData
    default:
      return (await import("../_data/2026-2027/scientific.json"))
        .default as AdmissionsData
  }
}
