import asyncio
from httpx import AsyncClient

async def main():
    try:
        # proxy example
        client = AsyncClient(proxy="http://127.0.0.1:8080")
        print("created")
    except Exception as e:
        print(e)
asyncio.run(main())
