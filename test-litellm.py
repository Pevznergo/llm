import asyncio
from litellm import acompletion
import httpx

async def main():
    try:
        # Create an explicit proxy client just like proxy_handler
        client = httpx.AsyncClient(proxy="http://127.0.0.1:8080")
        
        # Test how LiteLLM's openai parser reacts to 'http_client'
        resp = await acompletion(
            model="openai/gemini-2.5-pro",
            api_base="https://api.kie.ai/v1",
            api_key="123",
            messages=[{"role": "user", "content": "hi"}],
            http_client=client
        )
        print(resp)
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
