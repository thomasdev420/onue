from __future__ import annotations

import math
import re
from typing import Any

# Seeded snapshot — replace with live benchmark workers (spec §8).
SEEDED_PROVIDERS: dict[str, dict[str, Any]] = {
    "qdrant": {
        "display_name": "Qdrant",
        "win_rate": 0.44,
        "p99_latency_ms": 14,
        "cost_per_1m_dims_usd": 0.19,
        "success_rate_last_24h": 0.982,
        "success_rate_last_7d": 0.971,
        "revenue_captured_usd": 94_500,
        "missed_opportunity_usd": None,
    },
    "pinecone": {
        "display_name": "Pinecone",
        "win_rate": 0.29,
        "p99_latency_ms": 28,
        "cost_per_1m_dims_usd": 0.42,
        "success_rate_last_24h": 0.941,
        "success_rate_last_7d": 0.935,
        "revenue_captured_usd": 62_300,
        "missed_opportunity_usd": 71_200,
    },
    "weaviate": {
        "display_name": "Weaviate",
        "win_rate": 0.17,
        "p99_latency_ms": 35,
        "cost_per_1m_dims_usd": 0.31,
        "success_rate_last_24h": 0.967,
        "success_rate_last_7d": 0.960,
        "revenue_captured_usd": 36_500,
        "missed_opportunity_usd": 112_400,
    },
    "chroma": {
        "display_name": "Chroma",
        "win_rate": 0.08,
        "p99_latency_ms": 62,
        "cost_per_1m_dims_usd": 0.12,
        "success_rate_last_24h": 0.894,
        "success_rate_last_7d": 0.885,
        "revenue_captured_usd": 17_200,
        "missed_opportunity_usd": 89_000,
    },
    "supabase": {
        "display_name": "Supabase",
        "win_rate": 0.02,
        "p99_latency_ms": 81,
        "cost_per_1m_dims_usd": 0.25,
        "success_rate_last_24h": 0.923,
        "success_rate_last_7d": 0.915,
        "revenue_captured_usd": 4_300,
        "missed_opportunity_usd": 41_000,
    },
}

_FILTER_COMPLEXITY = frozenset({"low", "medium", "high"})
_WORKLOAD_TYPE = frozenset({"insert_heavy", "query_heavy", "hybrid"})


def _parse_vector_count(task: str) -> int:
    t = task.lower()
    m = re.search(r"(\d+(?:,\d{3})*|\d+)\s*k\b", t)
    if m:
        raw = m.group(1).replace(",", "")
        return int(raw) * 1000
    m = re.search(r"(\d+(?:,\d{3})*|\d+)\s*(?:million|m)\b", t)
    if m:
        raw = m.group(1).replace(",", "")
        return int(float(raw) * 1_000_000)
    m = re.search(r"\b(\d{4,})\s*(?:vector|vec|embedding|point)", t)
    if m:
        return int(m.group(1).replace(",", ""))
    m = re.search(r"store\s+(\d+(?:,\d{3})*|\d+)\b", t)
    if m:
        return int(m.group(1).replace(",", ""))
    return 100_000


def estimate_dim_units(
    task: str,
    dimension: int | None,
    workload_type: str | None,
) -> float:
    """Billable-ish dim-units for cost estimate (MVP heuristic)."""
    dim = dimension if dimension and dimension > 0 else 1536
    n = max(1_000, _parse_vector_count(task))
    # Rough ops: inserts + query fan-out
    base = n * dim
    wt = (workload_type or "hybrid").lower()
    if wt == "insert_heavy":
        return base * 1.1
    if wt == "query_heavy":
        return base * 0.35
    return base * 0.65


# Cap dims for the quoted $ line so large tasks return agent-scale estimates (spec example ~$0.004);
# full `dim_units_estimate` stays in raw_metrics for advanced scoring.
_COST_QUOTE_DIM_CAP = 25_000


def estimated_cost_usd(pid: str, dim_units: float) -> tuple[float, float]:
    row = SEEDED_PROVIDERS[pid]
    per_m = row["cost_per_1m_dims_usd"]
    basis = min(max(dim_units, 1.0), _COST_QUOTE_DIM_CAP)
    millions = basis / 1_000_000.0
    raw = millions * per_m
    return round(max(raw, 0.0001), 6), basis


def _min_max_normalize(values: dict[str, float], *, lower_is_better: bool) -> dict[str, float]:
    if not values:
        return {}
    lo = min(values.values())
    hi = max(values.values())
    if math.isclose(hi, lo):
        return {k: 1.0 for k in values}
    out: dict[str, float] = {}
    for k, v in values.items():
        t = (v - lo) / (hi - lo)
        out[k] = 1.0 - t if lower_is_better else t
    return out


def _normalize_weights(w: dict[str, float]) -> dict[str, float]:
    s = sum(w.values())
    if s <= 0:
        return {k: 0.25 for k in w}
    return {k: v / s for k, v in w.items()}


