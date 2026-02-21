import litellm
import httpx

class ProxyHandler(litellm.integrations.custom_logger.CustomLogger):
    def __init__(self):
        super().__init__()
        # Connection pooling cache: Reusing httpx clients per proxy averts recreating TLS/TCP handshakes (saves 1-3 seconds per request)
        self.client_cache = {}

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
