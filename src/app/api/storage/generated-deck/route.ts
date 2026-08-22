import { getAuthenticatedUser, getSupabaseServiceClient } from "../../../../lib/serverAuth";

export const dynamic = "force-dynamic";

const GENERATED_DECK_MAX_BYTES = 25 * 1024 * 1024;
const GENERATED_DECK_BUCKET = "generated-decks";

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "generated-deck.pptx";
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.ok) {
    return Response.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ ok: false, message: "File storage is temporarily unavailable." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Upload a generated deck file." }, { status: 400 });
  }
  if (file.size > GENERATED_DECK_MAX_BYTES) {
    return Response.json({ ok: false, message: "Generated deck file is too large." }, { status: 413 });
  }

  const path = `${auth.user.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error } = await supabase.storage.from(GENERATED_DECK_BUCKET).upload(path, file, {
    contentType: file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    upsert: false,
  });

  if (error) {
    return Response.json({ ok: false, message: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, path });
}
