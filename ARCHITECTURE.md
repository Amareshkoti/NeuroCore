# NEUROCORE: Synthetic Biological Computing and Hybrid AI Research Platform
## Technical Architecture & Theoretical Specifications

### 1. Architectural Overview
NEUROCORE is an empirical computational neuroscience and hybrid artificial intelligence research platform. It implements real spiking neural networks governed by differential equations, biologically plausible synaptic plasticity (Hebbian, STDP, homeostatic scaling), associative recurrent memory, sensory encoding/decoding, and a bidirectional coupling bridge to local Large Language Models (via Ollama).

```
+-----------------------------------------------------------------------------------+
|                                  USER / RESEARCHER                                |
+-----------------------------------------------------------------------------------+
       |                                      ^                         ^
       v                                      |                         |
+---------------------+             +-------------------+    +----------------------+
|  Frontend Workstation|             | 3D Neural Canvas  |    | Scientific Analytics |
|  React 19 / Vite    |<----------->| Three.js / WebGL  |    | Recharts / Metrics   |
+---------------------+             +-------------------+    +----------------------+
       |                                      ^
       | REST / WebSocket                     | WebSocket Stream
       v                                      |
+-----------------------------------------------------------------------------------+
|                               BACKEND FASTAPI ENGINE                              |
+-----------------------------------------------------------------------------------+
       |
       +---> [1] Sensory Encoders (Rate, Temporal, Population Coding)
       |           |
       |           v
       +---> [2] Spiking Neural Network Simulator (Brian2 + Vectorized SNN Engine)
       |           |-- Leaky Integrate-and-Fire (LIF) & Adaptive Exponential (AdEx)
       |           |-- Excitatory (80%) & Inhibitory (20%) Neurons
       |           |-- Conductance-based & Current-based Synapses with Delays
       |           |-- STDP Plasticity & Homeostatic Weight Normalization
       |           \-- Recurrent Attractor Neural Memory
       |           |
       |           v
       +---> [3] Neural Readout & Decoders (Spike-rate, Vector Projections, Attractors)
       |           |
       |           v
       +---> [4] Hybrid AI Orchestrator (Mode A: LLM-Only, Mode B: SNN-Only, Mode C: Hybrid)
       |           |
       |           \---> Ollama Local Daemon (http://127.0.0.1:11434)
       |
       +---> [5] Experimental Engine (8 Rigorous Neuroscience Experiments)
       |
       \---> [6] Hardware Benchmarks & Hardware Optimizer
```

---

### 2. Spiking Neuron Dynamics & Differential Equations

#### A. Leaky Integrate-and-Fire (LIF) Model
For neuron $i$:
$$\tau_m \frac{d V_i(t)}{dt} = -(V_i(t) - V_{rest}) + R_m \cdot I_{syn,i}(t) + R_m \cdot I_{ext,i}(t)$$

Where:
- $V_i(t)$: Membrane potential of neuron $i$ at time $t$
- $\tau_m = C_m \cdot R_m$: Membrane time constant (typical: $20.0\,\text{ms}$)
- $V_{rest}$: Resting membrane potential (typical: $-65.0\,\text{mV}$)
- $V_{th}$: Firing threshold (typical: $-50.0\,\text{mV}$)
- $V_{reset}$: Reset potential after action potential (typical: $-70.0\,\text{mV}$)
- $\tau_{ref}$: Absolute refractory period (typical: $2.0\,\text{ms}$ or $5.0\,\text{ms}$)
- $I_{ext,i}(t)$: Injected external current from sensory encoders or experimental stimulation
- $I_{syn,i}(t)$: Total synaptic current received from pre-synaptic afferents

**Action Potential Condition**:
$$\text{If } V_i(t) \ge V_{th}:$$
1. Emit action potential spike $S_i(t) = 1$
2. Clamp $V_i(t) \leftarrow V_{reset}$
3. Hold neuron in refractory state for $t \in [t_{spike}, t_{spike} + \tau_{ref}]$

#### B. Adaptive Exponential Leaky Integrate-and-Fire (AdEx) Model
To capture spike-frequency adaptation, burst firing, and biological cortical diversity:
$$\tau_m \frac{d V_i}{dt} = -(V_i - V_{rest}) + \Delta_T \exp\left(\frac{V_i - V_{th}}{\Delta_T}\right) - R_m w_i + R_m I_{in,i}$$
$$\tau_w \frac{d w_i}{dt} = a (V_i - V_{rest}) - w_i$$
Upon spike:
$$V_i \leftarrow V_{reset}, \quad w_i \leftarrow w_i + b$$

---

### 3. Synaptic Transmission & Topologies

#### A. Synaptic Current Dynamics
Postsynaptic current $I_{syn,i}(t)$ is partitioned into excitatory ($E$) and inhibitory ($I$) components:
$$I_{syn,i}(t) = I_{syn,i}^{exc}(t) - I_{syn,i}^{inh}(t)$$

$$\tau_{exc} \frac{d I_{syn,i}^{exc}(t)}{dt} = -I_{syn,i}^{exc}(t) + \sum_{j \in Exc} W_{ij} \sum_{k} \delta(t - t_{j,k} - d_{ij})$$
$$\tau_{inh} \frac{d I_{syn,i}^{inh}(t)}{dt} = -I_{syn,i}^{inh}(t) + \sum_{j \in Inh} W_{ij} \sum_{k} \delta(t - t_{j,k} - d_{ij})$$

