# BRACE — User & Operational Guide

## Getting Started

BRACE combines cybersecurity simulation and algorithm intelligence into an integrated dashboard based on the **Orion Charts UI Kit**.

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

---

### Running the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The FastAPI service and interactive OpenAPI documentation will be accessible at:
`http://localhost:8000/docs`

---

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open your browser to `http://localhost:3000`.

---

### Guided Walkthrough of 9 Core Modules

1. **Command Center (`/`):**
   - High-level overview of monitored assets, threat alerts, and 0/1 Knapsack optimization savings.
   - Live health chart with baseline vs residual risk trends.

2. **Network Lab (`/network-lab`):**
   - Interactive network canvas representing $G = (V, E)$.
   - Configure asset criticality, vulnerabilities, and generate synthetic topologies.

3. **Threat Intelligence (`/threat-intel`):**
   - CVE audit table with CVSS scores.
   - Defensive control catalogue with costs $c_i$ and risk reduction points $v_i$.

4. **Attack Reconstruction (`/attack-reconstruction`):**
   - 4-panel synchronized workspace: Network Canvas, Event Timeline, Event Inspector, and BRACE Explain.
   - Replay multi-stage attacks step-by-step with play, pause, and speed controls.

5. **Optimization Engine (`/optimization`):**
   - Configure security budget $B$ slider.
   - Select candidate controls and solve using Branch and Bound.

6. **Algorithm Studio (`/algorithm-studio`):**
   - Step-by-step visualizer for individual algorithms.
   - Interactive binary state-space search tree for Branch and Bound.

7. **Algorithm Arena (`/algorithm-arena`):**
   - Side-by-side execution of Brute Force, Greedy, and Branch & Bound on the exact same dataset.
   - Test the famous Greedy suboptimal counterexample with one click.

8. **Performance Lab (`/performance-lab`):**
   - 10 interactive Plotly analytics charts: Runtime vs Size, Nodes Explored, Pruning Efficiency, Optimality Gap, Memory, and Bounds.

9. **Reports & Evidence (`/reports`):**
   - Structured Incident Forensics, Optimization Audits, and Academic Benchmark Reports.
   - Export to JSON, CSV, or Print/PDF.
