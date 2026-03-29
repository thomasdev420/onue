from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import Settings, get_api_key_set
from app.providers import (
    SEEDED_PROVIDERS,
    build_why,
    estimate_dim_units,
    estimated_cost_usd,
    public_provider_snapshot,
    score_providers,
    task_weights,
)

security = HTTPBearer(auto_error=False)


def _benchmark_timestamp_iso() -> str:
    now = datetime.now(timezone.utc)
    slot = (now.minute // 15) * 15
    aligned = now.replace(minute=slot, second=0, microsecond=0)
    return aligned.strftime("%Y-%m-%dT%H:%M:%SZ")


def rate_limit_key(request: Request) -> str:
    auth = request.headers.get("Authorization") or ""
    if auth.startswith("Bearer ") and auth[7:].strip():
        return auth[7:].strip()
    return get_remote_address(request)


settings = Settings()
limiter = Limiter(key_func=rate_limit_key)

app = FastAPI(
    title="Amply API",
    version="3.1.8",
    description="Amply routing API for AI agents — vector DB MVP (seeded metrics).",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def verify_api_key(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    keys = get_api_key_set()
    if not keys:
        return None
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = creds.credentials.strip()
    if token not in keys:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return token


class RouteRequest(BaseModel):
    task: str = Field(..., min_length=1, max_length=8_000)
    budget_usd: float = Field(default=0.01, ge=0)
    latency_target_ms: float = Field(default=200, ge=0)
    dimension: Optional[int] = Field(default=None, ge=1, le=65_536)
    filter_complexity: Optional[Literal["low", "medium", "high"]] = None
    workload_type: Optional[Literal["insert_heavy", "query_heavy", "hybrid"]] = None


class RouteResponse(BaseModel):
    recommended: str
    score: float
    estimated_cost_usd: float
    expected_p99_latency_ms: int
    success_rate_last_24h: float
    success_rate_last_7d: float
    why: str
    raw_metrics: dict[str, Any]
    request_id: str


@app.get("/v1/status")
def status() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "amply",
        "version": "3.1.8",
        "last_benchmark_at": _benchmark_timestamp_iso(),
        "data_mode": "seeded",
    }


@app.get("/v1/providers")
def list_providers() -> dict[str, Any]:
    w = task_weights(None, None)
    _, composite, _ = score_providers(
        budget_usd=0.01,
        latency_target_ms=200,
        workload_type="hybrid",
        filter_complexity="medium",
    )
    items = [public_provider_snapshot(pid, composite.get(pid)) for pid in SEEDED_PROVIDERS]
    return {"providers": items, "default_scoring_weights": w}


@app.post("/v1/route", response_model=RouteResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
def route_task(
    request: Request, body: RouteRequest, _auth: Optional[str] = Depends(verify_api_key)
) -> RouteResponse:
    _ = request
    winner, composite, components = score_providers(
        budget_usd=body.budget_usd,
        latency_target_ms=body.latency_target_ms,
        workload_type=body.workload_type,
        filter_complexity=body.filter_complexity,
    )
    ranked = sorted(composite.items(), key=lambda x: x[1], reverse=True)
    runner_up = ranked[1][0] if len(ranked) > 1 else None

    dim_units = estimate_dim_units(body.task, body.dimension, body.workload_type)
    cost_usd, cost_basis_dims = estimated_cost_usd(winner, dim_units)
    wrow = SEEDED_PROVIDERS[winner]
    why = build_why(winner, runner_up, dimension=body.dimension, workload_type=body.workload_type)

    all_providers: dict[str, Any] = {}
    for pid in SEEDED_PROVIDERS:
        row = SEEDED_PROVIDERS[pid]
        all_providers[pid] = {
            "composite_score": round(composite[pid], 4),
            "components": {k: round(v, 4) for k, v in components[pid].items()},
            "p99_latency_ms": row["p99_latency_ms"],
            "cost_per_1m_dims_usd": row["cost_per_1m_dims_usd"],
            "success_rate_last_24h": row["success_rate_last_24h"],
            "success_rate_last_7d": row["success_rate_last_7d"],
            "win_rate": row["win_rate"],
            "revenue_captured_usd": row["revenue_captured_usd"],
            "missed_opportunity_usd": row["missed_opportunity_usd"],
        }

    raw_metrics = {
        "all_providers": all_providers,
        "weights": task_weights(body.workload_type, body.filter_complexity),
        "dim_units_estimate": round(dim_units, 2),
        "cost_quote_dim_units": cost_basis_dims,
        "budget_usd": body.budget_usd,
        "latency_target_ms": body.latency_target_ms,
    }

    return RouteResponse(
        recommended=winner,
        score=round(composite[winner], 4),
        estimated_cost_usd=cost_usd,
        expected_p99_latency_ms=int(wrow["p99_latency_ms"]),
        success_rate_last_24h=float(wrow["success_rate_last_24h"]),
        success_rate_last_7d=float(wrow["success_rate_last_7d"]),
        why=why,
        raw_metrics=raw_metrics,
        request_id=str(uuid.uuid4()),
    )


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