Where:
- $\tau_{exc} = 5.0\,\text{ms}$ (AMPA-like fast excitatory kinetics)
- $\tau_{inh} = 10.0\,\text{ms}$ (GABA-like inhibitory kinetics)
- $W_{ij} \ge 0$: Synaptic weight from pre-synaptic neuron $j$ to post-synaptic neuron $i$
- $t_{j,k}$: Timing of $k$-th spike from neuron $j$
- $d_{ij}$: Synaptic conduction delay ($1.0 - 5.0\,\text{ms}$)

#### B. Biological Population Structure (Dale's Principle)
A canonical population of $N = 1,000$ neurons:
- **800 Excitatory Pyramidal Neurons (80%)**: Positive synaptic weights ($W_{ij} > 0$), project long-range and locally.
- **200 Inhibitory Interneurons (20%)**: Negative effective impact ($I_{syn}^{inh}$), maintain excitation/inhibition balance ($E/I$ balance) and prevent epileptic runaway activity.

---

### 4. Synaptic Plasticity & STDP (Spike-Timing-Dependent Plasticity)

Biologically verified Bi & Poo (1998) asymmetric timing window:
For a pre-synaptic spike at $t_{pre}$ and post-synaptic spike at $t_{post}$, let $\Delta t = t_{post} - t_{pre}$:

$$\Delta W_{ij}(\Delta t) = \begin{cases} 
A_+ \exp\left(-\frac{\Delta t}{\tau_+}\right) & \text{if } \Delta t > 0 \quad (\text{LTP: Long-Term Potentiation}) \\
-A_- \exp\left(\frac{\Delta t}{\tau_-}\right) & \text{if } \Delta t < 0 \quad (\text{LTD: Long-Term Depression}) \\
0 & \text{if } \Delta t = 0
\end{cases}$$

Biophysical parameters:
- $A_+ = 0.01$: Maximum potentiation amplitude
- $A_- = 0.0105$: Maximum depression amplitude (asymmetry ensures LTD dominance to prevent runaway potentiation)
- $\tau_+ = 20.0\,\text{ms}$: Potentiation temporal window constant
- $\tau_- = 20.0\,\text{ms}$: Depression temporal window constant
- Weight bounds: $W \in [0.0, W_{max}]$ where $W_{max} = 1.0$

#### Homeostatic Plasticity (Synaptic Scaling)
To maintain network stability and target firing rate $r_{target} = 5.0\,\text{Hz}$:
$$\frac{d W_{ij}}{dt} = \gamma_{homeo} \cdot (r_{target} - r_i) \cdot W_{ij}$$
Where $r_i$ is the exponentially filtered running firing rate of neuron $i$.

---

### 5. Associative Neural Memory
Implements recurrent attractor networks with biologically realistic dynamics:
- **Hopfield/Willshaw Attractors embedded in recurrent SNNs**: Auto-associative storage of binary/sparse neural patterns.
- **Pattern Recall**: Presenting a partial (masked) or noisy pattern to sensory input neurons drives recurrent excitation and collateral inhibition, settling into the stored attractor basin.
- **Temporal Sequence Learning**: Asymmetric STDP encodes transition graphs where sequence $A \to B \to C$ potentiates forward connections with axonal delay $\tau_{delay}$.

---

### 6. Neural Sensory Encoders and Decoders

1. **Rate Coding**: Transforms numerical value $x \in [0, 1]$ into Poisson spike trains with firing rate $f(x) = f_{min} + (f_{max} - f_{min}) x$.
2. **Temporal (Latency) Coding**: Information encoded in the precise time-to-first-spike $t_{spike}(x) = t_0 + \tau \ln\left(\frac{1}{x}\right)$.
3. **Population Coding (Tuning Curves)**: Value encoded across an ensemble of neurons with Gaussian receptive fields centered at distinct coordinates $\mu_k$:
   $$r_k(x) = r_{peak} \exp\left(-\frac{(x - \mu_k)^2}{2\sigma^2}\right)$$
4. **Decoding**:
   - Population vector decoding
   - Softmax readout layer / linear ridge regression on spike counts
   - Attractor state matching

---

### 7. Hybrid LLM Integration (Ollama Local Daemon)

The system is coupled to the local Ollama instance (`http://127.0.0.1:11434`):
- Available models: `qwen2.5:3b-instruct`, `qwen3:4b`, `nomic-embed-text:latest`, `gemma:2b`.
- **Mode A (LLM Only)**: Prompt $\to$ LLM $\to$ Completion.
- **Mode B (Neural Network Only)**: Prompt $\to$ Embedding $\to$ Population Encoder $\to$ SNN Simulation $\to$ Readout $\to$ Classification/Output.
- **Mode C (Hybrid)**: Prompt $\to$ Embedding $\to$ SNN Attractor Filtering / Dynamic Neural Priming $\to$ Neural Modulation Context $\to$ LLM Prompt Augmentation $\to$ Verified Output.

Empirical evaluation explicitly measures:
- Accuracy, perplexity/confidence, response latency, token consumption, and noise resilience across identical benchmark datasets.

---

### 8. Verification & Experimental Engine
8 formal automated experiments with reproducible seeds:
1. Pattern Recognition
2. Associative Memory (Recall vs. Noise Level)
3. Temporal Sequence Learning
4. STDP Plasticity Verification
5. Noise Resistance Benchmark
6. E/I Balance & Network Dynamics
7. SNN vs. Conventional Feedforward ANN
8. Mode A vs. Mode B vs. Mode C Hybrid Comparison
