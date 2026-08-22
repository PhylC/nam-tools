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
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { file: null, error: "Template download is temporarily unavailable." };
  }

  const { data, error } = await supabase.storage.from("deck-template-uploads").download(path);
  if (error || !data) {
    return { file: null, error: error?.message ?? "Could not download the saved template." };
  }

  return {
    file: new File([data], filename, {
      type: data.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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
