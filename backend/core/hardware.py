"""
NEUROCORE - Hardware Detection & Profiling Engine
Detects CPU, RAM, GPU, CUDA, and monitors real-time system performance.
"""

import platform
import psutil
from typing import Dict, Any


def get_hardware_profile() -> Dict[str, Any]:
    """Inspect and profile the host machine hardware."""
    # PyTorch and CUDA detection
    cuda_available = False
    cuda_device_count = 0
    cuda_device_name = "None"
    torch_version = "Not Loaded"

    try:
        import torch
        torch_version = torch.__version__
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            cuda_device_count = torch.cuda.device_count()
            cuda_device_name = torch.cuda.get_device_name(0)
    except Exception:
        pass

    # CPU & RAM detection
    cpu_freq = psutil.cpu_freq()
    vm = psutil.virtual_memory()

    return {
        "os": platform.platform(),
        "processor": platform.processor(),
        "cpu_count_physical": psutil.cpu_count(logical=False),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_freq_mhz": round(cpu_freq.current, 1) if cpu_freq else 0.0,
        "ram_total_gb": round(vm.total / (1024 ** 3), 2),
        "ram_available_gb": round(vm.available / (1024 ** 3), 2),
        "ram_percent_used": vm.percent,
        "cuda_available": cuda_available,
        "cuda_device_count": cuda_device_count,
        "cuda_device_name": cuda_device_name,
        "torch_version": torch_version,
        "recommended_device": "cuda" if cuda_available else "cpu",
    }


def get_process_resource_usage() -> Dict[str, float]:
    """Capture current process CPU and memory utilization."""
    p = psutil.Process()
    mem_info = p.memory_info()
    return {
        "cpu_percent": p.cpu_percent(interval=None),
        "memory_rss_mb": round(mem_info.rss / (1024 * 1024), 2),
        "memory_vms_mb": round(mem_info.vms / (1024 * 1024), 2),
    }
