import { CreateMLCEngine, MLCEngine, type InitProgressCallback, hasModelInCache, deleteModelAllInfoInCache } from "@mlc-ai/web-llm";
import { useAIStore } from "../store/ai";

export const MODEL_MAPPING = {
    tiny: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    balanced: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    pro: "Llama-3-8B-Instruct-q4f16_1-MLC"
} as const;

export type ModelTier = keyof typeof MODEL_MAPPING;

let engineInstance: MLCEngine | null = null;
let currentLoadedModel: string | null = null;

export const getEngine = async (
    tier: ModelTier
): Promise<MLCEngine> => {
    // Resolve the model ID based on the requested tier
    const modelId = MODEL_MAPPING[tier];
    const { setProgress, setLoading, setReady } = useAIStore.getState();

    const onProgress: InitProgressCallback = (report) => {
        setProgress(`[${tier.toUpperCase()}] ${report.text}`, report.progress);
    };

    // If an engine exists, return it immediately.
    // We currently enforce a single-model session to avoid VRAM fragmentation.
    // If the user wants to switch models, they must reload the page (or we implement a full unload).
    if (engineInstance) {
        if (currentLoadedModel !== modelId) {
            console.warn(`[WebLLM] Requested ${modelId} but ${currentLoadedModel} is already loaded. Using loaded model.`);
        }
        return engineInstance;
    }

    setLoading(true, modelId);
    setReady(false);

    try {
        console.log(`[WebLLM] Initializing engine with model: ${modelId}`);
        engineInstance = await CreateMLCEngine(modelId, { 
            initProgressCallback: onProgress,
            logLevel: "INFO" // Enable logging to help debug
        });
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
