import asyncio
import os
import litellm
from litellm import Router

class MyLogger(litellm.integrations.custom_logger.CustomLogger):
    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        print("--- FAILURE ---")
        print("Model:", kwargs.get("model"))
        print("Exception:", type(kwargs.get("exception")))

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        print("--- SUCCESS ---")
        print("Model (succeeded):", kwargs.get("model"))
        print("Requested Model:", kwargs.get("litellm_params", {}).get("model"))
        print("Model Group:", kwargs.get("litellm_params", {}).get("metadata", {}).get("model_group"))

litellm.callbacks = [MyLogger()]
router = Router(
    model_list=[
        {
            "model_name": "test-group",
            "litellm_params": {
                "model": "openai/fake-model-that-fails",
                "api_key": "bad-key",
                "api_base": "http://127.0.0.1:9999" # fast fail
            }
        },
        {
            "model_name": "test-group",
            "litellm_params": {
                "model": "gemini/gemini-pro",
                "api_key": os.getenv("GEMINI_API_KEY", "dummy")
            }
        }
    ],
    fallbacks=[{"test-group": ["test-group"]}]
)

async def main():
    try:
        await router.acompletion(
            model="test-group",
            messages=[{"role": "user", "content": "hi"}],
            fallbacks=["gemini/gemini-1.5-flash"] # fallback if first fails
        )
        print("Success final")
    except Exception as e:
        print("Final err:", e)

asyncio.run(main())
