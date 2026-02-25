import httpx
import json

data = {
    "model": "gemini-2.5-pro",
    "litellm_params": {
        "model": "openai/gemini-2.5-pro",
        "proxy_url": "socks5h://127.0.0.1:1080"
    }
}

# Emulate what proxy_handler does
proxy = data["litellm_params"].get("proxy_url")
if "proxy_url" in data.get("litellm_params", {}):
    data["litellm_params"].pop("proxy_url", None)

print(json.dumps(data, indent=2))
