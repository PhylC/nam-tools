import { getAuthenticatedUser, getSupabaseServiceClient } from "../../../../lib/serverAuth";

export const dynamic = "force-dynamic";

const GENERATED_DECK_MAX_BYTES = 25 * 1024 * 1024;
const GENERATED_DECK_BUCKET = "generated-decks";

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "generated-deck.pptx";
}

function requestedStoragePath(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("path")?.trim() ?? "";
}

function downloadFilename(request: Request) {
  const url = new URL(request.url);
  return safeFilename(url.searchParams.get("filename") ?? "generated-deck.pptx");
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.ok) {
    return Response.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ ok: false, message: "File storage is temporarily unavailable." }, { status: 503 });
  }

  const path = requestedStoragePath(request);
  if (!path || !path.startsWith(`${auth.user.id}/`)) {
    return Response.json({ ok: false, message: "Deck file could not be found for this account." }, { status: 404 });
  }

  const { data, error } = await supabase.storage.from(GENERATED_DECK_BUCKET).download(path);
  if (error || !data) {
    return Response.json({ ok: false, message: "Saved deck file could not be found. Create a new copy from the saved deck record." }, { status: 404 });
  }

  return new Response(data, {
    headers: {
      "content-disposition": `attachment; filename="${downloadFilename(request)}"`,
      "content-type": data.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
  });
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
