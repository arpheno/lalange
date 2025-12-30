export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export const checkOllamaHealth = async (): Promise<boolean> => {
    try {
        const res = await fetch('http://localhost:11434/api/tags');
        return res.ok;
    } catch (e) {
        return false;
    }
};

export const generateCompletion = async (prompt: string, model: string = 'llama3.1'): Promise<{ response: string, metrics?: OllamaResponse }> => {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.1
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json() as OllamaResponse;
        return { response: data.response, metrics: data };
    } catch (e) {
        console.error('Ollama generation failed:', e);
        throw e;
    }
};
