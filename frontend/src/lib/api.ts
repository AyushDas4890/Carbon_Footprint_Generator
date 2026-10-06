export type TransportMode = 'AIR' | 'SEA' | 'ROAD' | 'RAIL';
export type EndOfLife = 'LANDFILL' | 'RECYCLED' | 'INCINERATED';
export type Country =
  | 'CHINA' | 'INDIA' | 'USA' | 'GERMANY' | 'FRANCE'
  | 'SWEDEN' | 'AUSTRALIA' | 'BRAZIL' | 'JAPAN' | 'UK';

// Mirrors the Literal types in predictor/schemas.py.
export const COUNTRIES: { value: Country; label: string }[] = [
  { value: 'CHINA', label: 'China' },
  { value: 'USA', label: 'United States' },
  { value: 'GERMANY', label: 'Germany' },
  { value: 'INDIA', label: 'India' },
  { value: 'FRANCE', label: 'France' },
  { value: 'JAPAN', label: 'Japan' },
  { value: 'BRAZIL', label: 'Brazil' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'SWEDEN', label: 'Sweden' },
  { value: 'AUSTRALIA', label: 'Australia' },
];
export const TRANSPORT_MODES: { value: TransportMode; label: string }[] = [
  { value: 'ROAD', label: 'Road' },
  { value: 'RAIL', label: 'Rail' },
  { value: 'SEA', label: 'Sea' },
  { value: 'AIR', label: 'Air' },
];
export const END_OF_LIFE: { value: EndOfLife; label: string }[] = [
  { value: 'LANDFILL', label: 'Landfill' },
  { value: 'RECYCLED', label: 'Recycle' },
  { value: 'INCINERATED', label: 'Incinerate' },
];

export interface PredictRequest {
  product_name: string;
  material: string;
  weight_kg: number;
  transport_mode: TransportMode;
  transport_distance_km: number;
  country: Country;
  eol: EndOfLife;
}

export interface Breakdown {
  materials_percent: number;
  manufacturing_percent: number;
  transport_percent: number;
  material_co2: number;
  manufacturing_co2: number;
  transport_co2: number;
}

export interface PredictResponse {
  success: boolean;
  error?: string;
  co2_kg: number;
  confidence_interval?: { lower: number; upper: number; method?: string };
  breakdown: Breakdown;
  explanations?: { feature: string; contribution_kg_co2: number; value: unknown }[];
  compensation?: { trees_per_year: number; trees_display: number; days_vegan: number; message: string };
  equivalency?: { car_km: number; smartphone_charges: number; washing_loads: number; display: string };
  sustainability_rating?: { grade: string; label: string; intensity_kg_co2_per_kg: number };
}

export interface CompareRow {
  product_name: string;
  co2_kg: number;
  rating?: PredictResponse['sustainability_rating'];
  breakdown: Breakdown;
}

export interface CompareResponse {
  success: boolean;
  rankings: CompareRow[];
  winner: string;
  loser: string;
  spread_pct: number;
}

export interface ModelInfo {
  model_family: string;
  r2_score: number;
  rmse: number;
  mae: number;
  conformal_coverage_90?: number | null;
}

export interface BomComponent {
  material: string;
  role: string;
  weight_kg: number;
  co2_kg: number;
  percent_of_total: number;
}

export interface BomResponse {
  success: boolean;
  product_name: string;
  total_co2_kg: number;
  components: BomComponent[];
}

export interface ChatSource {
  n: number;
  citation?: string;
  source_name?: string;
  score: number;
  snippet?: string;
}

export interface KnowledgeBase {
  doc_count: number;
  docs: string[];
}

export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(`Server returned ${res.status} with a non-JSON body`);
  }
  const data = body as { success?: boolean; error?: string; details?: { field: string; msg: string }[] };
  if (!res.ok || data.success === false) {
    const detail = data.details?.map((d) => `${d.field}: ${d.msg}`).join('; ');
    throw new ApiError(detail ? `${data.error} — ${detail}` : data.error || `Request failed (${res.status})`);
  }
  return body as T;
}

const post = <T>(url: string, payload: unknown) =>
  request<T>(url, { method: 'POST', body: JSON.stringify(payload) });

export const api = {
  materials: () => request<{ materials: string[] }>('/api/materials/').then((r) => r.materials),
  modelInfo: () => request<{ model_info: ModelInfo }>('/api/model-info/').then((r) => r.model_info),
  knowledgeBase: () => request<KnowledgeBase>('/api/advisor/kb/'),
  predict: (payload: PredictRequest) => post<PredictResponse>('/api/predict/', payload),
  compare: (products: PredictRequest[]) => post<CompareResponse>('/api/compare/', { products }),
  decompose: (description: string, country: Country, eol: EndOfLife) =>
    post<BomResponse>('/api/advisor/decompose/', { description, country, eol }),
  chat: (question: string) =>
    post<{ answer: string; sources: ChatSource[]; retrieved_count: number; latency_ms: number }>(
      '/api/advisor/chat/',
      { question },
    ),
};

export type StreamEvent =
  | { type: 'token'; text: string }
  | { type: 'sources'; sources: ChatSource[]; retrieved_count: number; latency_ms: number }
  | { type: 'error'; message: string }
  | { type: 'done' };

/** Reads the SSE stream from /api/advisor/chat/stream/, one parsed event at a time. */
export async function* streamChat(question: string, signal?: AbortSignal): AsyncGenerator<StreamEvent> {
  const res = await fetch('/api/advisor/chat/stream/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  });
  if (!res.ok || !res.body) throw new ApiError(`Stream failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      try {
        yield JSON.parse(line.slice(6)) as StreamEvent;
      } catch {
        console.warn('Skipping malformed SSE event', line);
      }
    }
  }
}
