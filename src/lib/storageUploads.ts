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
  return uploadPrivateFile("deck-template-uploads", file, userId);
}

export function uploadRoiSpreadsheet(file: File, userId: string) {
  return uploadPrivateFile("roi-spreadsheet-uploads", file, userId);
}

export async function uploadGeneratedDeck(file: File, userId: string) {
  void userId;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { path: null, error: "File upload is temporarily unavailable." };
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return { path: null, error: "Sign in again to save the generated deck file." };
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/storage/generated-deck", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; path?: string; message?: string } | null;
  if (!response.ok || !payload?.ok || !payload.path) {
    return { path: null, error: payload?.message ?? "File storage is temporarily unavailable." };
  }

  return { path: payload.path, error: null };
}
