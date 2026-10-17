import { canBringInBooks, readSession } from "@/lib/chama/page-session";
import { templateWorkbook } from "@/lib/import/workbook";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSession();
  if (!session) return Response.json({ message: "Sign in as the treasurer first." }, { status: 401 });
  if (!canBringInBooks(session.role)) {
    return Response.json({ message: "Only the treasurer or the chair can download the template." }, { status: 403 });
  }
  const bytes = await templateWorkbook();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="pamoja-members.xlsx"',
    },
  });
}
