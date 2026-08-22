import { getAuthenticatedUser, getSupabaseServiceClient } from "../../../../lib/serverAuth";

export const dynamic = "force-dynamic";

const DECK_TEMPLATE_MAX_BYTES = 20 * 1024 * 1024;
const DECK_TEMPLATE_BUCKET = "deck-template-uploads";
const allowedExtensions = new Set([".pptx", ".potx"]);

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "deck-template.pptx";
}

function fileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.ok) {
    return Response.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ ok: false, message: "Template storage is temporarily unavailable." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Upload a PowerPoint template file." }, { status: 400 });
  }
  if (!allowedExtensions.has(fileExtension(file.name))) {
    return Response.json({ ok: false, message: "Upload a .pptx or .potx PowerPoint template." }, { status: 400 });
  }
  if (file.size > DECK_TEMPLATE_MAX_BYTES) {
    return Response.json({ ok: false, message: "Template file must be under 20MB." }, { status: 413 });
  }

  const path = `${auth.user.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error } = await supabase.storage.from(DECK_TEMPLATE_BUCKET).upload(path, file, {
    contentType: file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    upsert: false,
  });

  if (error) {
    return Response.json({ ok: false, message: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, path });
}
