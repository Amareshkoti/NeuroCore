"""
NEUROCORE - Ollama Local LLM Client
Direct integration with local Ollama daemon (defaults to http://127.0.0.1:11434).
Detects local models, produces vector embeddings, and executes configurable LLM inference.
"""

import os
import time
from typing import Dict, Any, List, Optional
import httpx


class OllamaClient:
    """
    Robust HTTP client for local Ollama server.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        default_model: str = "qwen2.5:3b-instruct",
        default_embed_model: str = "nomic-embed-text:latest",
        temperature: float = 0.7,
        context_size: int = 4096,
        timeout_seconds: float = 60.0,
    ) -> None:
        # Default to local machine endpoint as explicitly instructed by user
        env_endpoint = os.getenv("OLLAMA_ENDPOINT")
        self.endpoint = (endpoint or env_endpoint or "http://127.0.0.1:11434").rstrip("/")
        self.default_model = os.getenv("OLLAMA_DEFAULT_MODEL", default_model)
        self.default_embed_model = os.getenv("OLLAMA_DEFAULT_EMBED_MODEL", default_embed_model)
        self.temperature = temperature
        self.context_size = context_size
        self.timeout = timeout_seconds

    def is_available(self) -> bool:
        """Ping local Ollama daemon."""
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(f"{self.endpoint}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    def list_local_models(self) -> List[Dict[str, Any]]:
        """Query installed models from the local daemon."""
        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.get(f"{self.endpoint}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = []
                    for m in data.get("models", []):
                        models.append({
                            "name": m.get("name"),
                            "size_bytes": m.get("size"),
                            "modified_at": m.get("modified_at"),
                            "family": m.get("details", {}).get("family", "unknown"),
                            "parameter_size": m.get("details", {}).get("parameter_size", "unknown"),
                        })
                    return models
        except Exception:
            pass
        return []

    def get_embeddings(self, text: str, model: Optional[str] = None) -> List[float]:
        """
        Generate embedding vector via local embedding model (e.g. nomic-embed-text).
        If offline, provides deterministic fallback pseudo-embedding.
        """
        embed_model = model or self.default_embed_model
        try:
            with httpx.Client(timeout=self.timeout) as client:
                # Ollama embed endpoint
                res = client.post(
                    f"{self.endpoint}/api/embeddings",
                    json={"model": embed_model, "prompt": text},
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("embedding", [])
        except Exception:
            pass

        # Deterministic offline fallback (768-dimensional normalized pseudo-embedding)
        import hashlib
        import numpy as np
        rng = np.random.default_rng(int(hashlib.sha256(text.encode()).hexdigest()[:8], 16))
        vec = rng.normal(0, 1, 768).astype(np.float32)
        vec = vec / np.linalg.norm(vec)
        return vec.tolist()

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Execute text completion with timing and token metrics.
        """
        target_model = model or self.default_model
        temp = temperature if temperature is not None else self.temperature
        t_start = time.perf_counter()

        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temp,
                "num_ctx": self.context_size,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(f"{self.endpoint}/api/generate", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    elapsed = time.perf_counter() - t_start
                    return {
                        "success": True,
                        "model": target_model,
                        "response": data.get("response", ""),
                        "latency_sec": round(elapsed, 3),
                        "tokens_generated": data.get("eval_count", 0),
                        "prompt_eval_count": data.get("prompt_eval_count", 0),
                        "total_duration_ms": round(data.get("total_duration", 0) / 1e6, 1),
                    }
        except Exception as e:
            elapsed = time.perf_counter() - t_start
            return {
                "success": False,
                "error": str(e),
                "model": target_model,
                "latency_sec": round(elapsed, 3),
                "response": f"[Ollama local daemon unavailable: {e}]",
            }

        elapsed = time.perf_counter() - t_start
        return {
            "success": False,
            "error": "Failed to connect to Ollama",
            "model": target_model,
            "latency_sec": round(elapsed, 3),
            "response": "[Ollama returned non-200 code]",
        }
