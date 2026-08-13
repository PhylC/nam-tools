"use client";

import { getSupabaseBrowserClient } from "./supabaseClient";

const ROI_LOCAL_KEY = "apt-roi-saved-groups";
const DECK_LOCAL_KEY = "apt-deck-briefs";
const ANALYSIS_LOCAL_KEY = "aptSavedAnalyses";
const SCENARIO_LOCAL_KEY = "aptSavedScenarios";

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
    saveMode: plan.saveMode ?? "local",
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
    saveMode: brief.saveMode ?? "local",
  };
}

function normalizeSavedAnalysis(analysis: AnyRecord) {
  const now = nowIso();
  const title = String(analysis.title ?? analysis.name ?? analysis.calculatorName ?? "Saved analysis");
  return {
    version: Number(analysis.version ?? 1),
    type: "analysis",
    calculatorId: String(analysis.calculatorId ?? "calculator"),
    calculatorName: String(analysis.calculatorName ?? "Calculator"),
    inputs: asRecord(analysis.inputs),
    outputs: asRecord(analysis.outputs),
    defaults: asRecord(analysis.defaults),
    summaryText: String(analysis.summaryText ?? ""),
    sourcePath: String(analysis.sourcePath ?? "/calculators"),
    ...analysis,
    id: analysis.id ?? crypto.randomUUID(),
    title,
    name: title,
    createdAt: analysis.createdAt ?? analysis.created_at ?? now,
    updatedAt: analysis.updatedAt ?? analysis.updated_at ?? now,
    created_at: analysis.created_at ?? analysis.createdAt ?? now,
    updated_at: analysis.updated_at ?? analysis.updatedAt ?? now,
    saveMode: analysis.saveMode ?? "local",
  };
}

function normalizeSavedScenario(scenario: AnyRecord) {
  const now = nowIso();
  const title = String(scenario.title ?? scenario.name ?? scenario.scenarioName ?? "ROI scenario");
  return {
    version: Number(scenario.version ?? 1),
    type: "scenario",
    toolId: String(scenario.toolId ?? "roi-tool"),
    toolName: String(scenario.toolName ?? "ROI planner"),
    scenarioData: asRecord(scenario.scenarioData),
    inputs: asRecord(scenario.inputs),
    outputs: asRecord(scenario.outputs),
    defaults: asRecord(scenario.defaults),
    sourcePath: String(scenario.sourcePath ?? "/roi-tool"),
    ...scenario,
    id: scenario.id ?? crypto.randomUUID(),
    title,
    name: title,
    createdAt: scenario.createdAt ?? scenario.created_at ?? now,
    updatedAt: scenario.updatedAt ?? scenario.updated_at ?? now,
    created_at: scenario.created_at ?? scenario.createdAt ?? now,
    updated_at: scenario.updated_at ?? scenario.updatedAt ?? now,
    saveMode: scenario.saveMode ?? "local",
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
  const item = normalizeRoiPlan({ ...plan, saveMode: "local" });
  const current = readLocal<AnyRecord>(ROI_LOCAL_KEY);
  const next = [item, ...current.filter((saved) => saved.id !== item.id)];
  writeLocal(ROI_LOCAL_KEY, next);
  return { data: item, mode: "local", message };
}

function saveLocalDeckBrief(brief: AnyRecord, message?: string): StoreResult<AnyRecord> {
  const item = normalizeDeckBrief({ ...brief, saveMode: "local" });
  const current = readLocal<AnyRecord>(DECK_LOCAL_KEY);
  const next = [item, ...current.filter((saved) => saved.id !== item.id)];
  writeLocal(DECK_LOCAL_KEY, next);
  return { data: item, mode: "local", message };
}

function saveLocalAnalysis(analysis: AnyRecord, message?: string): StoreResult<AnyRecord> {
  const item = normalizeSavedAnalysis({ ...analysis, saveMode: "local" });
  const current = readLocal<AnyRecord>(ANALYSIS_LOCAL_KEY);
  const next = [item, ...current.filter((saved) => saved.id !== item.id)];
  writeLocal(ANALYSIS_LOCAL_KEY, next);
  return { data: item, mode: "local", message };
}

function saveLocalScenario(scenario: AnyRecord, message?: string): StoreResult<AnyRecord> {
  const item = normalizeSavedScenario({ ...scenario, saveMode: "local" });
  const current = readLocal<AnyRecord>(SCENARIO_LOCAL_KEY);
  const next = [item, ...current.filter((saved) => saved.id !== item.id)];
  writeLocal(SCENARIO_LOCAL_KEY, next);
  return { data: item, mode: "local", message };
}

export async function saveAnalysis(analysis: AnyRecord): Promise<StoreResult<AnyRecord>> {
  const item = normalizeSavedAnalysis({ ...analysis, saveMode: "account" });
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return saveLocalAnalysis(item);

  const { error } = await supabase.from("saved_analyses").upsert({
    id: item.id,
    user_id: user.id,
    title: item.title,
    calculator_id: item.calculatorId,
    calculator_name: item.calculatorName,
    source_path: item.sourcePath,
    data: item,
    created_at: item.created_at,
    updated_at: item.updated_at,
  });

  if (error) return saveLocalAnalysis(item, "Saved on this device. Account sync is unavailable right now.");
  return { data: item, mode: "account" };
}

export async function listSavedAnalyses(): Promise<StoreResult<AnyRecord[]>> {
  const { supabase, user } = await getAuthenticatedUser();
  const localAnalyses = readLocal<AnyRecord>(ANALYSIS_LOCAL_KEY).map((analysis) => normalizeSavedAnalysis({ ...analysis, saveMode: "local" }));
  if (!supabase || !user) return { data: localAnalyses, mode: "local" };

  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id,title,calculator_id,calculator_name,source_path,data,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: localAnalyses, mode: "local", message: "Could not load account saves. Showing device saves only." };
  }

  return {
    data: [
      ...(data ?? []).map((row) =>
        normalizeSavedAnalysis({
          ...asRecord(row.data),
          id: row.id,
          title: row.title,
          calculatorId: row.calculator_id,
          calculatorName: row.calculator_name,
          sourcePath: row.source_path,
          created_at: row.created_at,
          updated_at: row.updated_at,
          saveMode: "account",
        }),
      ),
      ...localAnalyses.filter((localAnalysis) => !(data ?? []).some((row) => row.id === localAnalysis.id)),
    ],
    mode: "account",
  };
}

