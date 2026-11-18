# BRACE — Mathematical & DAA Algorithmic Specification

## Branch-and-Bound Risk Analysis for Cybersecurity and Exposure

### 1. Mathematical Formulation: 0/1 Knapsack Problem

Given $n$ candidate defensive security controls:
- Each control $i$ has an implementation and operational cost $c_i > 0$.
- Each control $i$ delivers an estimated risk reduction value $v_i > 0$.
- The enterprise has a total security defense budget constraint $B$.

The optimization objective is to find the binary decision vector $\mathbf{x} = [x_1, x_2, \dots, x_n] \in \{0, 1\}^n$ that maximizes total protected value:

$$\text{Maximize } Z = \sum_{i=1}^n v_i \cdot x_i$$

$$\text{Subject to } \sum_{i=1}^n c_i \cdot x_i \le B$$

$$x_i \in \{0, 1\} \quad \forall i \in \{1, \dots, n\}$$

---

### 2. Algorithmic Paradigms Compared

#### Algorithm 1: Brute Force Exhaustive Enumeration
- **Search Strategy:** Generates all $2^n$ bitmask subsets.
- **Feasibility Test:** $\sum c_i \cdot x_i \le B$.
- **Time Complexity:** $\mathcal{O}(n \cdot 2^n)$.
- **Space Complexity:** $\mathcal{O}(n)$.
- **Optimality:** Provably guaranteed global optimum. Intractable for $n > 22$.

#### Algorithm 2: Greedy Heuristic (Value-to-Cost Ratio)
- **Heuristic Metric:** $r_i = \frac{v_i}{c_i}$.
- **Selection Rule:** Sorts items descending by ratio $r_i$ (with tie-breaking by item ID). Greedily selects items that fit within the residual budget.
- **Time Complexity:** $\mathcal{O}(n \log n)$ due to sorting.
- **Space Complexity:** $\mathcal{O}(n)$.
- **Optimality:** **Not guaranteed.** Greedy is subject to budget fragmentation where high-ratio small items prevent selection of larger high-value items.
- **Optimality Gap:** $\text{Gap}(\%) = \frac{Z^* - Z_{\text{greedy}}}{Z^*} \times 100\%$.

#### Algorithm 3: Branch and Bound (DFS & Best-First)
- **Search Tree:** Binary state-space tree where level $i$ branches on $x_i = 1$ (include) or $x_i = 0$ (exclude).
- **Upper Bound Function:** Continuous / Fractional Knapsack Relaxation:
  $$UB(node) = \text{val}_{\text{curr}} + \sum_{k \in \text{fitting}} v_k + \left( \frac{B - \text{cost}_{\text{curr}} - \sum c_k}{c_{\text{partial}}} \right) \cdot v_{\text{partial}}$$
- **Pruning Criteria:**
  1. **Infeasibility Pruning:** $\text{cost}_{\text{curr}} > B$.
  2. **Bound Pruning:** $UB(node) \le Z_{\text{best}}$ (incumbent).
- **Time Complexity:** $\mathcal{O}(2^n)$ worst-case, $\mathcal{O}(1.2^n - 1.4^n)$ practical average.
- **Optimality:** Provably identical to Brute Force: $Z^*_{BB} = Z^*_{BF}$.

---

### 3. Risk Engine Formulation

Asset risk:
$$R_j = I_j \times P_j$$
Where:
- $I_j$ is Asset Criticality ($1 \dots 10$).
- $P_j$ is Vulnerability Score ($0.0 \dots 1.0$).

Total baseline network exposure:
$$R_{\text{total}} = \sum_{j \in V} R_j$$

Residual Risk with Mitigations:
$$R_{\text{residual}} = \sum_{j \in V} \left( R_j \cdot \prod_{k \in \text{applicable controls}} (1 - \rho_k) \right)$$
Where $\rho_k$ is the normalized risk reduction rate of deployed control $k$.
