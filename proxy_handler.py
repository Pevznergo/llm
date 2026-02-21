import litellm
import httpx

class ProxyHandler(litellm.integrations.custom_logger.CustomLogger):
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
                
                # 2. Attach the SOCKS proxy client Transport natively
                data["client"] = httpx.AsyncClient(proxy=proxy)
                print(f"[ProxyIntercept] Successfully bound SOCKS proxy transport to model {data.get('model')}")
        except Exception as e:
            print(f"[ProxyIntercept] Failed to inject network proxy: {str(e)}")
            
        return data

proxy_handler = ProxyHandler()
