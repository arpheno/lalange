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

    // If an engine exists, check if we need to switch models.
    if (engineInstance) {
        if (currentLoadedModel !== modelId) {
            console.log(`[WebLLM] Switching model from ${currentLoadedModel} to ${modelId}...`);
            setLoading(true, modelId);
            setReady(false);
            try {
                // @ts-ignore - reload options type definition might be missing in current version
                await engineInstance.reload(modelId, { initProgressCallback: onProgress });
                currentLoadedModel = modelId;
                setReady(true);
            } catch (error) {
                console.error("Failed to switch model:", error);
                throw error;
            } finally {
                setLoading(false);
            }
        }
        return engineInstance;
    }

    setLoading(true, modelId);
    setReady(false);

    try {
        // Check for Cache API support (required for WebLLM)
        if (typeof window !== 'undefined' && !('caches' in window)) {
            throw new Error("Browser Cache API is missing. This feature requires a Secure Context (HTTPS or localhost).");
        }

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
