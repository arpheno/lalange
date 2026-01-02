import { CreateMLCEngine, MLCEngine, type InitProgressCallback, hasModelInCache, deleteModelAllInfoInCache } from "@mlc-ai/web-llm";
import { useAIStore } from "../store/ai";

export const MODEL_MAPPING = {
    tiny: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    balanced: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    pro: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC"
} as const;

export type ModelTier = keyof typeof MODEL_MAPPING;

let engineInstance: MLCEngine | null = null;
let currentLoadedModel: string | null = null;

export const getEngine = async (
    tier: ModelTier
): Promise<MLCEngine> => {
    const modelId = MODEL_MAPPING[tier];
    const { setProgress, setLoading, setReady } = useAIStore.getState();

    const onProgress: InitProgressCallback = (report) => {
        setProgress(`[${tier.toUpperCase()}] (${modelId}) ${report.text}`, report.progress);
    };

    if (engineInstance && currentLoadedModel === modelId) {
        return engineInstance;
    }

    setLoading(true, tier); // Pass tier as the loading model name
    setReady(false);

    try {
        if (!engineInstance) {
            engineInstance = await CreateMLCEngine(modelId, { initProgressCallback: onProgress });
        } else {
            await engineInstance.reload(modelId);
        }
        currentLoadedModel = modelId;
        setReady(true);
        return engineInstance;
    } catch (error) {
        console.error("Failed to load WebLLM engine:", error);
        throw error;
    } finally {
        setLoading(false);
    }
};

export const generateWebLLMCompletion = async (
    prompt: string,
    tier: ModelTier
): Promise<{ response: string, usage?: Record<string, unknown> }> => {
    const engine = await getEngine(tier);
    const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
    });
    return {
        response: reply.choices[0].message.content || "",
        usage: reply.usage
    };
};

export const isModelCached = async (tier: ModelTier): Promise<boolean> => {
    const modelId = MODEL_MAPPING[tier];
    return await hasModelInCache(modelId);
};

export const deleteModel = async (tier: ModelTier): Promise<void> => {
    const modelId = MODEL_MAPPING[tier];
    await deleteModelAllInfoInCache(modelId);
};
