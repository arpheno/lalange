import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeDensityRange } from './pipeline';
import * as ollama from '../ai/ollama';

vi.mock('../ai/ollama', () => ({
    generateCompletion: vi.fn(),
    checkOllamaHealth: vi.fn().mockResolvedValue(true)
}));

describe('Pipeline Parsing Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle truncated JSON response by appending closing brace', async () => {
        // Simulate a truncated response (missing closing brace)
        const truncatedResponse = `{
            "The quick brown fox": 5,
            "Jumps over the lazy dog": 2`;

        vi.mocked(ollama.generateCompletion).mockResolvedValue(truncatedResponse);

        const words = ["The", "quick", "brown", "fox.", "Jumps", "over", "the", "lazy", "dog."];
        const densities = await analyzeDensityRange(words);

        // Verification logic:
        // Sentence 1: "The quick brown fox." -> Score 5 -> Factor 1.0
        // Sentence 2: "Jumps over the lazy dog." -> Score 2 -> Factor 0.7

        // If parsing failed, everything would be default score 5 -> Factor 1.0.
        // So we check if we have values around 0.7.

        const hasLowDensity = densities.some(d => d < 0.9);
        expect(hasLowDensity).toBe(true);
    });

    it('should handle truncated JSON response with trailing comma', async () => {
        // Simulate a truncated response with trailing comma
        const truncatedResponse = `{
            "The quick brown fox": 5,
            "Jumps over the lazy dog": 2,`;

        vi.mocked(ollama.generateCompletion).mockResolvedValue(truncatedResponse);

        const words = ["The", "quick", "brown", "fox.", "Jumps", "over", "the", "lazy", "dog."];
        const densities = await analyzeDensityRange(words);

        const hasLowDensity = densities.some(d => d < 0.9);
        expect(hasLowDensity).toBe(true);
    });

    it('should handle valid JSON correctly', async () => {
        const validResponse = `{
            "The quick brown fox": 5,
            "Jumps over the lazy dog": 2
        }`;

        vi.mocked(ollama.generateCompletion).mockResolvedValue(validResponse);

        const words = ["The", "quick", "brown", "fox.", "Jumps", "over", "the", "lazy", "dog."];
        const densities = await analyzeDensityRange(words);

        const hasLowDensity = densities.some(d => d < 0.9);
        expect(hasLowDensity).toBe(true);
    });
});
