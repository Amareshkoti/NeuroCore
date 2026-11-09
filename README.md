# NEUROCORE
## Synthetic Biological Computing & Hybrid AI Research Platform

NEUROCORE is a computational neuroscience and hybrid artificial intelligence research platform. It investigates whether mathematically simulated biological neural networks can perform useful computation, preserve associative memory, and complement modern Large Language Models without biological tissue or neural implants.

---

## 1. System Architecture

```
+-----------------------------------------------------------------------------------+
|                            RESEARCH WORKSTATION (REACT 19)                        |
|   Overview | Neural Lab | Brain 3D | Learning | Memory | AI | Experiments | Bench |
+-----------------------------------------------------------------------------------+
       |                                      ^                         ^
       v REST                                 | WebSocket (25 FPS)      | Three.js
+-----------------------------------------------------------------------------------+
|                              BACKEND FASTAPI ENGINE                               |
+-----------------------------------------------------------------------------------+
       |
       +---> [1] Sensory Encoders (Rate, Temporal, Population Coding)
       |           |
       |           v
       +---> [2] Spiking Neural Network Simulator (Brian2 + Vectorized SNN)
       |           |-- 1,000+ Neurons (80% Pyramidal Exc, 20% Interneuron Inh)
       |           |-- Leaky Integrate-and-Fire (LIF) & Adaptive Exponential (AdEx)
       |           |-- Conductance Kinetics with Synaptic Delays
       |           |-- Bi & Poo (1998) STDP Plasticity & Homeostatic Scaling
       |           \-- Recurrent Attractor Neural Memory
       |           |
       |           v
       +---> [3] Neural Readout Decoders (Population Vector, Linear Ridge, Attractors)
       |           |
       |           v
       +---> [4] Hybrid AI Orchestrator (Mode A, Mode B, Mode C)
       |           |
       |           \---> Local Ollama Daemon (http://127.0.0.1:11434)
       |                 Models: qwen2.5:3b-instruct, qwen3:4b, nomic-embed-text
       |
       +---> [5] Experimental Research Engine (8 Automated Benchmarks)
       |
       \---> [6] Hardware Profiler & Benchmarking Harness
```

---

## 2. Mathematical Foundations & Differential Equations

### Leaky Integrate-and-Fire (LIF) Dynamics
$$\tau_m \frac{d V_i(t)}{dt} = -(V_i(t) - V_{rest}) + R_m \cdot I_{syn,i}(t) + R_m \cdot I_{ext,i}(t)$$
- $\tau_m = 20.0\,\text{ms}$ (Membrane time constant)
- $V_{rest} = -65.0\,\text{mV}$ (Resting potential)
- $V_{reset} = -70.0\,\text{mV}$ (Reset potential)
- $V_{th} = -50.0\,\text{mV}$ (Action potential threshold)
- $\tau_{ref} = 2.0\,\text{ms}$ (Absolute refractory period)

### Adaptive Exponential (AdEx) Dynamics
$$\tau_m \frac{d V_i}{dt} = -(V_i - V_{rest}) + \Delta_T \exp\left(\frac{V_i - V_{th}}{\Delta_T}\right) - R_m w_i + R_m I_{in,i}$$
$$\tau_w \frac{d w_i}{dt} = a(V_i - V_{rest}) - w_i$$
- Spike-triggered adaptation: $V \leftarrow V_{reset}, \quad w \leftarrow w + b$

### Dale's Principle & Synaptic Kinetics
- **800 Excitatory Pyramidal Neurons (80%)**: $\tau_{exc} = 5.0\,\text{ms}$ (AMPA-like fast depolarization).
- **200 Inhibitory Interneurons (20%)**: $\tau_{inh} = 10.0\,\text{ms}$ (GABA-like hyperpolarization).
- Conduction delays: $d_{ij} \in [1.0, 5.0]\,\text{ms}$ circular delay ring buffer.

