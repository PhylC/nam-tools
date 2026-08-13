import { beforeEach, describe, expect, it, vi } from "vitest";

type AnyRecord = Record<string, unknown>;

const mockState = vi.hoisted(() => ({
  client: null as AnyRecord | null,
}));

vi.mock("./supabaseClient", () => ({
  getSupabaseBrowserClient: () => mockState.client,
}));

import {
  deleteSavedScenario,
  listSavedAnalyses,
  listSavedScenarios,
  saveAnalysis,
  saveScenario,
} from "./saveStore";

function createSupabaseMock(options: { userId?: string; upsertError?: boolean; selectError?: boolean } = {}) {
  const userId = options.userId ?? "user-1";
  const tables: Record<string, AnyRecord[]> = {
    saved_analyses: [],
    saved_scenarios: [],
  };

  const client = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })),
    },
    from: vi.fn((table: string) => ({
      upsert: vi.fn(async (payload: AnyRecord) => {
        if (options.upsertError) return { error: { message: "upsert failed" } };
        tables[table] = [payload, ...(tables[table] ?? []).filter((row) => row.id !== payload.id)];
        return { error: null };
      }),
      select: vi.fn(() => ({
        eq: vi.fn((column: string, value: unknown) => ({
          order: vi.fn(async () => {
            if (options.selectError) return { data: null, error: { message: "select failed" } };
            return {
              data: (tables[table] ?? []).filter((row) => row[column] === value),
              error: null,
            };
          }),
        })),
      })),
      delete: vi.fn(() => {
        const filters: Record<string, unknown> = {};
        const query = {
          eq: vi.fn((column: string, value: unknown) => {
            filters[column] = value;
            if (Object.keys(filters).length < 2) return query;
            tables[table] = (tables[table] ?? []).filter((row) =>
              Object.entries(filters).some(([filterColumn, filterValue]) => row[filterColumn] !== filterValue),
            );
            return Promise.resolve({ error: null });
          }),
        };
        return query;
      }),
    })),
  };

  return { client, tables };
}

describe("saveStore", () => {
  beforeEach(() => {
    mockState.client = null;
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        clear: vi.fn(() => storage.clear()),
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        removeItem: vi.fn((key: string) => storage.delete(key)),
        setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      },
    });
    window.localStorage.clear();
  });

  it("saves analyses locally when no Supabase client is available", async () => {
    const saved = await saveAnalysis({
      title: "Margin check",
      calculatorId: "gross-margin",
      calculatorName: "Gross margin",
      outputs: { margin: "32%" },
    });

    expect(saved.mode).toBe("local");
    expect(saved.data).toMatchObject({
      title: "Margin check",
      calculatorId: "gross-margin",
      saveMode: "local",
    });

    const listed = await listSavedAnalyses();
    expect(listed.mode).toBe("local");
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0]).toMatchObject({ title: "Margin check", saveMode: "local" });
  });

  it("saves analyses to the account and merges device-only saves when listing", async () => {
    await saveAnalysis({ title: "Device only analysis", calculatorId: "local" });

    const { client, tables } = createSupabaseMock();
    mockState.client = client;

    const saved = await saveAnalysis({
      title: "Account analysis",
      calculatorId: "account",
      calculatorName: "Account calculator",
      sourcePath: "/calculators/account",
    });

    expect(saved.mode).toBe("account");
    expect(tables.saved_analyses).toHaveLength(1);
    expect(tables.saved_analyses[0]).toMatchObject({
      user_id: "user-1",
      title: "Account analysis",
      calculator_id: "account",
      calculator_name: "Account calculator",
      source_path: "/calculators/account",
    });

    const listed = await listSavedAnalyses();
    expect(listed.mode).toBe("account");
    expect(listed.data.map((item) => item.title)).toEqual(["Account analysis", "Device only analysis"]);
    expect(listed.data.map((item) => item.saveMode)).toEqual(["account", "local"]);
  });

  it("falls back to a device scenario save when account upsert fails", async () => {
    const { client, tables } = createSupabaseMock({ upsertError: true });
    mockState.client = client;

    const saved = await saveScenario({
      title: "Fallback scenario",
      scenarioData: { name: "Fallback scenario" },
      sourcePath: "/roi-tool",
    });

    expect(saved.mode).toBe("local");
    expect(saved.message).toBe("Saved on this device. Account sync is unavailable right now.");
    expect(saved.data).toMatchObject({ title: "Fallback scenario", saveMode: "local" });
    expect(tables.saved_scenarios).toHaveLength(0);

    const listed = await listSavedScenarios();
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0]).toMatchObject({ title: "Fallback scenario", saveMode: "local" });
  });

  it("deletes account-backed scenarios by id and user", async () => {
    const { client, tables } = createSupabaseMock();
    mockState.client = client;

    const saved = await saveScenario({
      title: "Account scenario",
      scenarioData: { name: "Account scenario" },
    });

    expect(tables.saved_scenarios).toHaveLength(1);

    const deleted = await deleteSavedScenario(String(saved.data.id));

    expect(deleted).toMatchObject({ data: true, mode: "account" });
    expect(tables.saved_scenarios).toHaveLength(0);
  });

  it("shows device saves only when account listing fails", async () => {
    await saveScenario({ title: "Device scenario" });

    const { client } = createSupabaseMock({ selectError: true });
    mockState.client = client;

    const listed = await listSavedScenarios();

    expect(listed.mode).toBe("local");
    expect(listed.message).toBe("Could not load account saves. Showing device saves only.");
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0]).toMatchObject({ title: "Device scenario", saveMode: "local" });
  });
});
