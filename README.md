# LiteLLM Proxy

LiteLLM proxy deployed on `api.aporto.tech` with Google OAuth protection.

## Access
- **Admin UI**: https://api.aporto.tech/ui (Google OAuth required - pevznergo@gmail.com)
- **API**: https://api.aporto.tech
- **Health**: https://api.aporto.tech/health

## Local Development

1. Edit files locally in this directory
2. Commit changes: `git add . && git commit -m "message"`
3. Push to server: `git push server main`
4. Deploy: `./deploy.sh` (optional, auto-deployment via git hook)

## Configuration Files

- `docker-compose.yml` - Docker services (litellm, oauth2-proxy)
- `litellm_config.yaml` - LiteLLM models configuration
- `oauth2-emails.txt` - Authorized emails whitelist
- `nginx/api.aporto.tech` - Nginx reverse proxy config

## Server Setup

```bash
# SSH to server
ssh -i ~/.ssh/vast_id_ed25519 root@74.208.193.3

# Set remote
git remote add server root@74.208.193.3:/root/litellm

# Push changes
git push server main

# Restart services
cd /root/litellm && docker-compose restart
```

## Adding Models

1. Login to https://api.aporto.tech/ui
2. Navigate to Models section
3. Add your AI provider credentials
4. Configure rate limits and budgets

## Generating API Keys

1. Login to admin UI
2. Go to Keys section
3. Create new key with budget and limits
4. Use in your applications

## Deployment

Push changes and run:
```bash
./deploy.sh
```

## Client Integration

For clients to connect:
1. **API Key**: Generate in Admin UI -> "API Keys"
2. **Base URL**: `https://api.aporto.tech`

**Python Example:**
```python
import openai
client = openai.OpenAI(
    api_key="your_generated_key",
    base_url="https://api.aporto.tech"
)
response = client.chat.completions.create(
    model="gemini-1.5-pro", # Model you added
    messages=[{"role": "user", "content": "Hello!"}]
)
```

See [CLIENT_INTEGRATION.md](CLIENT_INTEGRATION.md) for full guide.
