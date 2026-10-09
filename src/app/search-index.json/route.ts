import { searchIndex } from "@/lib/content";

// Se genera una sola vez en build y se sirve como archivo estático.
export const dynamic = "force-static";

export function GET() {
  return Response.json(searchIndex());
}
