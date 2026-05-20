"use client";

import { getSupabaseBrowserClient } from "./supabaseClient";

const ROI_LOCAL_KEY = "apt-roi-saved-groups";
const DECK_LOCAL_KEY = "apt-deck-briefs";

export type SaveMode = "local" | "account";

export type StoreResult<T> = {
  data: T;
  mode: SaveMode;
  message?: string;
};

type AnyRecord = Record<string, unknown>;

function nowIso() {
  return new Date().toISOString();
}

function readLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as T[];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function normalizeRoiPlan(plan: AnyRecord) {
  const now = nowIso();
  const name = String(plan.name ?? plan.group_name ?? "ROI plan");
  return {
    ...plan,
    id: plan.id ?? crypto.randomUUID(),
    name,
    group_name: String(plan.group_name ?? name),
    scenarios: Array.isArray(plan.scenarios) ? plan.scenarios : [],
    created_at: plan.created_at ?? plan.createdAt ?? now,
    updated_at: plan.updated_at ?? plan.updatedAt ?? now,
    createdAt: plan.createdAt ?? plan.created_at ?? now,
    updatedAt: plan.updatedAt ?? plan.updated_at ?? now,
    savedAt: plan.savedAt ?? plan.updated_at ?? plan.updatedAt ?? now,
  };
}

function normalizeDeckBrief(brief: AnyRecord) {
  const now = nowIso();
  const name = String(brief.name ?? brief.deck_name ?? "Custom deck brief");
  return {
    ...brief,
    id: brief.id ?? crypto.randomUUID(),
    name,
    deck_name: String(brief.deck_name ?? name),
    template_type: String(brief.template_type ?? brief.deckType ?? brief.deck_type ?? "Customer deck"),
    customer: String(brief.customer ?? ""),
    audience: String(brief.audience ?? ""),
    meeting_date: String(brief.meeting_date ?? brief.meetingDate ?? ""),
    generated_outline: brief.generated_outline ?? brief.generatedOutline ?? [],
    generatedOutline: brief.generatedOutline ?? brief.generated_outline ?? [],
    created_at: brief.created_at ?? brief.createdAt ?? now,
    updated_at: brief.updated_at ?? brief.updatedAt ?? now,
    createdAt: brief.createdAt ?? brief.created_at ?? now,
    updatedAt: brief.updatedAt ?? brief.updated_at ?? now,
  };
}

async function getAuthenticatedUser() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { supabase: null, user: null };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

function saveLocalRoiPlan(plan: AnyRecord, message?: string): StoreResult<AnyRecord> {
  // Temporary local save. Replace with database-backed saved groups after auth is added.
  const item = normalizeRoiPlan(plan);
  const current = readLocal<AnyRecord>(ROI_LOCAL_KEY);
  const next = [item, ...current.filter((saved) => saved.id !== item.id)];
  writeLocal(ROI_LOCAL_KEY, next);
  return { data: item, mode: "local", message };
}

function saveLocalDeckBrief(brief: AnyRecord, message?: string): StoreResult<AnyRecord> {
  // Temporary local save. Replace with database-backed saved groups after auth is added.
  const item = normalizeDeckBrief(brief);
  const current = readLocal<AnyRecord>(DECK_LOCAL_KEY);
  const next = [item, ...current.filter((saved) => saved.id !== item.id)];
  writeLocal(DECK_LOCAL_KEY, next);
  return { data: item, mode: "local", message };
}

export async function saveRoiPlan(plan: AnyRecord): Promise<StoreResult<AnyRecord>> {
  const item = normalizeRoiPlan(plan);
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return saveLocalRoiPlan(item);

  const { error } = await supabase.from("roi_plans").upsert({
    id: item.id,
    user_id: user.id,
    name: item.name ?? item.group_name,
    data: item,
    created_at: item.created_at,
    updated_at: item.updated_at,
  });

  if (error) return saveLocalRoiPlan(item, "Could not save right now. Your plan is still available in saved plans.");
  return { data: item, mode: "account" };
}

export async function listRoiPlans(): Promise<StoreResult<AnyRecord[]>> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { data: readLocal(ROI_LOCAL_KEY), mode: "local" };

  const { data, error } = await supabase
    .from("roi_plans")
    .select("id,name,data,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: readLocal(ROI_LOCAL_KEY), mode: "local", message: "Could not load saved plans right now." };
  }

  return {
    data: (data ?? []).map((row) =>
      normalizeRoiPlan({ ...asRecord(row.data), id: row.id, name: row.name, created_at: row.created_at, updated_at: row.updated_at }),
    ),
    mode: "account",
  };
}

