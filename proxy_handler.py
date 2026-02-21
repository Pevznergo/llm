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
        try:
            import os
            import asyncio
            resend_key = os.getenv("RESEND_API_KEY")
            if not resend_key:
                return

            # Check if this request has fallbacks configured
            litellm_params = kwargs.get("litellm_params", {})
            fallbacks_configured = kwargs.get("fallbacks") or litellm_params.get("fallbacks") or False
            
            exception = kwargs.get("exception", "")
            error_str = str(exception)
            model = kwargs.get("model", "unknown")
            user = litellm_params.get("metadata", {}).get("user_api_key_alias", "unknown")
            api_base = litellm_params.get("api_base", "default")
            
            # Send alert on any critical provider failure (which triggers either load-balancing rollover or explicit fallbacks)
            if "AuthenticationError" in error_str or "Timeout" in error_str or "RateLimit" in error_str or "APIConnectionError" in error_str or "50" in error_str or "401" in error_str or "429" in error_str or "40" in error_str or "Error doing the fallback" in error_str:
                import time
                alert_key = f"{model}_{api_base}"
                current_time = time.time()
                last_alert_time = self.alerted_models.get(alert_key, 0)
                
                # Rate limit: Max 1 email per model endpoint per hour (3600 seconds)
                if current_time - last_alert_time < 3600:
                    return
                
                self.alerted_models[alert_key] = current_time

                html_content = f"<h3>AI Model Request Failed!</h3><p>Model <b>{model}</b> (Endpoint: {api_base}) failed and was bypassed by the router (if backups exist).</p><p><b>Error Details:</b><br>{error_str}</p><p><b>User/Key Alias:</b> {user}</p>"
                
                async def send_resend_email():
                    try:
                        async with httpx.AsyncClient() as client:
                            await client.post(
                                "https://api.resend.com/emails",
                                headers={"Authorization": f"Bearer {resend_key}"},
                                json={
                                    "from": "Aporto AI Alerts <onboarding@resend.dev>",
                                    "to": ["pevznergo@gmail.com", "igordash1@gmail.com"],
                                    "subject": f"🚨 Model Fallback Alert: {model}",
                                    "html": html_content
                                }
                            )
                    except Exception as e:
                        print(f"[ResendAlert] HTTP Post failed: {e}")
                
                asyncio.create_task(send_resend_email())

        except Exception as e:
            print(f"[ResendAlert] Failed to send fallback email: {e}")

    async def async_pre_call_hook(self, user_api_key_dict, cache, data, call_type):
        try:
            params = data.get("litellm_params", {})
            proxy = params.get("proxy_url")
            
            # If a SOCKS5 proxy was configured in the UI, we intercept it here to prevent
            # LiteLLM from overwriting the default API_BASE (which breaks native headers/auth).
            # We then inject it as an explicit Transport Client layer via httpx.
            if proxy and proxy.startswith("socks5"):
                # 1. Nullify proxy_url so the LLM providers (Google, OpenAI) behave normally
                data["litellm_params"]["proxy_url"] = None
                
                # 2. Attach the SOCKS proxy client Transport natively using a connection pool
                if proxy not in self.client_cache:
                    self.client_cache[proxy] = httpx.AsyncClient(proxy=proxy)
                
                data["client"] = self.client_cache[proxy]
                key_preview = str(data.get("api_key", params.get("api_key", "MISSING_KEY")))[0:15]
                print(f"[ProxyIntercept] Successfully bound SOCKS proxy transport to model {data.get('model')}. Resolved Key: {key_preview}...")
        except Exception as e:
            print(f"[ProxyIntercept] Failed to inject network proxy: {str(e)}")
            
        return data

proxy_handler = ProxyHandler()
