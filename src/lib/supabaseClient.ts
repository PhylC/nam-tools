"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let hasLoggedSupabaseConfig = false;

function getSupabaseUrlInfo(url: string | undefined) {
  if (!url) return { host: "missing", projectRef: "missing" };
  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      projectRef: parsed.hostname.split(".")[0] || "unknown",
    };
  } catch {
    return { host: "invalid URL", projectRef: "invalid URL" };
  }
}

export function getSupabaseEnvStatus() {
  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasPasswordResetRedirect: Boolean(process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL),
  };
}

export function getSupabaseDebugInfo() {
  return getSupabaseUrlInfo(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function logSupabaseConfig() {
  if (process.env.NODE_ENV === "production" || hasLoggedSupabaseConfig) return;
  hasLoggedSupabaseConfig = true;
  const envStatus = getSupabaseEnvStatus();
  const urlInfo = getSupabaseDebugInfo();
  console.info("Supabase browser auth config", {
    hasUrl: envStatus.hasUrl,
    hasAnonKey: envStatus.hasAnonKey,
    hasPasswordResetRedirect: envStatus.hasPasswordResetRedirect,
    urlHost: urlInfo.host,
    projectRef: urlInfo.projectRef,
  });
}

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  logSupabaseConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

// Service role key must only be used server-side.
