from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_BASE = "https://www.useamply.com"


class AmplyApiError(Exception):
    def __init__(self, status: int, body: Any):
        self.status = status
        self.body = body
        detail = body.get("detail") if isinstance(body, dict) else None
        msg = detail if isinstance(detail, str) else f"Amply API error HTTP {status}"
        super().__init__(msg)


def route_task(
    *,
    api_key: str,
    task: str,
    base_url: str = DEFAULT_BASE,
    dimension: int | None = None,
    workload_type: str | None = None,
    filter_complexity: str | None = None,
    budget_usd: float | None = None,
    latency_target_ms: int | None = None,
) -> dict[str, Any]:
    """
    POST /api/v1/route — returns recommendation JSON (recommended, score, why, ...).
    """
    if not api_key or not isinstance(api_key, str):
        raise TypeError("api_key is required")
    if not task or not isinstance(task, str):
        raise TypeError("task is required")

    origin = base_url.rstrip("/")
    url = f"{origin}/api/v1/route"

    payload: dict[str, Any] = {"task": task.strip()}
    if dimension is not None:
        payload["dimension"] = dimension
    if workload_type is not None:
        payload["workload_type"] = workload_type
    if filter_complexity is not None:
        payload["filter_complexity"] = filter_complexity
    if budget_usd is not None:
        payload["budget_usd"] = budget_usd
    if latency_target_ms is not None:
        payload["latency_target_ms"] = latency_target_ms

    body = json.dumps(payload).encode("utf-8")
    req = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    try:
        with urlopen(req, timeout=120) as resp:
            text = resp.read().decode("utf-8")
            data = json.loads(text)
            status = getattr(resp, "status", None) or 200
            if status >= 400:
                raise AmplyApiError(status, data)
            return data
    except HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_body = {"detail": e.reason}
        raise AmplyApiError(e.code, err_body) from e
    except URLError as e:
        raise AmplyApiError(0, {"detail": str(e.reason)}) from e
