import httpx
import sys

endpoints = [
    "/cache/redis/flushall",
    "/v1/cache/redis/flushall",
    "/cache/flush",
    "/v1/cache/flush",
    "/v1/cache/clear",
    "/cache/clear",
    "/cache/redis/clear"
]
headers = {
    "Authorization": "Bearer sk-1234" # Dummy key just to see if it's 401 or 404
}
try:
    with httpx.Client() as client:
        for ep in endpoints:
            res = client.post(f"https://api.aporto.tech{ep}", headers=headers)
            print(f"{ep}: {res.status_code} {res.text}")
except Exception as e:
    print(e)
