"""
BRACE Explain — Natural-Language Explanation Engine.

Translates technical cybersecurity events and DAA algorithm execution traces
into understandable, three-layer explanations:
1. Technical Explanation (precise cybersecurity or algorithmic mechanics)
2. Plain-Language Explanation (accessible analogy for non-technical stakeholders)
3. Why It Matters (strategic impact or optimization significance)
"""

from __future__ import annotations

from typing import Any


class ExplanationEngine:
    """Generates structured 3-layer explanations for attacks and algorithms."""

    @staticmethod
    def explain_attack_event(
        event_type: str,
        stage: str,
        source_name: str,
        target_name: str,
        success: bool,
        technique: str = "",
    ) -> dict[str, str]:
        """Generate three-layer explanation for a simulated attack event."""
        if not success:
            return {
                "technical": (
                    f"Security controls on '{target_name}' successfully intercepted and blocked "
                    f"the unauthorized {event_type} attempt originating from '{source_name}'."
                ),
                "plain": (
                    f"The security alarm went off when an intruder tried to enter '{target_name}'. "
                    f"The door was locked securely, so the intruder was turned away."
                ),
                "why_it_matters": (
                    "Active defense controls halted the kill chain, preventing lateral spread "
                    "or data compromise from this vector."
                ),
            }

        # Successful events by stage
        if stage == "reconnaissance":
            return {
                "technical": (
                    f"Adversary completed automated network port and service scanning against '{target_name}' "
                    f"revealing active listening daemons and banner versions."
                ),
                "plain": (
                    f"A burglar is walking around '{target_name}', checking all the windows "
                    f"and doors to see which ones might be unlatched."
                ),
                "why_it_matters": (
                    "Reconnaissance provides the attacker with actionable intelligence on which vulnerabilities "
                    "to target for initial exploitation."
                ),
            }
        elif stage == "initial_access":
            return {
                "technical": (
                    f"Attacker exploited exposed boundary service on '{target_name}' using {technique or 'known CVE exploit'}, "
                    f"establishing an interactive reverse shell session."
                ),
                "plain": (
                    f"Someone managed to find an open rear window on '{target_name}' "
                    f"and climbed inside the facility."
                ),
                "why_it_matters": (
                    "Initial foothold established inside the perimeter; the attacker now operates "
                    "from within trusted network boundaries."
                ),
            }
        elif stage == "exploitation":
            return {
                "technical": (
                    f"Attacker executed privilege escalation payload on '{target_name}', bypassing kernel "
                    f"protections to elevate from standard user to administrative/root privileges."
                ),
                "plain": (
                    f"Once inside the building, the intruder picked the lock on the master key cabinet "
                    f"and took the keys to every room."
                ),
                "why_it_matters": (
                    "Administrative control allows disabling local audit logging and running arbitrary malicious tools."
                ),
            }
        elif stage == "lateral_movement":
            return {
                "technical": (
                    f"Using harvested credentials from '{source_name}', attacker pivoted across internal subnet "
                    f"via SMB/SSH to authenticate into '{target_name}'."
                ),
                "plain": (
                    f"Using the stolen keys from '{source_name}', the intruder quietly unlocked "
                    f"the door into the high-security records room at '{target_name}'."
                ),
                "why_it_matters": (
                    "Unrestricted lateral movement proves internal network segmentation is absent or insufficient, "
                    "enabling spread to high-value assets."
                ),
            }
        elif stage == "objective":
            return {
                "technical": (
                    f"Attacker initiated payload execution on target asset '{target_name}', performing "
                    f"data exfiltration and deploying cryptographic locking payloads."
                ),
                "plain": (
                    f"The intruder reached the central company safe at '{target_name}', copied all the secrets, "
                    f"and replaced them with a locked ransom box."
                ),
                "why_it_matters": (
                    "Primary business impact achieved: operational shutdown, intellectual property loss, and critical exposure."
                ),
            }
        elif stage == "detection":
            return {
                "technical": (
                    f"Behavioral telemetry on '{target_name}' detected anomalous process execution "
                    f"and outbound command-and-control beacons, triggering high-fidelity SIEM alerts."
                ),
                "plain": (
                    f"Security motion sensors inside '{target_name}' detected unexpected movement after hours "
                    f"and sounded the alarm at headquarters."
                ),
                "why_it_matters": (
                    "Early detection narrows the attacker's dwell time, enabling swift response before data destruction."
                ),
            }
        elif stage == "containment":
            return {
                "technical": (
                    f"Automated incident response policy dynamically isolated '{target_name}' from the internal router, "
                    f"terminating compromised sessions and quarantining infected binaries."
                ),
                "plain": (
                    f"Automated emergency doors slammed shut around '{target_name}', trapping the intruder "
                    f"and preventing them from reaching any other part of the building."
                ),
                "why_it_matters": (
                    "Containment neutralizes active threats and preserves forensic evidence while keeping surrounding systems safe."
                ),
            }
        else:
            return {
                "technical": f"Security event '{event_type}' processed between '{source_name}' and '{target_name}'.",
                "plain": f"Activity was noted between '{source_name}' and '{target_name}'.",
                "why_it_matters": "Maintains continuous visibility across network interactions.",
            }

    @staticmethod
    def explain_algorithm_decision(
        algorithm: str,
        action: str,
        item_name: str,
        item_cost: float,
        item_value: float,
        remaining_budget: float,
        upper_bound: float | None = None,
        incumbent_value: float | None = None,
    ) -> dict[str, str]:
        """Generate three-layer explanation for an algorithmic optimization step."""
        if algorithm.lower() == "greedy":
            ratio = round(item_value / item_cost, 2) if item_cost > 0 else 0
            if action == "select":
                return {
                    "technical": (
                        f"Greedy heuristic selected '{item_name}' (Cost: {item_cost}, Value: {item_value}, Ratio: {ratio}). "
                        f"It fits within the remaining budget of {remaining_budget + item_cost:.1f}."
                    ),
                    "plain": (
                        f"Greedy picks '{item_name}' because it gives the best bang for the buck ({ratio} points per dollar) "
                        f"and we still have enough money in the security budget."
                    ),
                    "why_it_matters": (
                        "Greedy quickly maximizes local efficiency, but because it never backtracks, "
                        "it might leave awkward budget remainders that miss larger overall combinations."
                    ),
                }
            else:
                return {
                    "technical": (
                        f"Greedy skipped '{item_name}' because its cost ({item_cost}) exceeds "
                        f"the available budget remaining ({remaining_budget})."
                    ),
                    "plain": (
                        f"We couldn't buy '{item_name}' because we only have ${remaining_budget:.1f} left, "
                        f"and it costs ${item_cost:.1f}."
                    ),
                    "why_it_matters": (
                        "Illustrates the fundamental 0/1 Knapsack limitation: fractional parts cannot be taken, "
                        "so budget fragmentation causes suboptimality."
                    ),
                }

        elif "branch" in algorithm.lower():
            if action == "prune_infeasible":
                return {
                    "technical": (
                        f"Branch pruned due to constraint infeasibility: accumulated cost exceeds the budget limit ({remaining_budget} < 0)."
                    ),
                    "plain": (
                        "We stopped exploring this path because buying this combination of security tools costs more money than we have."
                    ),
                    "why_it_matters": (
                        "Infeasibility pruning cuts off entire subtrees of impossible configurations instantly, saving exponential computation."
                    ),
                }
            elif action == "prune_bound":
                return {
                    "technical": (
                        f"Branch pruned by bound: optimistic upper bound ({upper_bound:.1f}) ≤ current best known solution ({incumbent_value:.1f}). "
                        f"No completion in this subtree can beat the incumbent."
                    ),
                    "plain": (
                        f"Even in the dream scenario where we took fractions of all remaining tools, this path can never get more than "
                        f"{upper_bound:.1f} value. We already have a complete solution worth {incumbent_value:.1f}, so exploring here is a waste of time."
                    ),
                    "why_it_matters": (
                        "This is the core mathematical power of Branch and Bound: provably pruning suboptimal search spaces without losing optimality."
                    ),
                }
            elif action == "incumbent_update":
                return {
                    "technical": (
                        f"New incumbent (best feasible solution) discovered with value {incumbent_value:.1f}."
                    ),
                    "plain": (
                        f"We found our best working plan yet! It gives {incumbent_value:.1f} total security protection while staying inside budget."
                    ),
                    "why_it_matters": (
                        "Raising the incumbent bar immediately allows the algorithm to prune subsequent branches much more aggressively."
                    ),
                }

        # Fallback / Brute force
        return {
            "technical": f"Evaluated subset containing '{item_name}'. Cost feasibility and value recorded.",
            "plain": f"Tested another possible combination of security defenses to see how much protection it provides.",
            "why_it_matters": "Exhaustive evaluation guarantees global optimality by checking every single combination.",
        }
