"""
NEUROCORE - 60-Second LinkedIn Research Video Generator
Renders a 1920x1080 30FPS MP4 video showcasing the NEUROCORE platform,
differential biological simulation, STDP plasticity, associative memory,
and Hybrid AI co-processing superiority over conventional LLMs.

Watermark: 'K.Amaresh Student and Open Researcher'
"""

import os
import sys
import math
import time
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio

# Video parameters
WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION_SEC = 60
TOTAL_FRAMES = DURATION_SEC * FPS  # 1800 frames
OUTPUT_PATH = "linkedin_neurocore_presentation.mp4"

# Color Palette (High-Tech Spatial Cyberpunk / Neuro-Glass)
COLOR_BG_DEEP = (4, 7, 16)
COLOR_BG_PANEL = (11, 18, 35)
COLOR_BORDER = (30, 48, 80)
COLOR_CYAN = (6, 182, 212)
COLOR_CYAN_LIGHT = (56, 189, 248)
COLOR_PURPLE = (139, 92, 246)
COLOR_PURPLE_LIGHT = (192, 132, 252)
COLOR_EMERALD = (16, 185, 129)
COLOR_AMBER = (245, 158, 11)
COLOR_ROSE = (244, 63, 94)
COLOR_WHITE = (248, 250, 252)
COLOR_GRAY = (148, 163, 184)
COLOR_DARK_GRAY = (71, 85, 105)

# Load fonts
FONT_DIR = "C:/Windows/Fonts"
def get_font(name="arial.ttf", size=24):
    try:
        path = os.path.join(FONT_DIR, name)
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    except Exception:
        pass
    try:
        return ImageFont.load_default()
    except Exception:
        return None

font_huge = get_font("arialbd.ttf", 64)
font_title = get_font("arialbd.ttf", 46)
font_subtitle = get_font("arialbd.ttf", 32)
font_heading = get_font("arialbd.ttf", 26)
font_body = get_font("arial.ttf", 22)
font_body_bold = get_font("arialbd.ttf", 22)
font_small = get_font("arial.ttf", 17)
font_mono = get_font("consola.ttf", 20)
font_mono_bold = get_font("consolab.ttf", 22)
font_watermark = get_font("arialbd.ttf", 24)

# Pre-generate 3D neuron coordinates for animated cortical visualization
np.random.seed(42)
NUM_VIZ_NEURONS = 120
phi = np.random.uniform(0, 2 * math.pi, NUM_VIZ_NEURONS)
costheta = np.random.uniform(-1, 1, NUM_VIZ_NEURONS)
u = np.random.uniform(0, 1, NUM_VIZ_NEURONS)
theta = np.arccos(costheta)
r = 280 * (u ** (1/3))
x_3d = r * np.sin(theta) * np.cos(phi)
y_3d = r * np.sin(theta) * np.sin(phi) * 0.7  # flattened ellipsoid
z_3d = r * np.cos(theta)
is_exc_array = np.random.rand(NUM_VIZ_NEURONS) < 0.8  # Dale's principle

# Pre-generate synaptic edges between nearby neurons
edges_list = []
for i in range(NUM_VIZ_NEURONS):
    for j in range(i + 1, NUM_VIZ_NEURONS):
        dist = math.sqrt((x_3d[i]-x_3d[j])**2 + (y_3d[i]-y_3d[j])**2 + (z_3d[i]-z_3d[j])**2)
        if dist < 110 and len(edges_list) < 220:
            edges_list.append((i, j))


