import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const LEVELS = [
    {
        level: 1,
        minUsers: 0,
        minPro: 0,
        weeklyTextCredits: 15,
        weeklyImageGenerations: 0,
        description:
            "15 бесплатных запросов / неделю\nДоступ к базовым моделям\n7 цветов для названия клана",
    },
    {
        level: 2,
        minUsers: 2,
        minPro: 0,
        weeklyTextCredits: 30,
        weeklyImageGenerations: 0,
        description:
            "30 бесплатных запросов / неделю\nПриоритетная очередь\n7 цветовых схем для ссылок",
    },
    {
        level: 3,
        minUsers: 10,
        minPro: 1,
        weeklyTextCredits: 50,
        weeklyImageGenerations: 5,
        description:
            "50 бесплатных запросов / неделю\n5 генераций изображений\nПродвинутые модели",
    },
    {
        level: 4,
        minUsers: 0,
        minPro: 2,
        weeklyTextCredits: 75,
        weeklyImageGenerations: 5,
        description:
            "75 бесплатных запросов / неделю\n5 генераций изображений\nПродвинутые модели",
    },
    {
        level: 5,
        minUsers: 15,
        minPro: 3,
        weeklyTextCredits: 100,
        weeklyImageGenerations: 10,
        description:
            "Безлимит GPT-5 Nano/Gemini Flash\n100 запросов в неделю\n10 генераций изображений",
        unlimitedModels: ["model_gpt5nano", "model_gemini25flash"],
    },
];

async function seed() {
    if (!process.env.POSTGRES_URL) {
        throw new Error("POSTGRES_URL is not defined");
    }

    const client = new pg.Client({ connectionString: process.env.POSTGRES_URL });
    await client.connect();

    console.log("Seeding clan levels...");

    for (const lvl of LEVELS) {
        const unlimitedModelsArr = lvl.unlimitedModels || [];

        // Use ON CONFLICT to update if exists
        await client.query(
            `INSERT INTO "ClanLevel" (level, min_users, min_pro, weekly_text_credits, weekly_image_generations, description, unlimited_models, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (level) DO UPDATE
       SET min_users = $2,
           min_pro = $3,
           weekly_text_credits = $4,
           weekly_image_generations = $5,
           description = $6,
           unlimited_models = $7,
           updated_at = NOW()`,
            [
                lvl.level,
                lvl.minUsers,
                lvl.minPro,
                lvl.weeklyTextCredits,
                lvl.weeklyImageGenerations,
                lvl.description,
                unlimitedModelsArr,
                true
            ]
        );
    }

    console.log("Done!");
    await client.end();
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
