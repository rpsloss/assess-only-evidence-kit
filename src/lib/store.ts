import { create } from "zustand";
import { bumpFromBaseline, clonePack, createBlankPack, sealChain } from "./pack-factory";
import { buildExamplePack, hydrateExampleFiles } from "./example-pack";
import { parsePackJson } from "./parse-pack";
import type { EvidencePack } from "./types";
import { nowIso } from "./utils";

const STORAGE_KEY = "ao-kit-packs-v1";

type PackState = {
  packs: Record<string, EvidencePack>;
  order: string[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  replaceAll: (packs: Record<string, EvidencePack>, order: string[]) => void;
  upsert: (pack: EvidencePack) => void;
  update: (packId: string, mut: (pack: EvidencePack) => EvidencePack) => void;
  remove: (packId: string) => void;
  createNew: () => EvidencePack;
  loadExample: () => EvidencePack;
  importJson: (raw: unknown, asNew?: boolean) => { pack: EvidencePack } | { error: string };
  bumpFrom: (packId: string) => EvidencePack | { error: string };
};

function persistSnapshot(packs: Record<string, EvidencePack>, order: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ packs, order }));
  } catch {
    // Quota or private mode — keep working in-memory.
  }
}

export const usePackStore = create<PackState>()((set, get) => ({
  packs: {},
  order: [],
  hydrated: false,
  setHydrated: (v) => set({ hydrated: v }),
  replaceAll: (packs, order) => set({ packs, order, hydrated: true }),
  upsert: (pack) => {
    const stamped = { ...pack, updated_at: nowIso() };
    const packs = { ...get().packs, [pack.pack_id]: stamped };
    const order = get().order.includes(pack.pack_id)
      ? get().order
      : [pack.pack_id, ...get().order];
    persistSnapshot(packs, order);
    set({ packs, order });
  },
  update: (packId, mut) => {
    const cur = get().packs[packId];
    if (!cur) return;
    const next = { ...mut(cur), pack_id: packId, updated_at: nowIso() };
    const packs = { ...get().packs, [packId]: next };
    persistSnapshot(packs, get().order);
    set({ packs });
  },
  remove: (packId) => {
    const packs = { ...get().packs };
    delete packs[packId];
    const order = get().order.filter((id) => id !== packId);
    persistSnapshot(packs, order);
    set({ packs, order });
  },
  createNew: () => {
    const pack = createBlankPack();
    get().upsert(pack);
    return pack;
  },
  loadExample: () => {
    const pack = hydrateExampleFiles(clonePack(buildExamplePack(), { newId: true }));
    get().upsert(pack);
    return pack;
  },
  importJson: (raw, asNew = true) => {
    const parsed = parsePackJson(raw);
    if (!parsed.ok) return { error: parsed.error };
    let pack = parsed.pack;
    if (asNew) pack = clonePack(pack, { newId: true });
    get().upsert(pack);
    return { pack };
  },
  bumpFrom: (packId) => {
    const prior = get().packs[packId];
    if (!prior) return { error: "Pack not found." };
    const drafted = bumpFromBaseline(prior);
    get().upsert(drafted);
    void sealChain(drafted, prior).then((sealed) => get().upsert(sealed));
    return drafted;
  },
}));

export function hydratePackStore() {
  if (typeof window === "undefined") {
    return;
  }
  if (usePackStore.getState().hydrated) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        packs?: Record<string, EvidencePack>;
        order?: string[];
      };
      const packs = parsed.packs && typeof parsed.packs === "object" ? parsed.packs : {};
      const order = Array.isArray(parsed.order)
        ? parsed.order.filter((id) => typeof id === "string" && packs[id])
        : Object.keys(packs);
      usePackStore.getState().replaceAll(packs, order);
      return;
    }
  } catch {
    // ignore corrupt storage
  }
  usePackStore.getState().setHydrated(true);
}
