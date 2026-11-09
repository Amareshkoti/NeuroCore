// Session defaults kept in the browser. The backend has no settings endpoint,
// so these only shape what the UI sends when it builds a network.
export interface Defaults {
  numNeurons: number;
  modelType: "lif" | "adex";
  connectionProbability: number;
  excitatoryRatio: number;
  seed: number;
}

const KEY = "neurocore.defaults";
const FALLBACK: Defaults = { numNeurons: 1000, modelType: "lif", connectionProbability: 0.03, excitatoryRatio: 0.8, seed: 42 };

export function loadDefaults(): Defaults {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...FALLBACK, ...JSON.parse(raw) } : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function saveDefaults(d: Defaults): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}
