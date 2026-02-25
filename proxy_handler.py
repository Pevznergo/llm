import litellm
import httpx

class ProxyHandler(litellm.integrations.custom_logger.CustomLogger):
    def __init__(self):
        super().__init__()
        # Connection pooling cache: Reusing httpx clients per proxy averts recreating TLS/TCP handshakes (saves 1-3 seconds per request)
        self.client_cache = {}
        # Rate-limiting dictionary to prevent email spam on continuous model failures
        self.alerted_models = {}

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        import os
        import asyncio

        try:
            # Cumulative Slack notification logic for models on cooldown
            slack_url = os.getenv("SLACK_WEBHOOK_URL")
            master_key = os.getenv("LITELLM_MASTER_KEY")
            
            if slack_url and master_key:
                litellm_params = kwargs.get("litellm_params", {})
                model = kwargs.get("model", "unknown")
                current_model_id = litellm_params.get("model_info", {}).get("id", str(model))
                
                async def send_slack_cumulative_alert():
                    try:
                        import asyncio
                        import httpx
                        # Give LiteLLM a moment to process the failure and put it in internal cooldown
                        await asyncio.sleep(1)
                        
                        async with httpx.AsyncClient() as client:
                            headers = {"Authorization": f"Bearer {master_key}"}
                            res = await client.get("http://127.0.0.1:4000/router/status", headers=headers)
                            
                            unhealthy_ids = []
                            if res.status_code == 200:
                                data = res.json()
                                unhealthy = data.get("unhealthy_endpoints", [])
                                for ep in unhealthy:
                                    ep_id = ep.get("litellm_params", {}).get("model_info", {}).get("id")
                                    if ep_id:
                                        unhealthy_ids.append(str(ep_id))
                            
                            # Fallback just in case the endpoint doesn't return the ones we expect
                            if not unhealthy_ids:
                                unhealthy_ids.append(current_model_id)

                            # Deduplicate and format
                            unhealthy_ids = list(set(unhealthy_ids))
                            ids_str = ", ".join(unhealthy_ids)
                            
                            slack_payload = {
                                "text": "Models on cooldown alert",
                                "blocks": [
                                    {
                                        "type": "header",
                                        "text": {
                                            "type": "plain_text",
                                            "text": "🚨 Models Currently on Cooldown",
                                            "emoji": True
                                        }
                                    },
                                    {
                                        "type": "section",
                                        "text": {
                                            "type": "mrkdwn",
                                            "text": f"The following proxy model IDs are currently experiencing repeated failures and have been temporarily bypassed:\n\n`{ids_str}`"
                                        }
                                    }
                                ]
                            }
                            await client.post(slack_url, json=slack_payload)
                    except Exception as e:
                        print(f"[SlackAlert] Cumulative alert failed: {e}")
                
                import asyncio
                asyncio.create_task(send_slack_cumulative_alert())

        except Exception as e:
            print(f"[SlackAlert] Setup failed: {e}")

    async def async_pre_call_hook(self, user_api_key_dict, cache, data, call_type):
        from fastapi import HTTPException
        
        # MAINTENANCE MODE: Block all requests made via virtual keys
        if user_api_key_dict is not None:
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "msg": "The server is currently being maintained, please try again later~"}
            )

        try:
            params = data.get("litellm_params", {})
            proxy = params.get("proxy_url")
            
            # If a proxy was configured in the UI, we intercept it here to prevent
            # LiteLLM from overwriting the default API_BASE (which breaks native headers/auth).
            # We then inject it as an explicit Transport Client layer via httpx.
            if proxy:
                if isinstance(proxy, str):
                    proxy = proxy.strip()

                # 1. Pop proxy_url completely so the LLM providers (Google, OpenAI) behave normally
                if "proxy_url" in data.get("litellm_params", {}):
                    data["litellm_params"].pop("proxy_url", None)
                
                if "proxy_url" in data:
                    data.pop("proxy_url", None)
                
                # Also remove from any nested kwargs that LiteLLM might pass down
                if "kwargs" in data and "proxy_url" in data["kwargs"]:
                    data["kwargs"].pop("proxy_url", None)
                # 2. Attach the proxy client Transport natively using a connection pool
                if proxy not in self.client_cache:
                    self.client_cache[proxy] = httpx.AsyncClient(proxy=proxy)
                
                # LiteLLM/OpenAI v1+ expects `http_client`, not `client`
                if "kwargs" not in data:
                    data["kwargs"] = {}
                data["kwargs"]["http_client"] = self.client_cache[proxy]
                
                key_preview = str(data.get("api_key", params.get("api_key", "MISSING_KEY")))[0:15]
                print(f"[ProxyIntercept] Successfully bound proxy transport to model {data.get('model')}. Resolved Key: {key_preview}...")
        except Exception as e:
            print(f"[ProxyIntercept] Failed to inject network proxy: {str(e)}")
            
        return data

proxy_handler = ProxyHandler()
