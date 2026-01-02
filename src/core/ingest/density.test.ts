import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeDensityRange } from './pipeline';
import { generateUnifiedCompletion } from '../ai/service';

// Mock dependencies
vi.mock('../ai/service', () => ({
    checkAIHealth: vi.fn().mockResolvedValue(true),
    generateUnifiedCompletion: vi.fn(),
}));

describe('analyzeDensityRange', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return default densities if LLM fails', async () => {
        vi.mocked(generateUnifiedCompletion).mockRejectedValue(new Error('LLM Error'));
        const words = ['hello', 'world'];
        const densities = await analyzeDensityRange(words);
        // Default score is 5 -> factor 1.0
        expect(densities).toEqual([1.0, 1.0]);
    });

    it('should parse valid JSON from LLM and calculate density factors', async () => {
        // "hello world" -> score 10 -> factor 1.5
        // "simple text" -> score 1 -> factor 0.6
        const mockResponse = {
            response: JSON.stringify({
                "hello world": 10,
                "simple text": 1
            })
        };
        vi.mocked(generateUnifiedCompletion).mockResolvedValue(mockResponse);

        const words = ['hello', 'world', '.', 'simple', 'text', '.'];
        const densities = await analyzeDensityRange(words);

        expect(densities.length).toBe(6);
        expect(densities[0]).toBeCloseTo(1.5, 1); // hello
        expect(densities[1]).toBeCloseTo(1.5, 1); // world

        expect(densities[3]).toBeCloseTo(0.6, 1); // simple
        expect(densities[4]).toBeCloseTo(0.6, 1); // text
    });

    it('should handle partial matches', async () => {
        // Only one sentence matched
        const mockResponse = {
            response: JSON.stringify({
                "hello world": 10
            })
        };
        vi.mocked(generateUnifiedCompletion).mockResolvedValue(mockResponse);

        const words = ['hello', 'world', '.', 'unknown', 'part', '.'];
        const densities = await analyzeDensityRange(words);

        // First sentence: 1.5
        expect(densities[0]).toBeCloseTo(1.5, 1);

        // Second sentence: Default 1.0
        expect(densities[3]).toBeCloseTo(1.0, 1);
    });

    it('should match text with punctuation to clean keys from LLM', async () => {
        // Source: "Hello, world!"
        // LLM Output: "Hello world": 10 (Clean key)
        const mockResponse = {
            response: JSON.stringify({
                "Hello world": 10
            })
        };
        vi.mocked(generateUnifiedCompletion).mockResolvedValue(mockResponse);

        const words = ['Hello,', 'world!'];
        const densities = await analyzeDensityRange(words);

        // Should match and apply score 10 -> 1.5
        // Plus structural multiplier for comma (1.5) -> 1.5 * 1.5 = 2.25
        expect(densities[0]).toBeCloseTo(2.25, 1);
    });

    it('should match text even if LLM returns dirty keys (robustness)', async () => {
        // Source: "Hello, world!"
        // LLM Output: "Hello, world!": 10 (Dirty key, ignored instruction)
        const mockResponse = {
            response: JSON.stringify({
                "Hello, world!": 10
            })
        };
        vi.mocked(generateUnifiedCompletion).mockResolvedValue(mockResponse);

        const words = ['Hello,', 'world!'];
        const densities = await analyzeDensityRange(words);

        // Should still match because we normalize keys
        // Plus structural multiplier for comma (1.5) -> 1.5 * 1.5 = 2.25
        expect(densities[0]).toBeCloseTo(2.25, 1);
    });

    it('should extract JSON from conversational LLM response', async () => {
        const mockResponse = {
            response: `
Here is the analysis you requested:

\`\`\`json
{
  "Simple sentence": 1
}
\`\`\`

I hope this helps!
        `
        };
        vi.mocked(generateUnifiedCompletion).mockResolvedValue(mockResponse);

        const words = ['Simple', 'sentence', '.'];
        const densities = await analyzeDensityRange(words);

        // Score 1 -> 0.6
        expect(densities[0]).toBeCloseTo(0.6, 1);
    });

    it('should fix smart quotes in JSON', async () => {
        // LLM returns smart quotes “ ” instead of " "
        const mockResponse = {
            response: `{
            “Smart quotes”: 10
        }`
        };
        vi.mocked(generateUnifiedCompletion).mockResolvedValue(mockResponse);

        const words = ['Smart', 'quotes', '.'];
        const densities = await analyzeDensityRange(words);

        // Score 10 -> 1.5
        expect(densities[0]).toBeCloseTo(1.5, 1);
    });

    it('should handle truncated JSON response by appending closing brace', async () => {
        // Simulate a truncated response (missing closing brace)
        const truncatedResponse = {
            response: `{
            "The quick brown fox": 5,
            "Jumps over the lazy dog": 2`
        };

        vi.mocked(generateUnifiedCompletion).mockResolvedValue(truncatedResponse);

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
        const truncatedResponse = {
            response: `{
            "The quick brown fox": 5,
            "Jumps over the lazy dog": 2,`
        };

        vi.mocked(generateUnifiedCompletion).mockResolvedValue(truncatedResponse);

        const words = ["The", "quick", "brown", "fox.", "Jumps", "over", "the", "lazy", "dog."];
        const densities = await analyzeDensityRange(words);

        const hasLowDensity = densities.some(d => d < 0.9);
        expect(hasLowDensity).toBe(true);
    });

    it('should tolerate invalid JSON with unescaped quotes inside keys', async () => {
        // This is NOT valid JSON because the key contains an unescaped quote.
        // We still want to recover scores from it.
        const invalidJsonish = {
            response: `{
  "" he thought": 1,
  "It wasn’t a dream": 2
}`
        };

        vi.mocked(generateUnifiedCompletion).mockResolvedValue(invalidJsonish);

        const words = ['""', 'he', 'thought.', 'It', 'wasn’t', 'a', 'dream.'];
        const densities = await analyzeDensityRange(words);

        // If parsing failed completely we'd fall back to default (score=5 => 1.0).
        // Score 1 implies densityFactor 0.6 (some values should be noticeably lower than 1.0).
        const hasVeryLow = densities.some(d => d < 0.9);
        expect(hasVeryLow).toBe(true);
    });

    it('should assign 0 density for junk/structural elements', async () => {
        const mockResponse = {
            response: JSON.stringify({
                "Page 12": 0,
                "Chapter 5": 0
            })
        };
        vi.mocked(generateUnifiedCompletion).mockResolvedValue(mockResponse);

        const words = ['Page', '12', '.', 'Chapter', '5', '.'];
        const densities = await analyzeDensityRange(words);

        expect(densities.length).toBe(6);
        expect(densities[0]).toBe(0); // Page
        expect(densities[1]).toBe(0); // 12
        expect(densities[3]).toBe(0); // Chapter
        expect(densities[4]).toBe(0); // 5
    });
});