### Spike-Timing-Dependent Plasticity (STDP)
$$\Delta W_{ij}(\Delta t) = \begin{cases} 
A_+ \exp\left(-\frac{\Delta t}{\tau_+}\right) & \text{if } \Delta t > 0 \quad (\text{LTP}) \\
-A_- \exp\left(\frac{\Delta t}{\tau_-}\right) & \text{if } \Delta t < 0 \quad (\text{LTD})
\end{cases}$$
- Trace-based implementation: $\tau_+ = 20\,\text{ms}, \tau_- = 20\,\text{ms}, A_+ = 0.008, A_- = 0.0085$.

### Homeostatic Plasticity (Synaptic Scaling)
$$\Delta W_{ij} = \gamma (r_{target} - r_i) W_{ij}$$
- Maintains cortical stability and prevents runaway excitation or quiescence.

---

## 3. Hybrid AI Operational Modes

1. **MODE A: LLM ONLY**
   - Direct execution via local Ollama (`qwen2.5:3b-instruct`).
2. **MODE B: NEURAL NETWORK ONLY**
   - Sensory encoding $\to$ Spiking Neural Network $\to$ Attractor Readout. Zero GPU token cost.
3. **MODE C: HYBRID CO-PROCESSING**
   - Input $\to$ Vector Embedding $\to$ Recurrent SNN Attractor Filtering $\to$ Neural Modulation Telemetry $\to$ LLM Conditioning $\to$ Final Output.

---

## 4. Local Machine Hardware Profile

Inspected and detected on this host:
- **Processor**: Intel(R) Core(TM) i7-10610U CPU @ 1.80GHz (4 Physical Cores, 8 Logical Processors)
- **Memory**: 32 GB RAM
- **Graphics**: Intel(R) UHD Graphics (CPU-vectorized simulation prioritized)
- **Local Ollama Host**: `http://127.0.0.1:11434`
  - Installed models: `qwen2.5:3b-instruct`, `qwen3:4b`, `nomic-embed-text:latest`, `gemma:2b`

---

## 5. Quick Start Instructions

### A. Run Scientific Test Suite
```bash
.\.venv\Scripts\pytest backend\tests -v
```
Runs 32 automated validation tests covering differential equations, refractory periods, Brian2 cross-validation, STDP timing curves, associative memory recovery, and API endpoints.

### B. Launch Research Workstation Server
```bash
.\.venv\Scripts\python scripts\run_server.py
```
Open **`http://127.0.0.1:8000`** in your browser to access the complete interactive workstation (3D WebGL Canvas, Neural Laboratory, Memory Lab, Hybrid AI Console, and Experiments Suite).

### C. Run Command-Line Simulation Experiment
```bash
.\.venv\Scripts\python scripts\run_simulator_cli.py
```

### D. Rebuild the 60-second presentation video
```bash
.\.venv\Scripts\python scripts\export_video_data.py
python scripts\render_video.py
```
The first command runs the simulator (and Ollama, unless `--skip-llm`) and writes `video/video_data.json`. The second needs the server running and Selenium with Chrome; it captures UI screenshots, renders `video/neurocore_video.html` frame by frame and writes `linkedin_neurocore_presentation.mp4`. To preview the timeline live, serve the `video/` folder over HTTP and open `neurocore_video.html`.

---

## 6. Experimental Protocols Suite

The platform includes 8 automated empirical experiments:
1. **Experiment 1**: Pattern Recognition (SNN reservoir classification)
2. **Experiment 2**: Associative Memory (40% occluded pattern recall)
3. **Experiment 3**: Temporal Sequence Learning (Asymmetric STDP transition replay)
4. **Experiment 4**: STDP Learning (LTP / LTD quantification)
5. **Experiment 5**: Noise Resistance (Attractor stability across 10%-50% bit-flip noise)
6. **Experiment 6**: Excitatory vs. Inhibitory Behaviour (E/I balance vs. runaway synchrony)
7. **Experiment 7**: SNN vs. Conventional Feedforward ANN (PyTorch MLP benchmark)
8. **Experiment 8**: LLM-Only vs. Neural-Only vs. Hybrid AI (Local Ollama comparison)

All experiment outputs are serialized as JSON and CSV in `experiments/results/`.
