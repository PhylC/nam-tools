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

export function uploadGeneratedDeck(file: File, userId: string) {
  return uploadPrivateFile("generated-decks", file, userId);
}
