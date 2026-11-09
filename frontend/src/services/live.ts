// Live spike store fed by the /ws/simulation stream.
// Holds every spike event the backend reported (no interpolation, no synthetic
// activity) for a rolling window, plus the phenotype of each neuron so plots can
// colour excitatory and inhibitory cells consistently.

export type SpikeEvent = [number, number]; // [t_ms, neuron_id]

const WINDOW_MS = 250;
const MAX_EVENTS = 60000;

class LiveStore {
  events: SpikeEvent[] = [];
  latestT = 0;
  numNeurons = 0;
  isExc: boolean[] = [];
  // raster row of each neuron: excitatory cells first, then inhibitory
  row: number[] = [];
  // time of each neuron's latest spike, used by the 3D view
  lastSpikeT: Float64Array = new Float64Array(0);

  setPhenotypes(isExc: boolean[]) {
    this.numNeurons = isExc.length;
    this.isExc = isExc;
    const exc: number[] = [];
    const inh: number[] = [];
    isExc.forEach((e, i) => (e ? exc : inh).push(i));
    this.row = new Array(isExc.length);
    [...exc, ...inh].forEach((id, r) => (this.row[id] = r));
    this.lastSpikeT = new Float64Array(isExc.length).fill(-Infinity);
    this.events = [];
  }

  push(events: SpikeEvent[], t: number) {
    if (t < this.latestT) this.clear(); // network was reset or rebuilt
    this.latestT = t;
    for (const ev of events) {
      this.events.push(ev);
      if (ev[1] < this.lastSpikeT.length) this.lastSpikeT[ev[1]] = ev[0];
    }
    const cutoff = t - WINDOW_MS;
    let drop = 0;
    while (drop < this.events.length && this.events[drop][0] < cutoff) drop++;
    if (this.events.length - drop > MAX_EVENTS) drop = this.events.length - MAX_EVENTS;
    if (drop) this.events.splice(0, drop);
  }

  clear() {
    this.events = [];
    this.latestT = 0;
    this.lastSpikeT.fill(-Infinity);
  }

  get windowMs() {
    return WINDOW_MS;
  }
}

export const live = new LiveStore();
