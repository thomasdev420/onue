# amply-sdk (Python)

Official Python client for the [Amply](https://www.useamply.com) routing API (`POST /api/v1/route`).

## Install

```bash
pip install amply-sdk
```

Until published to PyPI, install from the repo subdirectory:

```bash
pip install "git+https://github.com/thomasdev420/onue.git#subdirectory=packages/amply-sdk-python"
```

## Usage

```python
import os
from amply_sdk import route_task

result = route_task(
    base_url="https://www.useamply.com",
    api_key=os.environ["AMPLY_API_KEY"],
    task="Store 1M 1536-dim vectors with metadata filters and low-latency queries",
    dimension=1536,
    workload_type="hybrid",
    filter_complexity="high",
)
print(result["recommended"], result.get("why"))
```

Stdlib only (`urllib`) — no extra dependencies.

## License

MIT
