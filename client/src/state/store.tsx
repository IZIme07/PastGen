import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import type { DossierDTO, EventDTO, PlaceDTO, ProposalDTO, TreeDTO } from "@pastgen/shared";
import { api } from "../api/client";

export type ViewMode = "tree" | "timeline" | "map" | "import";
export type TreeLayout = "tree" | "graph";

interface Store {
  tree: TreeDTO;
  events: EventDTO[];
  places: PlaceDTO[];
  proposals: ProposalDTO[];
  pendingCount: number;
  selectedId: string | null;
  dossier: DossierDTO | null;
  view: ViewMode;
  layout: TreeLayout;
  assistantOpen: boolean;
  aiAvailable: boolean;
  loading: boolean;

  setView(v: ViewMode): void;
  setLayout(l: TreeLayout): void;
  select(id: string | null): void;
  setAssistantOpen(open: boolean): void;
  refresh(): Promise<void>;
  refreshDossier(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<TreeDTO>({ persons: [], relationships: [] });
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [places, setPlaces] = useState<PlaceDTO[]>([]);
  const [proposals, setProposals] = useState<ProposalDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<DossierDTO | null>(null);
  const [view, setView] = useState<ViewMode>("tree");
  const [layout, setLayout] = useState<TreeLayout>("tree");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [t, e, pl, pr] = await Promise.all([
      api.tree(), api.events.list(), api.places.list(), api.proposals.list(),
    ]);
    setTree(t);
    setEvents(e);
    setPlaces(pl);
    setProposals(pr);
    setLoading(false);
  }, []);

  const refreshDossier = useCallback(async () => {
    setDossier(selectedId ? await api.persons.dossier(selectedId) : null);
  }, [selectedId]);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
    api.health().then((h) => setAiAvailable(h.ai)).catch(() => {});
  }, [refresh]);

  useEffect(() => {
    refreshDossier().catch(() => setDossier(null));
  }, [refreshDossier]);

  const select = useCallback((id: string | null) => setSelectedId(id), []);

  const value = useMemo<Store>(
    () => ({
      tree, events, places, proposals,
      pendingCount: proposals.filter((p) => p.status === "pending").length,
      selectedId, dossier, view, layout, assistantOpen, aiAvailable, loading,
      setView, setLayout, select, setAssistantOpen, refresh, refreshDossier,
    }),
    [tree, events, places, proposals, selectedId, dossier, view, layout, assistantOpen, aiAvailable, loading, select, refresh, refreshDossier],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error("useStore вне StoreProvider");
  return store;
}
