import { supabase } from "@/integrations/supabase/client";
import { SEED, SEED_BRANDS } from "./seed";
import type { Brand, Memory } from "./types";

export const MEMORY_CAP = 200;

export interface Bank {
  brands: Brand[];
  memories: Memory[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function toBrand(row: any): Brand {
  return { id: row.id, name: row.name, category: row.industry ?? "", tone: row.tone ?? "", isDemo: !!row.is_demo };
}

function toMemory(row: any): Memory {
  return {
    id: row.id,
    brandId: row.brand_id,
    hook: row.hook,
    body: row.body ?? "",
    audience: row.audience ?? "",
    channel: row.channel ?? "",
    festival: row.festival ?? "",
    goal: row.goal ?? "",
    predictedCtr: row.predicted_ctr ?? null,
    actualCtr: row.actual_ctr ?? 0,
    outcome: row.outcome,
    source: row.source,
    competitor: row.competitor ?? undefined,
    year: row.year,
    createdAt: Date.parse(row.created_at),
  };
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export async function fetchBank(): Promise<Bank> {
  const [{ data: brands, error: e1 }, { data: mems, error: e2 }] = await Promise.all([
    supabase.from("brands").select("*").order("created_at"),
    supabase.from("memories").select("*").order("created_at"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { brands: (brands ?? []).map(toBrand), memories: (mems ?? []).map(toMemory) };
}

/** Insert the three demo brands and their 2025 campaigns for the signed-in user. */
export async function seedDemo(): Promise<Bank> {
  const userId = await requireUserId();
  const { data: inserted, error } = await supabase
    .from("brands")
    .insert(SEED_BRANDS.map((b) => ({ user_id: userId, name: b.name, tone: b.tone, industry: b.category, is_demo: true })))
    .select();
  if (error) throw error;
  const idByKey = new Map((inserted ?? []).map((row: any, i: number) => [SEED_BRANDS[i]!.key, row.id as string]));
  const rows = SEED.map((m) => ({
    user_id: userId,
    brand_id: idByKey.get(m.brandKey)!,
    hook: m.hook,
    body: m.body,
    audience: m.audience,
    channel: m.channel,
    festival: m.festival,
    goal: m.goal,
    predicted_ctr: m.predictedCtr,
    actual_ctr: m.actualCtr,
    outcome: m.outcome,
    source: m.source,
    competitor: m.competitor ?? null,
    year: m.year,
  }));
  const { error: e2 } = await supabase.from("memories").insert(rows);
  if (e2) throw e2;
  return fetchBank();
}

/** Wipe demo brands (their memories cascade) and reseed. Custom brands are kept. */
export async function resetDemo(): Promise<Bank> {
  const { error } = await supabase.from("brands").delete().eq("is_demo", true);
  if (error) throw error;
  return seedDemo();
}

export async function createBrand(name: string, tone: string, industry: string): Promise<Brand> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("brands")
    .insert({ user_id: userId, name, tone, industry, is_demo: false })
    .select()
    .single();
  if (error) throw error;
  return toBrand(data);
}

export type NewMemory = Omit<Memory, "id" | "brandId" | "createdAt">;

function toRow(userId: string, brandId: string, m: NewMemory) {
  return {
    user_id: userId,
    brand_id: brandId,
    hook: m.hook,
    body: m.body,
    audience: m.audience,
    channel: m.channel,
    festival: m.festival,
    goal: m.goal,
    predicted_ctr: m.predictedCtr,
    actual_ctr: m.actualCtr,
    outcome: m.outcome,
    source: m.source,
    competitor: m.competitor ?? null,
    year: m.year,
  };
}

export async function addMemory(brandId: string, memory: NewMemory): Promise<Memory> {
  const userId = await requireUserId();
  const { data, error } = await supabase.from("memories").insert(toRow(userId, brandId, memory)).select().single();
  if (error) throw error;
  return toMemory(data);
}

export async function addMemories(brandId: string, memories: NewMemory[]): Promise<Memory[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("memories")
    .insert(memories.map((m) => toRow(userId, brandId, m)))
    .select();
  if (error) throw error;
  return (data ?? []).map(toMemory);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
