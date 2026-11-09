"""
NEUROCORE - Server Launch Script
Starts the FastAPI application and WebSocket server with Uvicorn.
Serves the REST API and the bundled Three.js React workstation at http://127.0.0.1:8000.
"""

import os
import sys
import uvicorn

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def main():
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "False").lower() == "true"

    print("=" * 75)
    print("   NEUROCORE - SYNTHETIC BIOLOGICAL COMPUTING RESEARCH WORKSTATION")
    print("=" * 75)
    print(f"Server starting on: http://{host}:{port}")
    print(f"Local Ollama Endpoint: http://127.0.0.1:11434")
    print(f"API Docs available at: http://{host}:{port}/docs")
    print("=" * 75)

    uvicorn.run(
        "backend.api.app:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info",
    )

if __name__ == "__main__":
    main()
