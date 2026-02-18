
export interface ModelMetadata {
    description?: string;
    contextLength?: string;
    inputPrice?: string; // per 1M tokens
    outputPrice?: string; // per 1M tokens
    provider?: string;
    displayName?: string;
}

export const modelMetadata: Record<string, ModelMetadata> = {
    // Anthropic
    "claude-3-5-sonnet-20240620": {
        displayName: "Anthropic: Claude 3.5 Sonnet",
        provider: "Anthropic",
        description: "Anthropic's most intelligent model yet. It excels at complex tasks like coding, creative writing, and analysis, while being faster and cheaper than Opus.",
        contextLength: "200K",
        inputPrice: "$3.00",
        outputPrice: "$15.00"
    },
    "claude-3-opus-20240229": {
        displayName: "Anthropic: Claude 3 Opus",
        provider: "Anthropic",
        description: "Anthropic's most powerful model, capable of complex reasoning and analysis. Ideal for tasks requiring high intelligence.",
        contextLength: "200K",
        inputPrice: "$15.00",
        outputPrice: "$75.00"
    },
    "claude-3-sonnet-20240229": {
        displayName: "Anthropic: Claude 3 Sonnet",
        provider: "Anthropic",
        description: "Balanced model for enterprise workloads. Good combination of performance and speed.",
        contextLength: "200K",
        inputPrice: "$3.00",
        outputPrice: "$15.00"
    },
    "claude-3-haiku-20240307": {
        displayName: "Anthropic: Claude 3 Haiku",
        provider: "Anthropic",
        description: "Fastest and most compact model for near-instant responsiveness.",
        contextLength: "200K",
        inputPrice: "$0.25",
        outputPrice: "$1.25"
    },

    // OpenAI
    "gpt-4o": {
        displayName: "OpenAI: GPT-4o",
        provider: "OpenAI",
        description: "OpenAI's flagship model that's faster and cheaper than GPT-4 Turbo. Multimodal capabilities.",
        contextLength: "128K",
        inputPrice: "$5.00",
        outputPrice: "$15.00"
    },
    "gpt-4-turbo": {
        displayName: "OpenAI: GPT-4 Turbo",
        provider: "OpenAI",
        description: "High-intelligence model with a large context window.",
        contextLength: "128K",
        inputPrice: "$10.00",
        outputPrice: "$30.00"
    },
    "gpt-3.5-turbo": {
        displayName: "OpenAI: GPT-3.5 Turbo",
        provider: "OpenAI",
        description: "Fast, inexpensive model for simple tasks.",
        contextLength: "16K",
        inputPrice: "$0.50",
        outputPrice: "$1.50"
    },

    // Google
    "gemini-1.5-pro": {
        displayName: "Google: Gemini 1.5 Pro",
        provider: "Google",
        description: "Google's mid-size multimodal model, optimized for scaling across a wide range of tasks.",
        contextLength: "1M+",
        inputPrice: "$3.50",
        outputPrice: "$10.50"
    },
    "gemini-1.5-flash": {
        displayName: "Google: Gemini 1.5 Flash",
        provider: "Google",
        description: "Fast and efficient multimodal model for high-frequency tasks.",
        contextLength: "1M+",
        inputPrice: "$0.35",
        outputPrice: "$1.05"
    },

    // Meta / Others (Generic fallback logic can handle others)
};

export function getModelMetadata(modelId: string): ModelMetadata {
    // 1. Direct match
    if (modelMetadata[modelId]) return modelMetadata[modelId];

    // 2. Fuzzy / Partial match logic
    // e.g. remove dates
    const cleanId = modelId.split("-").slice(0, 3).join("-"); // rough

    // Default fallback
    const provider = modelId.includes("gpt") ? "OpenAI" :
        modelId.includes("claude") ? "Anthropic" :
            modelId.includes("gemini") ? "Google" :
                modelId.includes("mistral") ? "Mistral" :
                    "Unknown";

    return {
        description: "This model is available via the LiteLLM proxy.",
        contextLength: "Unknown",
        inputPrice: "$?",
        outputPrice: "$?",
        provider: provider,
        displayName: modelId
    };
}
