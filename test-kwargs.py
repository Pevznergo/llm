import httpx
import json

data = {
    "model": "gemini",
    "litellm_params": {"proxy_url": "socks5h"},
    "kwargs": {"proxy_url": "socks5h"}
}

proxy = data.get("litellm_params", {}).get("proxy_url") or data.get("kwargs", {}).get("proxy_url")
if "proxy_url" in data.get("litellm_params", {}):
    data["litellm_params"].pop("proxy_url", None)
if "proxy_url" in data:
    data.pop("proxy_url", None)
if "proxy_url" in data.get("kwargs", {}):
    data["kwargs"].pop("proxy_url", None)

print(json.dumps(data, indent=2))
print("Proxy extracted:", proxy)
