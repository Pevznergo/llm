import asyncio
import os
import litellm
from litellm import Router

class MyLogger(litellm.integrations.custom_logger.CustomLogger):
    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        print("--- FAILURE ---")
        print("Model:", kwargs.get("model"))
        print("Exception:", kwargs.get("exception"))

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        print("--- SUCCESS ---")
        print("Model:", kwargs.get("model"))
        print("Metadata:", kwargs.get("litellm_params", {}).get("metadata", {}))

litellm.callbacks = [MyLogger()]

router = Router(model_list=[
    {"model_name": "test-model", "litellm_params": {"model": "openai/gpt-3.5-turbo", "api_key": "bad-key"}},
    {"model_name": "test-model", "litellm_params": {"model": "openai/gpt-4-turbo", "api_key": os.getenv("OPENAI_API_KEY", "sk-test")}},
], fallbacks=[{"test-model": ["test-model"]}]) # wait, litellm fallbacks are just lists of models.

async def main():
    try:
        await router.acompletion(model="test-model", messages=[{"role": "user", "content": "hi"}], fallbacks=["test-model-fallback"])
    except Exception as e:
        print("Final err:", e)

asyncio.run(main())
