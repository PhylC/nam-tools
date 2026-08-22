"use client";

import { getSupabaseBrowserClient } from "./supabaseClient";

async function uploadPrivateFile(bucket: string, file: File, userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { path: null, error: "File upload is temporarily unavailable." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
  });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

export function uploadDeckTemplate(file: File, userId: string) {
  return uploadPrivateFileViaApi("/api/storage/deck-template", file, userId, "Template storage is temporarily unavailable.");
}

export async function downloadDeckTemplate(path: string, filename: string) {
  return downloadPrivateFileViaApi(
    "/api/storage/deck-template",
    path,
    filename,
    "Template download is temporarily unavailable.",
    "Saved template file could not be found. Re-upload it or use a one-off template.",
  );
}

export async function downloadGeneratedDeck(path: string, filename: string) {
  return downloadPrivateFileViaApi(
    "/api/storage/generated-deck",
    path,
    filename,
    "Deck download is temporarily unavailable.",
    "Saved deck file could not be found. Create a new copy from the saved deck record.",
  );
}

async function downloadPrivateFileViaApi(endpoint: string, path: string, filename: string, unavailableMessage: string, downloadErrorMessage: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { file: null, error: unavailableMessage };
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return { file: null, error: "Sign in again to download the file." };
  }

  const response = await fetch(`${endpoint}?path=${encodeURIComponent(path)}&filename=${encodeURIComponent(filename)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    return { file: null, error: payload?.message ?? downloadErrorMessage };
  }

  const blob = await response.blob();
  return {
    file: new File([blob], filename, {
      type: blob.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }),
    error: null,
  };
}

export function uploadRoiSpreadsheet(file: File, userId: string) {
  return uploadPrivateFile("roi-spreadsheet-uploads", file, userId);
}

async function uploadPrivateFileViaApi(endpoint: string, file: File, userId: string, unavailableMessage: string) {
  void userId;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { path: null, error: unavailableMessage };
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return { path: null, error: "Sign in again to save the file." };
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; path?: string; message?: string } | null;
  if (!response.ok || !payload?.ok || !payload.path) {
    return { path: null, error: payload?.message ?? unavailableMessage };
  }

  return { path: payload.path, error: null };
}

export async function uploadGeneratedDeck(file: File, userId: string) {
  return uploadPrivateFileViaApi("/api/storage/generated-deck", file, userId, "File storage is temporarily unavailable.");
}