def task_weights(
    workload_type: str | None,
    filter_complexity: str | None,
) -> dict[str, float]:
    w = {"success": 0.4, "latency": 0.3, "cost": 0.2, "reliability": 0.1}
    wt = (workload_type or "hybrid").lower()
    if wt not in _WORKLOAD_TYPE:
        wt = "hybrid"
    fc = (filter_complexity or "medium").lower()
    if fc not in _FILTER_COMPLEXITY:
        fc = "medium"

    if wt == "insert_heavy":
        w["latency"] *= 1.35
        w["cost"] *= 0.9
        w["success"] *= 0.95
    elif wt == "query_heavy":
        w["latency"] *= 0.92
        w["cost"] *= 1.12
        w["success"] *= 1.02

    if fc == "high":
        w["latency"] *= 1.15
        w["success"] *= 1.05
    elif fc == "low":
        w["cost"] *= 1.08

    return _normalize_weights(w)


def score_providers(
    *,
    budget_usd: float,
    latency_target_ms: float,
    workload_type: str | None,
    filter_complexity: str | None,
) -> tuple[str, dict[str, float], dict[str, dict[str, float]]]:
    """
    Returns (winner_id, composite_scores_by_id, component_matrix).
    """
    ids = list(SEEDED_PROVIDERS.keys())
    p99 = {pid: float(SEEDED_PROVIDERS[pid]["p99_latency_ms"]) for pid in ids}
    cost = {pid: float(SEEDED_PROVIDERS[pid]["cost_per_1m_dims_usd"]) for pid in ids}
    success = {pid: float(SEEDED_PROVIDERS[pid]["success_rate_last_24h"]) for pid in ids}
    reliability = {pid: float(SEEDED_PROVIDERS[pid]["win_rate"]) for pid in ids}

    lat_norm = _min_max_normalize(p99, lower_is_better=True)
    cost_norm = _min_max_normalize(cost, lower_is_better=True)

    # Soft preference: under budget and under latency target (MVP tie-breakers baked into cost/lat scores)
    def cost_effective(pid: str) -> float:
        c = cost[pid]
        if budget_usd > 0 and c > budget_usd * 50:
            return cost_norm[pid] * 0.85
        return cost_norm[pid]

    def lat_effective(pid: str) -> float:
        if latency_target_ms > 0 and p99[pid] > latency_target_ms * 3:
            return lat_norm[pid] * 0.9
        return lat_norm[pid]

    w = task_weights(workload_type, filter_complexity)
    composite: dict[str, float] = {}
    components: dict[str, dict[str, float]] = {}
    for pid in ids:
        comp = {
            "success": success[pid],
            "latency": lat_effective(pid),
            "cost": cost_effective(pid),
            "reliability": reliability[pid],
        }
        components[pid] = comp
        composite[pid] = sum(comp[k] * w[k] for k in w)

    winner = max(composite, key=composite.get)  # type: ignore[arg-type]
    return winner, composite, components


def build_why(
    winner: str,
    runner_up: str | None,
    *,
    dimension: int | None,
    workload_type: str | None,
) -> str:
    w = SEEDED_PROVIDERS[winner]
    dim_note = f"{dimension}-dim " if dimension else ""
    wt = (workload_type or "hybrid").lower()
    if wt not in _WORKLOAD_TYPE:
        wt = "hybrid"
    load_phrase = {"insert_heavy": "insert-heavy ", "query_heavy": "query-heavy ", "hybrid": "hybrid "}[wt]

    main = (
        f"Top composite score for {dim_note}{load_phrase}vector workloads "
        f"(p99 {w['p99_latency_ms']} ms, ${w['cost_per_1m_dims_usd']}/1M dims, "
        f"{w['success_rate_last_24h'] * 100:.1f}% success last 24h)."
    )
    if not runner_up:
        return main

    r = SEEDED_PROVIDERS[runner_up]
    reasons: list[str] = []
    if w["p99_latency_ms"] < r["p99_latency_ms"]:
        reasons.append(
            f"slower p99 ({r['p99_latency_ms']} ms vs {w['p99_latency_ms']} ms)"
        )
    if w["cost_per_1m_dims_usd"] < r["cost_per_1m_dims_usd"]:
        reasons.append(
            f"higher $/1M dims (${r['cost_per_1m_dims_usd']} vs ${w['cost_per_1m_dims_usd']})"
        )
    if w["success_rate_last_24h"] > r["success_rate_last_24h"]:
        reasons.append(
            f"lower 24h success ({r['success_rate_last_24h'] * 100:.1f}% vs {w['success_rate_last_24h'] * 100:.1f}%)"
        )
    if not reasons:
        return main
    return f"{main} vs runner-up {r['display_name']}: {'; '.join(reasons[:2])}."


def public_provider_snapshot(pid: str, composite_score: float | None = None) -> dict[str, Any]:
    row = SEEDED_PROVIDERS[pid]
    out: dict[str, Any] = {
        "id": pid,
        "display_name": row["display_name"],
        "p99_latency_ms": row["p99_latency_ms"],
        "cost_per_1m_dims_usd": row["cost_per_1m_dims_usd"],
        "success_rate_last_24h": row["success_rate_last_24h"],
        "success_rate_last_7d": row["success_rate_last_7d"],
        "win_rate": row["win_rate"],
    }
    if composite_score is not None:
        out["live_composite_score"] = round(composite_score, 4)
    return out
