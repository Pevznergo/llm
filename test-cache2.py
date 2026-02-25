import httpx
import os

master = "sk-1234"
urls = [
    "http://127.0.0.1:4000/cache/redis/flushall",
    "http://127.0.0.1:4000/v1/cache/redis/flushall",
    "http://127.0.0.1:4000/cache/flush",
    "http://127.0.0.1:4000/redis/flushall",
    "http://127.0.0.1:4000/router/flushall"
]

try:
    with httpx.Client() as c:
        for u in urls:
            res = c.post(u, headers={"Authorization": f"Bearer {master}"})
            print(f"{u} -> {res.status_code}")
except Exception as e:
    print(e)
