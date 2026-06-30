import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"

export default createMiddleware(routing)

export const config = {
  matcher: "/((?!api|trpc|health|_next|_vercel|.*\\..*).*)",
}
