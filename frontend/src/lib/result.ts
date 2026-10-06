import type { PredictRequest, PredictResponse } from './api';

// The last prediction is shared between Home → Results → Insights via
// sessionStorage, as the Django templates did, so a refresh keeps it.
const KEY = 'c4_result';

export interface StoredResult {
  request: PredictRequest;
  response: PredictResponse;
}

export function saveResult(result: StoredResult) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch (err) {
    console.warn('Could not persist prediction to sessionStorage', err);
  }
}

export function loadResult(): StoredResult | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredResult>;
    // Results written by the old templates have a different shape; ignore them.
    return parsed.request && parsed.response ? (parsed as StoredResult) : null;
  } catch (err) {
    console.warn('Could not read stored prediction', err);
    return null;
  }
}

export const BREAKDOWN_PARTS = [
  { key: 'material_co2', label: 'Material production', color: 'var(--series-1)' },
  { key: 'manufacturing_co2', label: 'Manufacturing', color: 'var(--series-2)' },
  { key: 'transport_co2', label: 'Transport', color: 'var(--series-3)' },
] as const;

/** Sequential ink-to-ember scale: A is the lightest footprint, F the heaviest. */
export const GRADE_COLORS: Record<string, string> = {
  A: '#2f6b4f', B: '#6b7f2e', C: '#a07812', D: '#c4611a', E: '#e0481d', F: '#a3240c',
};

export const prettyMaterial = (m: string) => m.replace(/_/g, ' ');