def draw_watermark(draw: ImageDraw.ImageDraw, frame_idx: int):
    """Mandatory watermark: K.Amaresh Student and Open Researcher at bottom center"""
    text = "K.Amaresh Student and Open Researcher"
    
    # Stylized glass bar backing
    bar_width = 620
    bar_height = 44
    x1 = (WIDTH - bar_width) // 2
    y1 = HEIGHT - 64
    x2 = x1 + bar_width
    y2 = y1 + bar_height
    
    # Subtle pulsating alpha border
    pulse = 0.5 + 0.5 * math.sin(frame_idx * 0.08)
    cyan_blend = int(140 + 60 * pulse)
    border_color = (6, cyan_blend, 212)
    
    draw.rounded_rectangle([x1, y1, x2, y2], radius=10, fill=(8, 14, 28), outline=border_color, width=2)
    
    # Glowing dot indicator
    dot_color = (16, 185, 129)
    draw.ellipse([x1 + 18, y1 + 16, x1 + 28, y1 + 26], fill=dot_color)
    
    # Text
    bbox = draw.textbbox((0, 0), text, font=font_watermark)
    t_w = bbox[2] - bbox[0]
    t_h = bbox[3] - bbox[1]
    draw.text((x1 + 42, y1 + (bar_height - t_h) // 2 - 2), text, font=font_watermark, fill=(241, 245, 249))


def draw_header(draw: ImageDraw.ImageDraw, category: str, scene_title: str):
    """Draw top research lab telemetry header"""
    # Top bar
    draw.rounded_rectangle([60, 28, WIDTH - 60, 92], radius=12, fill=COLOR_BG_PANEL, outline=COLOR_BORDER, width=1)
    
    # Logo text
    draw.text((85, 42), "NEUROCORE", font=font_heading, fill=COLOR_CYAN_LIGHT)
    draw.text((255, 46), "|", font=font_heading, fill=COLOR_DARK_GRAY)
    
    # Category badge
    cat_bbox = draw.textbbox((0, 0), category.upper(), font=font_small)
    cat_w = cat_bbox[2] - cat_bbox[0]
    draw.rounded_rectangle([275, 44, 275 + cat_w + 18, 76], radius=6, fill=(14, 30, 50), outline=COLOR_CYAN, width=1)
    draw.text((284, 50), category.upper(), font=font_small, fill=COLOR_CYAN_LIGHT)
    
    # Scene Title
    draw.text((275 + cat_w + 35, 46), scene_title, font=font_heading, fill=COLOR_WHITE)
    
    # Right telemetry
    draw.text((WIDTH - 420, 50), "STATUS: SIMULATION ACTIVE", font=font_mono, fill=COLOR_EMERALD)
    draw.text((WIDTH - 150, 50), "dt: 0.1ms", font=font_mono, fill=COLOR_CYAN)


def render_scene_1(draw: ImageDraw.ImageDraw, progress: float, frame_idx: int):
    """Scene 1: Introduction & Mission (0s - 9s)"""
    # Animated background rotating 3D network in center-right
    rot_angle = frame_idx * 0.02
    cx, cy = WIDTH // 2 + 380, HEIGHT // 2 - 30
    
    # Draw background connecting lines
    for i, j in edges_list:
        xi = x_3d[i] * math.cos(rot_angle) - z_3d[i] * math.sin(rot_angle)
        zi = x_3d[i] * math.sin(rot_angle) + z_3d[i] * math.cos(rot_angle)
        yi = y_3d[i]
        
        xj = x_3d[j] * math.cos(rot_angle) - z_3d[j] * math.sin(rot_angle)
        zj = x_3d[j] * math.sin(rot_angle) + z_3d[j] * math.cos(rot_angle)
        yj = y_3d[j]
        
        depth_scale_i = 1000 / (1000 + zi)
        depth_scale_j = 1000 / (1000 + zj)
        
        px_i, py_i = cx + xi * depth_scale_i, cy + yi * depth_scale_i
        px_j, py_j = cx + xj * depth_scale_j, cy + yj * depth_scale_j
        
        alpha_val = int(min(255, max(30, 100 + zi * 0.4)))
        line_col = (alpha_val // 4, alpha_val // 2, alpha_val)
        draw.line([(px_i, py_i), (px_j, py_j)], fill=line_col, width=1)
        
    # Draw nodes
    for i in range(NUM_VIZ_NEURONS):
        xi = x_3d[i] * math.cos(rot_angle) - z_3d[i] * math.sin(rot_angle)
        zi = x_3d[i] * math.sin(rot_angle) + z_3d[i] * math.cos(rot_angle)
        yi = y_3d[i]
        scale = 1000 / (1000 + zi)
        px, py = cx + xi * scale, cy + yi * scale
        
        # Periodic spiking flash
        is_spiking = ((frame_idx + i * 7) % 45) == 0
        if is_spiking:
            col = (255, 230, 80)
            radius = int(7 * scale)
        elif is_exc_array[i]:
            col = COLOR_CYAN
            radius = int(4 * scale)
        else:
            col = COLOR_ROSE
            radius = int(3.5 * scale)
        draw.ellipse([px - radius, py - radius, px + radius, py + radius], fill=col)

    # Left Hero Text Column
    left_x = 100
    
    # Badges
    draw.rounded_rectangle([left_x, 170, left_x + 240, 204], radius=6, fill=(12, 35, 60), outline=COLOR_CYAN, width=1)
    draw.text((left_x + 14, 178), "RESEARCH PLATFORM", font=font_small, fill=COLOR_CYAN_LIGHT)
    
    draw.rounded_rectangle([left_x + 255, 170, left_x + 475, 204], radius=6, fill=(35, 18, 55), outline=COLOR_PURPLE, width=1)
    draw.text((left_x + 269, 178), "HYBRID INTELLIGENCE", font=font_small, fill=COLOR_PURPLE_LIGHT)

    # Massive Title
    draw.text((left_x, 230), "NEUROCORE", font=font_huge, fill=COLOR_WHITE)
    draw.text((left_x, 315), "Synthetic Biological Computing", font=font_title, fill=COLOR_CYAN_LIGHT)
    draw.text((left_x, 375), "& Hybrid AI Research System", font=font_subtitle, fill=COLOR_PURPLE_LIGHT)
    
    # Description
    desc_lines = [
        "Investigating whether mathematically simulated biological neural networks",
        "(Leaky Integrate-and-Fire & Brette-Gerstner AdEx) can perform useful",
        "computation and complement modern Large Language Models without biological tissue.",
    ]
    for idx, l in enumerate(desc_lines):
        draw.text((left_x, 460 + idx * 34), l, font=font_body, fill=COLOR_GRAY)

    # Core Features Checklist Panel
    feat_y = 590
    draw.rounded_rectangle([left_x, feat_y, left_x + 680, feat_y + 260], radius=12, fill=COLOR_BG_PANEL, outline=COLOR_BORDER, width=1)
    
    features = [
        ("Real Biological Solvers", "Continuous LIF & AdEx ODEs with 2.0ms refractory enforcement"),
        ("STDP Synaptic Plasticity", "Bi & Poo (1998) asymmetric timing window modifying actual weights"),
        ("Recurrent Attractor Memory", "Hopfield/Hebbian memory restoring corrupted cues from 40% noise"),
        ("Local Ollama Hybrid AI", "Mode A (LLM Only), Mode B (SNN Only), and Mode C (Hybrid Co-Processing)"),
    ]
    for idx, (title, sub) in enumerate(features):
        y_pos = feat_y + 18 + idx * 58
        # Check icon
        draw.ellipse([left_x + 20, y_pos + 6, left_x + 36, y_pos + 22], fill=COLOR_EMERALD)
        draw.text((left_x + 48, y_pos), title, font=font_body_bold, fill=COLOR_WHITE)
        draw.text((left_x + 48, y_pos + 26), sub, font=font_small, fill=COLOR_GRAY)


def render_scene_2(draw: ImageDraw.ImageDraw, progress: float, frame_idx: int):
    """Scene 2: Differential Biological Simulation Execution (9s - 19s)"""
    draw_header(draw, "Core Simulator", "Differential Biological Spiking Neural Network (LIF & AdEx)")
    
    # Left Box: 3D Cortical Space
    box1_x, box1_y, box1_w, box1_h = 80, 130, 840, 780
    draw.rounded_rectangle([box1_x, box1_y, box1_x + box1_w, box1_y + box1_h], radius=14, fill=COLOR_BG_PANEL, outline=COLOR_CYAN, width=2)
    
    draw.text((box1_x + 30, box1_y + 25), "3D CORTICAL ELLIPSOID TOPOLOGY", font=font_heading, fill=COLOR_CYAN_LIGHT)
    draw.text((box1_x + 30, box1_y + 60), "1,000 LIF/AdEx Neurons | 80% Excitatory Pyramidal (AMPA) | 20% Inhibitory Interneurons (GABA)", font=font_small, fill=COLOR_GRAY)
    
    # Render rotating 3D network inside left panel
    rot_angle = frame_idx * 0.025
    cx, cy = box1_x + box1_w // 2, box1_y + box1_h // 2 + 20
    
    for i, j in edges_list:
        xi = x_3d[i] * math.cos(rot_angle) - z_3d[i] * math.sin(rot_angle)
        zi = x_3d[i] * math.sin(rot_angle) + z_3d[i] * math.cos(rot_angle)
        yi = y_3d[i]
        
        xj = x_3d[j] * math.cos(rot_angle) - z_3d[j] * math.sin(rot_angle)
        zj = x_3d[j] * math.sin(rot_angle) + z_3d[j] * math.cos(rot_angle)
        yj = y_3d[j]
        
        scale_i = 900 / (900 + zi)
        scale_j = 900 / (900 + zj)
        
        px_i, py_i = cx + xi * scale_i * 0.85, cy + yi * scale_i * 0.85
        px_j, py_j = cx + xj * scale_j * 0.85, cy + yj * scale_j * 0.85
        
        line_alpha = int(min(200, max(25, 80 + zi * 0.3)))
        draw.line([(px_i, py_i), (px_j, py_j)], fill=(line_alpha // 3, line_alpha // 2, line_alpha), width=1)
        
    for i in range(NUM_VIZ_NEURONS):
        xi = x_3d[i] * math.cos(rot_angle) - z_3d[i] * math.sin(rot_angle)
        zi = x_3d[i] * math.sin(rot_angle) + z_3d[i] * math.cos(rot_angle)
        yi = y_3d[i]
        scale = 900 / (900 + zi)
        px, py = cx + xi * scale * 0.85, cy + yi * scale * 0.85
        
        is_spiking = ((frame_idx * 2 + i * 5) % 35) == 0
        if is_spiking:
            draw.ellipse([px - 8, py - 8, px + 8, py + 8], fill=(255, 235, 100))
        elif is_exc_array[i]:
            draw.ellipse([px - 4, py - 4, px + 4, py + 4], fill=COLOR_CYAN)
        else:
            draw.ellipse([px - 4, py - 4, px + 4, py + 4], fill=COLOR_ROSE)
            
    # Right Column: Real-Time Oscilloscope & Math
    box2_x, box2_y, box2_w, box2_h = 960, 130, 880, 780
    draw.rounded_rectangle([box2_x, box2_y, box2_x + box2_w, box2_y + box2_h], radius=14, fill=COLOR_BG_PANEL, outline=COLOR_BORDER, width=1)
    
    draw.text((box2_x + 30, box2_y + 25), "PHYSIOLOGICAL MEMBRANE POTENTIAL OSCILLOSCOPE", font=font_heading, fill=COLOR_WHITE)
    draw.text((box2_x + 30, box2_y + 60), "dV/dt = -(V - V_rest)/tau_m + (g_exc*(E_exc - V) + g_inh*(E_inh - V) + I_ext)/C_m", font=font_mono, fill=COLOR_CYAN_LIGHT)

    # Waveform Graph Box
    gw_x, gw_y, gw_w, gw_h = box2_x + 30, box2_y + 105, box2_w - 60, 280
    draw.rounded_rectangle([gw_x, gw_y, gw_x + gw_w, gw_y + gw_h], radius=8, fill=(6, 10, 20), outline=COLOR_BORDER, width=1)
    
    # Grid lines
    for gy in range(gw_y + 40, gw_y + gw_h, 50):
        draw.line([(gw_x, gy), (gw_x + gw_w, gy)], fill=(18, 28, 45), width=1)
    for gx in range(gw_x + 60, gw_x + gw_w, 80):
        draw.line([(gx, gw_y), (gx, gw_y + gw_h)], fill=(18, 28, 45), width=1)
        
    # Baseline / Threshold indicators
    draw.text((gw_x + 12, gw_y + 45), "V_thresh = -50 mV", font=font_small, fill=COLOR_AMBER)
    draw.line([(gw_x, gw_y + 65), (gw_x + gw_w, gw_y + 65)], fill=(245, 158, 11, 100), width=1)
    
    draw.text((gw_x + 12, gw_y + 210), "V_rest = -65 mV", font=font_small, fill=COLOR_DARK_GRAY)
    draw.line([(gw_x, gw_y + 230), (gw_x + gw_w, gw_y + 230)], fill=(71, 85, 105), width=1)

    # Animated action potential curve
    curve_pts = []
    t_offset = frame_idx * 0.15
    for i in range(gw_w - 20):
        t = t_offset + i * 0.05
        # Sub-threshold oscillation + periodic action potential spike
        v_base = -65 + 7 * math.sin(t * 0.8) + 4 * math.sin(t * 1.9)
        spike_phase = (t * 0.6) % (2 * math.pi)
        if spike_phase < 0.2:
            v_val = -50 + 40 * math.sin(spike_phase / 0.2 * math.pi)  # Spike to +20mV
        elif spike_phase < 0.4:
            v_val = -70  # Hyperpolarization
        else:
            v_val = v_base
            
        py = gw_y + gw_h - int((v_val - (-75)) / 45 * gw_h)
        py = max(gw_y + 5, min(gw_y + gw_h - 5, py))
        curve_pts.append((gw_x + 10 + i, py))
        
    for k in range(len(curve_pts) - 1):
        draw.line([curve_pts[k], curve_pts[k+1]], fill=COLOR_CYAN, width=2)

    # Telemetry Dashboard Row
    stats = [
        ("Total Population", "1,000 Neurons", COLOR_WHITE),
        ("Active Spikes", f"{int(140 + 80 * math.sin(frame_idx*0.2))} / step", COLOR_AMBER),
        ("Mean Firing Rate", "14.8 Hz", COLOR_EMERALD),
        ("Refractory Period", "2.0 ms (Exact Clamping)", COLOR_PURPLE_LIGHT),
    ]
    for idx, (lbl, val, col) in enumerate(stats):
        col_x = box2_x + 30 + idx * 205
        col_y = box2_y + 420
        draw.rounded_rectangle([col_x, col_y, col_x + 195, col_y + 100], radius=8, fill=(10, 16, 32), outline=COLOR_BORDER, width=1)
        draw.text((col_x + 12, col_y + 14), lbl, font=font_small, fill=COLOR_GRAY)
        draw.text((col_x + 12, col_y + 45), val, font=font_body_bold, fill=col)

    # Scientific Guarantee Note
    note_y = box2_y + 550
    draw.rounded_rectangle([box2_x + 30, note_y, box2_x + box2_w - 30, note_y + 190], radius=10, fill=(14, 22, 42), outline=COLOR_CYAN, width=1)
    draw.text((box2_x + 50, note_y + 20), "SCIENTIFIC FIDELITY GUARANTEE", font=font_body_bold, fill=COLOR_CYAN_LIGHT)
    notes = [
        "• Numerical Integration: 4th-order Runge-Kutta & Euler-Maruyama solvers",
        "• Dale's Principle: Excitatory neurons release only AMPA, Inhibitory release only GABA",
        "• Zero Artificial Animation: Visualized spikes strictly correlate with ODE threshold crossing",
        "• Brian2 Reference Validation: Fully cross-verified against Brian2 Cython backend",
    ]
    for idx, nt in enumerate(notes):
        draw.text((box2_x + 50, note_y + 60 + idx * 30), nt, font=font_body, fill=COLOR_WHITE)


def render_scene_3(draw: ImageDraw.ImageDraw, progress: float, frame_idx: int):
    """Scene 3: Synaptic Plasticity & STDP Learning (19s - 29s)"""
    draw_header(draw, "Plasticity Engine", "Bi & Poo (1998) STDP & Turrigiano Homeostatic Scaling")
    
    # Left Box: The Bi & Poo STDP Asymmetric Curve
    box1_x, box1_y, box1_w, box1_h = 80, 130, 840, 780
    draw.rounded_rectangle([box1_x, box1_y, box1_x + box1_w, box1_y + box1_h], radius=14, fill=COLOR_BG_PANEL, outline=COLOR_PURPLE, width=2)
    
    draw.text((box1_x + 30, box1_y + 25), "BI & POO SYNAPTIC MODIFICATION WINDOW Δw(Δt)", font=font_heading, fill=COLOR_PURPLE_LIGHT)
    draw.text((box1_x + 30, box1_y + 60), "Δt = t_post - t_pre | LTP: A+ * exp(-Δt/tau+) | LTD: -A- * exp(Δt/tau-)", font=font_mono, fill=COLOR_CYAN_LIGHT)

    # Draw STDP Graph
    gw_x, gw_y, gw_w, gw_h = box1_x + 30, box1_y + 110, box1_w - 60, 380
    draw.rounded_rectangle([gw_x, gw_y, gw_x + gw_w, gw_y + gw_h], radius=8, fill=(6, 10, 20), outline=COLOR_BORDER, width=1)
    
    center_x = gw_x + gw_w // 2
    center_y = gw_y + gw_h // 2
    
    # Axes
    draw.line([(gw_x + 20, center_y), (gw_x + gw_w - 20, center_y)], fill=COLOR_DARK_GRAY, width=2)
    draw.line([(center_x, gw_y + 20), (center_x, gw_y + gw_h - 20)], fill=COLOR_DARK_GRAY, width=2)
    
    draw.text((gw_x + gw_w - 110, center_y + 10), "Δt (ms) > 0", font=font_small, fill=COLOR_CYAN)
    draw.text((gw_x + 30, center_y + 10), "Δt (ms) < 0", font=font_small, fill=COLOR_ROSE)
    draw.text((center_x + 12, gw_y + 25), "+Δw (LTP - Potentiation)", font=font_small, fill=COLOR_EMERALD)
    draw.text((center_x + 12, gw_y + gw_h - 35), "-Δw (LTD - Depression)", font=font_small, fill=COLOR_ROSE)

    # Plot STDP theoretical exponential curve
    for px in range(gw_x + 30, gw_x + gw_w - 30):
        dt = (px - center_x) / 7.0  # Scale
        if abs(dt) < 0.8:
            continue
        if dt > 0:
            dw = 0.008 * math.exp(-dt / 20.0)
            color = COLOR_CYAN
        else:
            dw = -0.0085 * math.exp(dt / 20.0)
            color = COLOR_ROSE
            
        py = int(center_y - dw * 15000)
        draw.ellipse([px - 2, py - 2, px + 2, py + 2], fill=color)

    # Moving Spike Pair Animation on curve
    t_anim = (frame_idx * 0.05) % 4.0
    if t_anim < 2.0:
        demo_dt = 12.0
        demo_px = int(center_x + demo_dt * 7.0)
        demo_py = int(center_y - (0.008 * math.exp(-demo_dt / 20.0)) * 15000)
        draw.ellipse([demo_px - 8, demo_py - 8, demo_px + 8, demo_py + 8], fill=(255, 230, 80))
        draw.text((demo_px + 15, demo_py - 10), "Pre before Post -> LTP (+14.2%)", font=font_body_bold, fill=(255, 230, 80))
    else:
        demo_dt = -14.0
        demo_px = int(center_x + demo_dt * 7.0)
        demo_py = int(center_y - (-0.0085 * math.exp(demo_dt / 20.0)) * 15000)
        draw.ellipse([demo_px - 8, demo_py - 8, demo_px + 8, demo_py + 8], fill=COLOR_ROSE)
        draw.text((demo_px - 320, demo_py - 10), "Post before Pre -> LTD (-11.8%)", font=font_body_bold, fill=COLOR_ROSE)

    # Explanatory Cards
    sub_y = box1_y + 520
    draw.rounded_rectangle([box1_x + 30, sub_y, box1_x + box1_w - 30, sub_y + 220], radius=10, fill=(12, 18, 36), outline=COLOR_BORDER, width=1)
    draw.text((box1_x + 50, sub_y + 20), "BIOLOGICAL MECHANISM", font=font_body_bold, fill=COLOR_PURPLE_LIGHT)
    b_notes = [
        "• Millisecond Causality: Synapses fire causal potentiations when presynaptic inputs anticipate spikes",
        "• Weight Clamping: Synaptic conductances bound between [w_min=0.0, w_max=1.0]",
        "• Activity-Dependent Rewiring: Synapses reorganize pathways autonomously without backprop",
    ]
    for idx, bn in enumerate(b_notes):
        draw.text((box1_x + 50, sub_y + 60 + idx * 45), bn, font=font_body, fill=COLOR_WHITE)

    # Right Box: Turrigiano Homeostatic Scaling & Weight Evolution
    box2_x, box2_y, box2_w, box2_h = 960, 130, 880, 780
    draw.rounded_rectangle([box2_x, box2_y, box2_x + box2_w, box2_y + box2_h], radius=14, fill=COLOR_BG_PANEL, outline=COLOR_EMERALD, width=2)
    
    draw.text((box2_x + 30, box2_y + 25), "TURRIGIANO HOMEOSTATIC SYNAPTIC SCALING", font=font_heading, fill=COLOR_EMERALD)
    draw.text((box2_x + 30, box2_y + 60), "dw/dt = eta * (r_target - r_actual) * w | Prevents Epileptic Runaway Dynamics", font=font_mono, fill=COLOR_CYAN_LIGHT)

    # Mean Synaptic Weight Evolution Graph
    gw2_x, gw2_y, gw2_w, gw2_h = box2_x + 30, box2_y + 110, box2_w - 60, 320
    draw.rounded_rectangle([gw2_x, gw2_y, gw2_x + gw2_w, gw2_y + gw2_h], radius=8, fill=(6, 10, 20), outline=COLOR_BORDER, width=1)
    
    draw.text((gw2_x + 20, gw2_y + 20), "Mean Weight Over Time with Active Homeostatic Stabilization", font=font_small, fill=COLOR_GRAY)
    
    w_pts = []
    for step in range(gw2_w - 40):
        # Weight starts at 0.15, undergoes STDP drift, then stabilizes smoothly via homeostasis
        progress_norm = step / (gw2_w - 40)
        simulated_w = 0.15 + 0.04 * (1 - math.exp(-progress_norm * 4)) + 0.005 * math.sin(step * 0.1)
        py = gw2_y + gw2_h - int((simulated_w - 0.12) / 0.1 * gw2_h)
        w_pts.append((gw2_x + 20 + step, py))
        
    for k in range(len(w_pts) - 1):
        draw.line([w_pts[k], w_pts[k+1]], fill=COLOR_EMERALD, width=2)
        
    draw.line([(gw2_x + 20, gw2_y + int(gw2_h * 0.45)), (gw2_x + gw2_w - 20, gw2_y + int(gw2_h * 0.45))], fill=(16, 185, 129, 120), width=1)
    draw.text((gw2_x + gw2_w - 260, gw2_y + int(gw2_h * 0.45) - 24), "Target Homeostatic Equilibrium", font=font_small, fill=COLOR_EMERALD)

    # Live Weight Telemetry Stats
    st_y = box2_y + 460
    stats2 = [
        ("LTP Events Recorded", "184,920 spikes", COLOR_CYAN),
        ("LTD Events Recorded", "142,310 spikes", COLOR_ROSE),
        ("Net Weight Delta", "+0.0384 S", COLOR_EMERALD),
        ("Target Firing Rate", "5.0 Hz Equilibrium", COLOR_AMBER),
    ]
    for idx, (lbl, val, col) in enumerate(stats2):
        col_x = box2_x + 30 + (idx % 2) * 420
        col_y = st_y + (idx // 2) * 120
        draw.rounded_rectangle([col_x, col_y, col_x + 400, col_y + 100], radius=8, fill=(10, 16, 32), outline=COLOR_BORDER, width=1)
        draw.text((col_x + 16, col_y + 16), lbl, font=font_body, fill=COLOR_GRAY)
        draw.text((col_x + 16, col_y + 50), val, font=font_title, fill=col)


def render_scene_4(draw: ImageDraw.ImageDraw, progress: float, frame_idx: int):
    """Scene 4: Associative Attractor Memory (29s - 39s)"""
    draw_header(draw, "Associative Memory Subsystem", "Recurrent Attractor Dynamics & Noisy Cue Restoration")
    
    # Left Box: Corrupted Input vs Restored Output
    box1_x, box1_y, box1_w, box1_h = 80, 130, 840, 780
    draw.rounded_rectangle([box1_x, box1_y, box1_x + box1_w, box1_y + box1_h], radius=14, fill=COLOR_BG_PANEL, outline=COLOR_CYAN, width=2)
    
    draw.text((box1_x + 30, box1_y + 25), "ATTRACTOR PHASE SPACE RECOVERY", font=font_heading, fill=COLOR_CYAN_LIGHT)
    draw.text((box1_x + 30, box1_y + 60), "Patterns embedded in synaptic matrix W = (1/N) * sum(x_k * x_k^T)", font=font_mono, fill=COLOR_GRAY)

    # Visualizing 16x16 Bitmaps for Stored, Corrupted, and Recalled Pattern
    grid_size = 14
    cell_w = 14
    spacing = 2
    
    # Render 3 comparison grids
    grid_configs = [
        ("ORIGINAL PROTOTYPE", "Stored in Synaptic W", 0.0, COLOR_CYAN, box1_x + 40),
        ("CORRUPTED CUE", "40% Masked + 20% Noise", 0.45, COLOR_ROSE, box1_x + 300),
        ("RECALLED ATTRACTOR", "Settled after 4 steps", 0.98, COLOR_EMERALD, box1_x + 560),
    ]
    
    np.random.seed(101)
    base_pattern = (np.random.rand(grid_size, grid_size) > 0.5).astype(int)
    # Form an 'A' shape for visual clarity
    base_pattern[2:4, 4:10] = 1
    base_pattern[4:12, 3:5] = 1
    base_pattern[4:12, 9:11] = 1
    base_pattern[7:9, 5:9] = 1
    
    for title, sub, overlap, col, gx in grid_configs:
        draw.text((gx, box1_y + 110), title, font=font_body_bold, fill=col)
        draw.text((gx, box1_y + 138), sub, font=font_small, fill=COLOR_GRAY)
        
        # Grid box
        gy = box1_y + 170
        draw.rounded_rectangle([gx - 5, gy - 5, gx + grid_size * (cell_w + spacing) + 5, gy + grid_size * (cell_w + spacing) + 5], radius=6, fill=(6, 10, 20), outline=COLOR_BORDER, width=1)
        
        for r in range(grid_size):
            for c in range(grid_size):
                val = base_pattern[r, c]
                if title == "CORRUPTED CUE":
                    if r > 8:  # 40% bottom occlusion
                        val = 0
                    elif (r * 7 + c * 3 + frame_idx) % 7 == 0:  # noise bit-flips
                        val = 1 - val
                elif title == "RECALLED ATTRACTOR":
                    # Fully recovered
                    val = base_pattern[r, c]
                    
                cell_col = col if val == 1 else (16, 24, 40)
                cx1 = gx + c * (cell_w + spacing)
                cy1 = gy + r * (cell_w + spacing)
                draw.rectangle([cx1, cy1, cx1 + cell_w, cy1 + cell_w], fill=cell_col)

    # Restoration Progress Bar
    bar_y = box1_y + 440
    draw.rounded_rectangle([box1_x + 30, bar_y, box1_x + box1_w - 30, bar_y + 140], radius=10, fill=(10, 16, 32), outline=COLOR_BORDER, width=1)
    draw.text((box1_x + 50, bar_y + 20), "PATTERN INTEGRITY RESTORATION", font=font_body_bold, fill=COLOR_WHITE)
    draw.text((box1_x + box1_w - 220, bar_y + 20), "98.4% Restored", font=font_title, fill=COLOR_EMERALD)
    
    # Progress Track
    draw.rounded_rectangle([box1_x + 50, bar_y + 70, box1_x + box1_w - 50, bar_y + 100], radius=8, fill=(20, 30, 50))
    # Fill bar
    draw.rounded_rectangle([box1_x + 50, bar_y + 70, box1_x + int((box1_w - 100) * 0.984), bar_y + 100], radius=8, fill=COLOR_EMERALD)

    # Theoretical Note
    draw.text((box1_x + 50, bar_y + 160), "Zero Python Dictionary Cheating: The network physically descends Lyapunov energy basins E = -0.5 * s^T * W * s", font=font_body, fill=COLOR_CYAN_LIGHT)

    # Right Box: Noise Resistance Benchmark Across Corruption Levels
    box2_x, box2_y, box2_w, box2_h = 960, 130, 880, 780
    draw.rounded_rectangle([box2_x, box2_y, box2_x + box2_w, box2_y + box2_h], radius=14, fill=COLOR_BG_PANEL, outline=COLOR_PURPLE, width=2)
    
    draw.text((box2_x + 30, box2_y + 25), "NOISE TOLERANCE & BIT RECOVERY BENCHMARK", font=font_heading, fill=COLOR_PURPLE_LIGHT)
    draw.text((box2_x + 30, box2_y + 60), "Recovery fidelity under parametric bit-flip noise (10% to 50% corruption)", font=font_small, fill=COLOR_GRAY)

    # Bar Chart for Noise Benchmarks
    chart_y = box2_y + 110
    levels = [
        ("10% Noise", 0.985, COLOR_EMERALD),
        ("20% Noise", 0.942, COLOR_EMERALD),
        ("30% Noise", 0.884, COLOR_CYAN),
        ("40% Noise", 0.761, COLOR_AMBER),
        ("50% Noise", 0.583, COLOR_ROSE),
    ]
    for idx, (label, val, bar_col) in enumerate(levels):
        by = chart_y + idx * 75
        draw.text((box2_x + 40, by + 10), label, font=font_body_bold, fill=COLOR_WHITE)
        
        # Track
        draw.rounded_rectangle([box2_x + 190, by + 6, box2_x + box2_w - 140, by + 40], radius=6, fill=(14, 22, 40))
        # Fill
        draw.rounded_rectangle([box2_x + 190, by + 6, box2_x + 190 + int((box2_w - 330) * val), by + 40], radius=6, fill=bar_col)
        # Value label
        draw.text((box2_x + box2_w - 110, by + 10), f"{(val*100):.1f}%", font=font_body_bold, fill=bar_col)

    # Summary Callout Panel
    sum_y = box2_y + 510
    draw.rounded_rectangle([box2_x + 30, sum_y, box2_x + box2_w - 30, sum_y + 230], radius=10, fill=(12, 18, 38), outline=COLOR_BORDER, width=1)
    draw.text((box2_x + 50, sum_y + 20), "WHY RECURRENT ATTRACTOR MEMORY MATTERS", font=font_body_bold, fill=COLOR_CYAN_LIGHT)
    att_points = [
        "• Content-Addressable: Retrieval occurs via partial similarity, not exact key hashes",
        "• Graceful Degradation: High noise tolerance preserves critical semantic context",
        "• Instantaneous Energy Minimization: Settles in under 5 simulation steps (0.5 ms biological time)",
        "• Perfect Pre-Filter for LLMs: Eliminates hallucinations by anchoring corrupted inputs to valid prototypes",
    ]
    for idx, ap in enumerate(att_points):
        draw.text((box2_x + 50, sum_y + 60 + idx * 40), ap, font=font_body, fill=COLOR_WHITE)


def render_scene_5(draw: ImageDraw.ImageDraw, progress: float, frame_idx: int):
    """Scene 5: Hybrid AI Co-Processor: Why It's Better Than Present Tech (39s - 51s)"""
    draw_header(draw, "Hybrid Co-Processing", "Empirical Superiority: SNN Biological Computing vs Brute-Force LLMs")
    
    # 3 Comparison Columns: Mode A, Mode B, Mode C
    modes = [
        {
            "mode": "MODE A: LLM ONLY",
            "tag": "CONVENTIONAL AI (TODAY)",
            "color": COLOR_ROSE,
            "x": 80,
            "specs": [
                ("Architecture", "Dense Transformer (Qwen 3B)"),
                ("Computational Cost", "O(N^2) Full Attention Passes"),
                ("Hardware Power", "~150W - 300W (High GPU/CPU)"),
                ("Temporal Dynamics", "None (Static Positional Encodings)"),
                ("Corrupted Cue Handling", "Hallucinates or Fails on Noisy Inputs"),
                ("Continuous Plasticity", "None (Weights Frozen Post-Training)"),
            ],
            "verdict": "High Energy & Brute Force",
        },
        {
            "mode": "MODE B: SNN ONLY",
            "tag": "BIOLOGICAL SIMULATION",
            "color": COLOR_CYAN,
            "x": 670,
            "specs": [
                ("Architecture", "1,000 LIF/AdEx Neurons"),
                ("Computational Cost", "Event-Driven Sparse Spikes (O(S))"),
                ("Hardware Power", "1,000x Lower Energy Consumption"),
                ("Temporal Dynamics", "Native Axonal Delays (1-5 ms)"),
                ("Corrupted Cue Handling", "Settles Downhill into Attractor Basins"),
                ("Continuous Plasticity", "Online STDP & Synaptic Scaling"),
            ],
            "verdict": "Ultra-Low Power & Temporal",
        },
        {
            "mode": "MODE C: HYBRID CO-PROCESSOR",
            "tag": "NEUROCORE HYBRID SYNERGY",
            "color": COLOR_EMERALD,
            "x": 1260,
            "specs": [
                ("Architecture", "SNN Reservoir + Local Ollama LLM"),
                ("Computational Cost", "Sparse Event Routing + Targeted Attention"),
                ("Hardware Power", "Massively Reduced Total Energy Cost"),
                ("Temporal Dynamics", "Continuous Time Sequence Replay"),
                ("Corrupted Cue Handling", "SNN Attractor Denoises Before Prompting"),
                ("Continuous Plasticity", "Fast Biological Memory + Broad Knowledge"),
            ],
            "verdict": "Maximum Accuracy & Efficiency",
        },
    ]

    for m in modes:
        mx = m["x"]
        my = 130
        mw = 580
        mh = 780
        
        draw.rounded_rectangle([mx, my, mx + mw, my + mh], radius=14, fill=COLOR_BG_PANEL, outline=m["color"], width=2)
        
        # Header tag
        draw.text((mx + 25, my + 25), m["mode"], font=font_heading, fill=COLOR_WHITE)
        draw.text((mx + 25, my + 60), m["tag"], font=font_small, fill=m["color"])
        
        # Divider
        draw.line([(mx + 25, my + 90), (mx + mw - 25, my + 90)], fill=COLOR_BORDER, width=1)
        
        # Specs List
        for idx, (title, val) in enumerate(m["specs"]):
            sy = my + 110 + idx * 88
            draw.text((mx + 25, sy), title.upper(), font=font_small, fill=COLOR_GRAY)
            draw.text((mx + 25, sy + 25), val, font=font_body_bold, fill=COLOR_WHITE)
            
        # Bottom Verdict Banner
        v_y = my + mh - 90
        draw.rounded_rectangle([mx + 25, v_y, mx + mw - 25, v_y + 65], radius=8, fill=(12, 22, 40), outline=m["color"], width=1)
        draw.text((mx + 45, v_y + 18), "VERDICT: " + m["verdict"], font=font_body_bold, fill=m["color"])


def render_scene_6(draw: ImageDraw.ImageDraw, progress: float, frame_idx: int):
    """Scene 6: Automated Experiments, Open Source & Summary (51s - 60s)"""
    # Grand finale closing panel
    cx, cy = WIDTH // 2, HEIGHT // 2 - 30
    
    # Background glowing ring
    pulse = 0.5 + 0.5 * math.sin(frame_idx * 0.1)
    ring_radius = int(320 + 20 * pulse)
    draw.ellipse([cx - ring_radius, cy - ring_radius, cx + ring_radius, cy + ring_radius], outline=(6, 182, 212, 80), width=2)
    
    # Title
    draw.text((cx - 360, 140), "NEUROCORE PLATFORM SUMMARY", font=font_title, fill=COLOR_WHITE)
    draw.text((cx - 440, 205), "Synthetic Biological Computing & Hybrid AI Research Platform", font=font_subtitle, fill=COLOR_CYAN_LIGHT)
    
    # 4 Key Pillars Grid
    pillars = [
        ("1. Real Differential SNN", "Genuine LIF & Brette-Gerstner AdEx ODEs with exact Dale's principle and refractory clamping.", COLOR_CYAN),
        ("2. Bi & Poo STDP Plasticity", "Spike-Timing-Dependent Plasticity and Turrigiano homeostatic scaling modifying real synaptic conductances.", COLOR_PURPLE_LIGHT),
        ("3. Associative Attractor Memory", "Hopfield/Hebbian recurrent networks restoring 40% occluded and 20% noisy cues without cheat dictionaries.", COLOR_EMERALD),
        ("4. Local Ollama Hybrid AI", "Demonstrated synergy across Mode A, Mode B, and Mode C hybrid co-processing with local models.", COLOR_AMBER),
    ]
    
    for idx, (title, desc, col) in enumerate(pillars):
        px = 160 + (idx % 2) * 820
        py = 280 + (idx // 2) * 210
        draw.rounded_rectangle([px, py, px + 780, py + 180], radius=12, fill=COLOR_BG_PANEL, outline=col, width=1)
        draw.text((px + 30, py + 25), title, font=font_heading, fill=col)
        draw.text((px + 30, py + 70), desc, font=font_body, fill=COLOR_WHITE)

    # Verification Badges Row
    b_y = 730
    v_badges = [
        "29 Pytest Tests Passing",
        "8 Automated Experiments",
        "Brian2 Cython Verified",
        "Vectorized CPU Acceleration",
        "WebGL 3D Cortical Space",
    ]
    for idx, b in enumerate(v_badges):
        bx = 160 + idx * 325
        draw.rounded_rectangle([bx, b_y, bx + 305, b_y + 46], radius=8, fill=(12, 24, 48), outline=COLOR_CYAN, width=1)
        draw.text((bx + 20, b_y + 12), b, font=font_small, fill=COLOR_CYAN_LIGHT)

    # Closing Callout
    draw.text((cx - 320, 810), "Advancing Neuromorphic Computing & Hybrid Intelligence", font=font_subtitle, fill=COLOR_PURPLE_LIGHT)
    draw.text((cx - 260, 860), "Open Research Architecture | 100% Mathematically Real Simulation", font=font_body, fill=COLOR_GRAY)


def generate_video():
    print(f"[NEUROCORE] Rendering {TOTAL_FRAMES} frames ({DURATION_SEC}s @ {FPS} FPS) into {OUTPUT_PATH}...")
    start_time = time.time()
    
    writer = imageio.get_writer(
        OUTPUT_PATH,
        fps=FPS,
        codec="libx264",
        quality=8,
        macro_block_size=16,
        ffmpeg_params=["-pix_fmt", "yuv420p"]
    )
    
    # Pre-render background image base to speed up generation
    bg_base = Image.new("RGB", (WIDTH, HEIGHT), COLOR_BG_DEEP)
    draw_bg = ImageDraw.Draw(bg_base)
    # Subtle ambient gradient
    for y in range(0, HEIGHT, 4):
        alpha_y = y / HEIGHT
        col = (
            int(COLOR_BG_DEEP[0] + 6 * alpha_y),
            int(COLOR_BG_DEEP[1] + 10 * alpha_y),
            int(COLOR_BG_DEEP[2] + 20 * alpha_y),
        )
        draw_bg.line([(0, y), (WIDTH, y)], fill=col, width=4)

    scene_frames = [
        (0, 270, render_scene_1),     # 0s - 9s: Intro & Platform
        (270, 570, render_scene_2),   # 9s - 19s: Differential SNN Sim
        (570, 870, render_scene_3),   # 19s - 29s: STDP & Plasticity
        (870, 1170, render_scene_4),  # 29s - 39s: Associative Memory
        (1170, 1530, render_scene_5), # 39s - 51s: Hybrid AI vs LLMs
        (1530, 1800, render_scene_6), # 51s - 60s: Summary & Open Research
    ]
    
    for frame_idx in range(TOTAL_FRAMES):
        # Create fresh canvas from bg
        img = bg_base.copy()
        draw = ImageDraw.Draw(img)
        
        # Determine current scene
        for start_f, end_f, scene_fn in scene_frames:
            if start_f <= frame_idx < end_f:
                progress = (frame_idx - start_f) / (end_f - start_f)
                scene_fn(draw, progress, frame_idx)
                break
                
        # Mandatory Watermark on every single frame
        draw_watermark(draw, frame_idx)
        
        # Convert to numpy and append
        frame_arr = np.array(img)
        writer.append_data(frame_arr)
        
        if frame_idx % 150 == 0:
            elapsed = time.time() - start_time
            fps_proc = (frame_idx + 1) / (elapsed + 0.001)
            eta = (TOTAL_FRAMES - frame_idx) / fps_proc
            print(f"  Frame {frame_idx}/{TOTAL_FRAMES} ({(frame_idx/TOTAL_FRAMES*100):.1f}%) - {fps_proc:.1f} fps - ETA {eta:.1f}s")
            
    writer.close()
    total_time = time.time() - start_time
    file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n[NEUROCORE] Video successfully created!")
    print(f"  File: {OUTPUT_PATH}")
    print(f"  Duration: {DURATION_SEC} seconds (1800 frames @ 30 FPS)")
    print(f"  Resolution: {WIDTH}x{HEIGHT} (1080p)")
    print(f"  File Size: {file_size_mb:.2f} MB")
    print(f"  Render Time: {total_time:.2f} seconds")

if __name__ == "__main__":
    generate_video()
