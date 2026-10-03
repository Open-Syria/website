import "server-only"

import { cacheLife } from "next/cache"
import foreignLiterary from "../_data/2026-2027/foreign-literary.json"
import foreignScientific from "../_data/2026-2027/foreign-scientific.json"
import foreignVocational from "../_data/2026-2027/foreign-vocational.json"
import literary from "../_data/2026-2027/literary.json"
import nonSyrianLiterary from "../_data/2026-2027/non-syrian-literary.json"
import nonSyrianScientific from "../_data/2026-2027/non-syrian-scientific.json"
import nonSyrianVocational from "../_data/2026-2027/non-syrian-vocational.json"
import older_foreign_literary from "../_data/2026-2027/older-foreign-literary.json"
import older_foreign_scientific from "../_data/2026-2027/older-foreign-scientific.json"
import older_foreign_vocational from "../_data/2026-2027/older-foreign-vocational.json"
import older_literary from "../_data/2026-2027/older-literary.json"
import older_scientific from "../_data/2026-2027/older-scientific.json"
import older_vocational from "../_data/2026-2027/older-vocational.json"
import scientific from "../_data/2026-2027/scientific.json"
import service_literary from "../_data/2026-2027/service-literary.json"
import service_scientific from "../_data/2026-2027/service-scientific.json"
import service_sharia from "../_data/2026-2027/service-sharia.json"
import service_vocational from "../_data/2026-2027/service-vocational.json"
import sharia from "../_data/2026-2027/sharia.json"
import special_literary from "../_data/2026-2027/special-literary.json"
import special_scientific from "../_data/2026-2027/special-scientific.json"
import special_sharia from "../_data/2026-2027/special-sharia.json"
import special_vocational from "../_data/2026-2027/special-vocational.json"
import vocational from "../_data/2026-2027/vocational.json"
import { validateAdmissionsData } from "./schema"
import type { CatalogueId } from "./types"

export async function loadAdmissionsData(
  catalogue: CatalogueId = "scientific"
) {
  "use cache"

  // Fixed, versioned data changes with a deployment, never with a student's answers.
  cacheLife("max")
  return validateAdmissionsData(
    {
      scientific,
      "service-scientific": service_scientific,
      "service-literary": service_literary,
      "service-sharia": service_sharia,
      "service-vocational": service_vocational,

      "special-scientific": special_scientific,
      "special-literary": special_literary,
      "special-sharia": special_sharia,
      "special-vocational": special_vocational,

      "older-scientific": older_scientific,
      "older-literary": older_literary,
      "older-vocational": older_vocational,
      "older-foreign-scientific": older_foreign_scientific,
      "older-foreign-literary": older_foreign_literary,
      "older-foreign-vocational": older_foreign_vocational,

      sharia,
      "foreign-scientific": foreignScientific,
      "foreign-literary": foreignLiterary,
      "foreign-vocational": foreignVocational,
      literary,
      vocational,
      "non-syrian-scientific": nonSyrianScientific,
      "non-syrian-literary": nonSyrianLiterary,
      "non-syrian-vocational": nonSyrianVocational,
    }[catalogue]
  )
}
