# 🔌 Руководство по интеграции с API Aporto.tech

Это руководство поможет вам подключить ваши приложения к нашему AI-шлюзу. Мы предоставляем API, полностью совместимый с OpenAI, что позволяет использовать существующие библиотеки.

## 1. Получение доступа

1. Получите ваш **API Key** у администратора.
2. Базовый URL для всех запросов: `https://api.aporto.tech`

## 2. Примеры подключения

### 🐍 Python (используя библиотеку OpenAI)

```python
import openai

client = openai.OpenAI(
    api_key="ВАШ_API_KEY",           # Ваш ключ от Aporto.tech
    base_url="https://api.aporto.tech" # Наш прокси
)

response = client.chat.completions.create(
    model="gemini-1.5-pro", # Имя модели, добавленной в админке
    messages=[
        {"role": "user", "content": "Привет! Как дела?"}
    ]
)

print(response.choices[0].message.content)
```

### 📦 Node.js (OpenAI SDK)

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'ВАШ_API_KEY',
  baseURL: 'https://api.aporto.tech'
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Расскажи шутку' }],
    model: 'gpt-3.5-turbo', // Или любая другая доступная модель
  });

  console.log(completion.choices[0].message.content);
}

main();
```

### 🌐 cURL (прямой HTTP запрос)

```bash
curl https://api.aporto.tech/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ВАШ_API_KEY" \
  -d '{
    "model": "gemini-1.5-pro",
    "messages": [
      {
        "role": "user",
        "content": "Напиши хокку про программиста"
      }
    ]
  }'
```

## 3. Доступные модели

Список доступных моделей зависит от вашей подписки. Чтобы проверить, какие модели вам доступны:

```bash
curl https://api.aporto.tech/models \
  -H "Authorization: Bearer ВАШ_API_KEY"
```

## 4. Особенности

- **Совместимость**: Работает с любым инструментом, поддерживающим OpenAI API (LangChain, AutoGPT, etc.), просто измените `base_url`.
- **Единый счет**: Вы используете один ключ для доступа к моделям разных провайдеров (Google, OpenAI, Anthropic).