export async function loadRoiPlan(id: string): Promise<StoreResult<AnyRecord | null>> {
  const listed = await listRoiPlans();
  return { data: listed.data.find((plan) => plan.id === id) ?? null, mode: listed.mode, message: listed.message };
}

export async function duplicateRoiPlan(id: string): Promise<StoreResult<AnyRecord | null>> {
  const loaded = await loadRoiPlan(id);
  if (!loaded.data) return { data: null, mode: loaded.mode, message: loaded.message };
  const now = nowIso();
  return saveRoiPlan({
    ...loaded.data,
    id: crypto.randomUUID(),
    name: `${String(loaded.data.name ?? "ROI plan")} copy`,
    group_name: `${String(loaded.data.group_name ?? loaded.data.name ?? "ROI plan")} copy`,
    created_at: now,
    createdAt: now,
  });
}

export async function deleteRoiPlan(id: string): Promise<StoreResult<boolean>> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    writeLocal(ROI_LOCAL_KEY, readLocal<AnyRecord>(ROI_LOCAL_KEY).filter((plan) => plan.id !== id));
    return { data: true, mode: "local" };
  }

  const { error } = await supabase.from("roi_plans").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { data: false, mode: "account", message: "Could not update account saves. Local saves are unchanged." };
  return { data: true, mode: "account" };
}

export async function saveDeckBrief(brief: AnyRecord): Promise<StoreResult<AnyRecord>> {
  const item = normalizeDeckBrief(brief);
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return saveLocalDeckBrief(item);

  const { error } = await supabase.from("deck_briefs").upsert({
    id: item.id,
    user_id: user.id,
    name: item.name ?? item.deck_name,
    template_type: item.template_type,
    data: item,
    generated_outline: item.generated_outline ?? item.generatedOutline ?? [],
    created_at: item.created_at,
    updated_at: item.updated_at,
  });

  if (error) return saveLocalDeckBrief(item, "Could not save right now. Your deck is still available in saved decks.");
  return { data: item, mode: "account" };
}

export async function listDeckBriefs(): Promise<StoreResult<AnyRecord[]>> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return { data: readLocal(DECK_LOCAL_KEY), mode: "local" };

  const { data, error } = await supabase
    .from("deck_briefs")
    .select("id,name,template_type,data,generated_outline,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: readLocal(DECK_LOCAL_KEY), mode: "local", message: "Could not load saved decks right now." };
  }

  return {
    data: (data ?? []).map((row) =>
      normalizeDeckBrief({
        ...asRecord(row.data),
        id: row.id,
        name: row.name,
        template_type: row.template_type,
        generated_outline: row.generated_outline,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    ),
    mode: "account",
  };
}

export async function loadDeckBrief(id: string): Promise<StoreResult<AnyRecord | null>> {
  const listed = await listDeckBriefs();
  return { data: listed.data.find((brief) => brief.id === id) ?? null, mode: listed.mode, message: listed.message };
}

export async function duplicateDeckBrief(id: string): Promise<StoreResult<AnyRecord | null>> {
  const loaded = await loadDeckBrief(id);
  if (!loaded.data) return { data: null, mode: loaded.mode, message: loaded.message };
  const now = nowIso();
  return saveDeckBrief({
    ...loaded.data,
    id: crypto.randomUUID(),
    name: `${String(loaded.data.name ?? "Custom deck brief")} copy`,
    deck_name: `${String(loaded.data.deck_name ?? loaded.data.name ?? "Custom deck brief")} copy`,
    created_at: now,
    createdAt: now,
  });
}

export async function deleteDeckBrief(id: string): Promise<StoreResult<boolean>> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    writeLocal(DECK_LOCAL_KEY, readLocal<AnyRecord>(DECK_LOCAL_KEY).filter((brief) => brief.id !== id));
    return { data: true, mode: "local" };
  }

  const { error } = await supabase.from("deck_briefs").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { data: false, mode: "account", message: "Could not update account saves. Local saves are unchanged." };
  return { data: true, mode: "account" };
}
