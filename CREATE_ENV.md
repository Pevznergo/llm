# ⚠️ ВАЖНО: Создайте файл .env.local

## Создайте файл `.env.local` в корне проекта со следующим содержимым:

```env
DATABASE_URL=postgresql://neondb_owner:npg_Pdsp2cZyj1zC@ep-twilight-truth-adopkfec-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_SECRET=change-this-to-random-secret-key-in-production
NEXTAUTH_URL=http://localhost:3000
```

## Команда для создания файла (Mac/Linux):

```bash
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_Pdsp2cZyj1zC@ep-twilight-truth-adopkfec-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NEXTAUTH_SECRET=change-this-to-random-secret-key-in-production
NEXTAUTH_URL=http://localhost:3000
EOF
```

## Или создайте вручную:

1. Создайте файл `.env.local` в папке `/Users/igortkachenko/Downloads/app/`
2. Скопируйте содержимое из `.env.example`
3. Сохраните файл

## После создания файла:

```bash
npm run dev
```

Сервер запустится с подключением к базе данных!
