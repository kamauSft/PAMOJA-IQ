import { canBringInBooks, readSession } from "@/lib/chama/page-session";
import { saveImport } from "@/lib/import/save";
import { readUpload } from "@/lib/import/workbook";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return Response.json({ message: "Sign in as the treasurer first." }, { status: 401 });
  if (!canBringInBooks(session.role)) {
    return Response.json({ message: "Only the treasurer or the chair can upload the register." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const mode = form?.get("mode");
  if (!(file instanceof File)) return Response.json({ message: "Choose an Excel file." }, { status: 400 });
  const filename = file.name.toLowerCase();
  if (!filename.endsWith(".xlsx") && !filename.endsWith(".csv")) {
    return Response.json({ message: "Save the file as .xlsx and upload it again." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return Response.json({ message: "That file is larger than 10 MB." }, { status: 400 });

  const workbook = await readUpload(Buffer.from(await file.arrayBuffer()), file.name);
  if (workbook.members.length === 0 && workbook.contributions.length === 0) {
    return Response.json(
      {
        message: "No members or payments were found. Use the Members sheet with Full Name and Phone columns.",
        problems: workbook.problems,
      },
      { status: 422 },
    );
  }

  if (mode === "save") {
    const saved = await saveImport({
      chamaId: session.chamaId,
      actor: { membershipId: session.membershipId, personId: session.personId, role: session.role },
      workbook,
      fileName: file.name,
    });
    return Response.json(saved);
  }

  return Response.json({
    members: workbook.members.slice(0, 100).map((member) => ({
      memberNo: member.memberNo,
      name: member.name,
      phone: member.phone,
      role: member.role,
    })),
    memberCount: workbook.members.length,
    contributionCount: workbook.contributions.length,
    problems: workbook.problems.slice(0, 40),
  });
}
