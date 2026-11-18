# BRACE — Branch-and-Bound Risk Analysis for Cybersecurity and Exposure

BRACE is an advanced cybersecurity simulation and defensive resource allocation platform powered by Design and Analysis of Algorithms (DAA) paradigms (0/1 Knapsack problem solved via Brute Force, Greedy Heuristics, and Branch-and-Bound).

---

## Quick Start (Already Running)

The application is currently running:
- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## How to Run from Scratch

If you restart your machine or open new terminals, follow these two steps:

### Terminal 1: Backend (FastAPI)
```powershell
cd d:\randoms\BRACE
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000` with interactive OpenAPI docs at `/docs`.*

### Terminal 2: Frontend (React + Vite)
```powershell
cd d:\randoms\BRACE\frontend
npm run dev
```
*Frontend opens on `http://localhost:3000`.*

---

## First-Time Setup (On a New Machine)

### 1. Python Dependencies
```powershell
cd d:\randoms\BRACE
pip install -r backend/requirements.txt
```

### 2. Node.js Dependencies
```powershell
cd d:\randoms\BRACE\frontend
npm install
```

---

## Core Application Navigation

1. **Command Center** (`/`): Real-time security posture, asset health, active CVE threat counts, and baseline exposure.
2. **Algorithm Arena** (`/algorithm-arena`): Head-to-head comparison of all 4 DAA engines (Brute Force, Greedy Ratio, Branch & Bound DFS, and Branch & Bound Best-First) with microsecond timing and sub-optimal cost analysis.
3. **Attack Reconstruction** (`/attack-reconstruction`): Step-by-step MITRE ATT&CK kill-chain animation, lateral movement graphs, and detection containment logs.
4. **Network Lab** (`/network-lab`): Interactive enterprise topology visualizer ($G=(V, E)$), asset inspector, and synthetic scenario generator.
5. **Optimization** (`/optimization`): Knapsack solver parameter control, budget adjustment, and control allocation.
6. **Performance Lab** (`/performance-lab`): Empirical runtime complexity benchmark curves ($O(2^n)$ vs $O(n \log n)$).
