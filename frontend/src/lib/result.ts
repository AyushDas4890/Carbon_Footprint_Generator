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
  { key: 'material_co2', label: 'Material Production', color: '#64ffb4' },
  { key: 'manufacturing_co2', label: 'Manufacturing', color: '#00d9ff' },
  { key: 'transport_co2', label: 'Transport', color: '#8b5cf6' },
] as const;