export async function loadSavedAnalysis(id: string): Promise<StoreResult<AnyRecord | null>> {
  const listed = await listSavedAnalyses();
  return { data: listed.data.find((analysis) => analysis.id === id) ?? null, mode: listed.mode, message: listed.message };
}

export async function duplicateSavedAnalysis(id: string): Promise<StoreResult<AnyRecord | null>> {
  const loaded = await loadSavedAnalysis(id);
  if (!loaded.data) return { data: null, mode: loaded.mode, message: loaded.message };
  const now = nowIso();
  return saveAnalysis({
    ...loaded.data,
    id: crypto.randomUUID(),
    title: `Copy of ${String(loaded.data.title ?? "Saved analysis")}`,
    name: `Copy of ${String(loaded.data.title ?? loaded.data.name ?? "Saved analysis")}`,
    createdAt: now,
    updatedAt: now,
    created_at: now,
    updated_at: now,
  });
}

export async function deleteSavedAnalysis(id: string): Promise<StoreResult<boolean>> {
  writeLocal(ANALYSIS_LOCAL_KEY, readLocal<AnyRecord>(ANALYSIS_LOCAL_KEY).filter((analysis) => analysis.id !== id));
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    return { data: true, mode: "local" };
  }

  const { error } = await supabase.from("saved_analyses").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { data: false, mode: "account", message: "Could not update account saves. Local saves are unchanged." };
  return { data: true, mode: "account" };
}

export async function saveScenario(scenario: AnyRecord): Promise<StoreResult<AnyRecord>> {
  const item = normalizeSavedScenario({ ...scenario, saveMode: "account" });
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return saveLocalScenario(item);

  const { error } = await supabase.from("saved_scenarios").upsert({
    id: item.id,
    user_id: user.id,
    title: item.title,
    tool_id: item.toolId,
    tool_name: item.toolName,
    source_path: item.sourcePath,
    data: item,
    created_at: item.created_at,
    updated_at: item.updated_at,
  });

  if (error) return saveLocalScenario(item, "Saved on this device. Account sync is unavailable right now.");
  return { data: item, mode: "account" };
}

export async function listSavedScenarios(): Promise<StoreResult<AnyRecord[]>> {
  const { supabase, user } = await getAuthenticatedUser();
  const localScenarios = readLocal<AnyRecord>(SCENARIO_LOCAL_KEY).map((scenario) => normalizeSavedScenario({ ...scenario, saveMode: "local" }));
  if (!supabase || !user) return { data: localScenarios, mode: "local" };

  const { data, error } = await supabase
    .from("saved_scenarios")
    .select("id,title,tool_id,tool_name,source_path,data,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: localScenarios, mode: "local", message: "Could not load account saves. Showing device saves only." };
  }

  return {
    data: [
      ...(data ?? []).map((row) =>
        normalizeSavedScenario({
          ...asRecord(row.data),
          id: row.id,
          title: row.title,
          toolId: row.tool_id,
          toolName: row.tool_name,
          sourcePath: row.source_path,
          created_at: row.created_at,
          updated_at: row.updated_at,
          saveMode: "account",
        }),
      ),
      ...localScenarios.filter((localScenario) => !(data ?? []).some((row) => row.id === localScenario.id)),
    ],
    mode: "account",
  };
}

