import { AppState } from '../../types/models';

const KEY = 'halo_forge_v1';

const fallbackState: AppState = { batches: [] };

export const storageService = {
  load(): AppState {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fallbackState;
      const parsed = JSON.parse(raw) as AppState;
      if (!Array.isArray(parsed.batches)) return fallbackState;
      return parsed;
    } catch {
      return fallbackState;
    }
  },
  save(state: AppState): void {
    localStorage.setItem(KEY, JSON.stringify(state));
  },
  clearBatch(id: string): AppState {
    const current = this.load();
    return { ...current, batches: current.batches.filter((b) => b.id !== id) };
  }
};
