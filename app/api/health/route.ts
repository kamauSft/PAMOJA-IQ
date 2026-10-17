import packageJson from "../../../package.json";
import { brand } from "@/config/brand";
import { prismaRaw } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  try {
    await prismaRaw.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  return Response.json(
    {
      ok: db,
      name: brand.name,
      version: packageJson.version,
      db,
    },
    { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
