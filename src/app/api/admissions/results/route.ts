import "server-only"
import { handleResultsRequest } from "@/lib/exam-results/service"

export async function POST(request: Request) {
  return handleResultsRequest(request)
}
