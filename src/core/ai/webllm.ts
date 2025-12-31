import { CreateMLCEngine, MLCEngine, type InitProgressCallback, hasModelInCache, deleteModelAllInfoInCache } from "@mlc-ai/web-llm";
import { useAIStore } from "../store/ai";

export const MODEL_MAPPING = {
    tiny: "Llama-3-8B-Instruct-q4f16_1-MLC",
    balanced: "Llama-3-8B-Instruct-q4f16_1-MLC",
    pro: "Llama-3-8B-Instruct-q4f16_1-MLC"
} as const;

export type ModelTier = keyof typeof MODEL_MAPPING;

let engineInstance: MLCEngine | null = null;
let currentLoadedModel: string | null = null;

export const getEngine = async (
    tier: ModelTier
): Promise<MLCEngine> => {
    // FORCE SINGLE MODEL ARCHITECTURE
    // We strictly enforce using only one model ID and never reloading/switching.
    const modelId = "Llama-3-8B-Instruct-q4f16_1-MLC";
    const { setProgress, setLoading, setReady } = useAIStore.getState();

    const onProgress: InitProgressCallback = (report) => {
        setProgress(`[SINGLE-MODEL] (${modelId}) ${report.text}`, report.progress);
    };

    // If an engine exists, return it immediately.
    // We DO NOT check if the modelId matches, because we refuse to switch models.
    if (engineInstance) {
        return engineInstance;
    }

    setLoading(true, "Llama-3-8B");
    setReady(false);

    try {
        // Always create, never reload since we only do this once.
        engineInstance = await CreateMLCEngine(modelId, { initProgressCallback: onProgress });
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
): Promise<{ response: string, usage?: any }> => {
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