export async function loadSavedScenario(id: string): Promise<StoreResult<AnyRecord | null>> {
  const listed = await listSavedScenarios();
  return { data: listed.data.find((scenario) => scenario.id === id) ?? null, mode: listed.mode, message: listed.message };
}

export async function duplicateSavedScenario(id: string): Promise<StoreResult<AnyRecord | null>> {
  const loaded = await loadSavedScenario(id);
  if (!loaded.data) return { data: null, mode: loaded.mode, message: loaded.message };
  const now = nowIso();
  return saveScenario({
    ...loaded.data,
    id: crypto.randomUUID(),
    title: `Copy of ${String(loaded.data.title ?? "ROI scenario")}`,
    name: `Copy of ${String(loaded.data.title ?? loaded.data.name ?? "ROI scenario")}`,
    createdAt: now,
    updatedAt: now,
    created_at: now,
    updated_at: now,
  });
}

export async function deleteSavedScenario(id: string): Promise<StoreResult<boolean>> {
  writeLocal(SCENARIO_LOCAL_KEY, readLocal<AnyRecord>(SCENARIO_LOCAL_KEY).filter((scenario) => scenario.id !== id));
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    return { data: true, mode: "local" };
  }

  const { error } = await supabase.from("saved_scenarios").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { data: false, mode: "account", message: "Could not update account saves. Local saves are unchanged." };
  return { data: true, mode: "account" };
}

export async function saveRoiPlan(plan: AnyRecord): Promise<StoreResult<AnyRecord>> {
  const item = normalizeRoiPlan({ ...plan, saveMode: "account" });
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

  if (error) return saveLocalRoiPlan(item, "Saved on this device. Account sync is unavailable right now.");
  return { data: item, mode: "account" };
}

export async function listRoiPlans(): Promise<StoreResult<AnyRecord[]>> {
  const { supabase, user } = await getAuthenticatedUser();
  const localPlans = readLocal<AnyRecord>(ROI_LOCAL_KEY).map((plan) => normalizeRoiPlan({ ...plan, saveMode: "local" }));
  if (!supabase || !user) return { data: localPlans, mode: "local" };

  const { data, error } = await supabase
    .from("roi_plans")
    .select("id,name,data,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: localPlans, mode: "local", message: "Could not load account saves. Showing device saves only." };
  }

  return {
    data: [
      ...(data ?? []).map((row) =>
        normalizeRoiPlan({ ...asRecord(row.data), id: row.id, name: row.name, created_at: row.created_at, updated_at: row.updated_at, saveMode: "account" }),
      ),
      ...localPlans.filter((localPlan) => !(data ?? []).some((row) => row.id === localPlan.id)),
    ],
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
  writeLocal(ROI_LOCAL_KEY, readLocal<AnyRecord>(ROI_LOCAL_KEY).filter((plan) => plan.id !== id));
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    return { data: true, mode: "local" };
  }

  const { error } = await supabase.from("roi_plans").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { data: false, mode: "account", message: "Could not update account saves. Local saves are unchanged." };
  return { data: true, mode: "account" };
}

export async function saveDeckBrief(brief: AnyRecord): Promise<StoreResult<AnyRecord>> {
  const item = normalizeDeckBrief({ ...brief, saveMode: "account" });
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

  if (error) return saveLocalDeckBrief(item, "Saved on this device. Account sync is unavailable right now.");
  return { data: item, mode: "account" };
}

export async function listDeckBriefs(): Promise<StoreResult<AnyRecord[]>> {
  const { supabase, user } = await getAuthenticatedUser();
  const localDecks = readLocal<AnyRecord>(DECK_LOCAL_KEY).map((brief) => normalizeDeckBrief({ ...brief, saveMode: "local" }));
  if (!supabase || !user) return { data: localDecks, mode: "local" };

  const { data, error } = await supabase
    .from("deck_briefs")
    .select("id,name,template_type,data,generated_outline,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: localDecks, mode: "local", message: "Could not load account saves. Showing device saves only." };
  }

  return {
    data: [
      ...(data ?? []).map((row) =>
        normalizeDeckBrief({
          ...asRecord(row.data),
          id: row.id,
          name: row.name,
          template_type: row.template_type,
          generated_outline: row.generated_outline,
          created_at: row.created_at,
          updated_at: row.updated_at,
          saveMode: "account",
        }),
      ),
      ...localDecks.filter((localDeck) => !(data ?? []).some((row) => row.id === localDeck.id)),
    ],
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
  writeLocal(DECK_LOCAL_KEY, readLocal<AnyRecord>(DECK_LOCAL_KEY).filter((brief) => brief.id !== id));
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) {
    return { data: true, mode: "local" };
  }

  const { error } = await supabase.from("deck_briefs").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { data: false, mode: "account", message: "Could not update account saves. Local saves are unchanged." };
  return { data: true, mode: "account" };
}
