
import { describe, it, expect } from 'vitest';
import { getPunctuationDelay } from './timing';

describe('getPunctuationDelay', () => {
    const base = 100;

    it('should return 0 for normal words', () => {
        expect(getPunctuationDelay('hello', base)).toBe(0);
    });

    it('should return delay for period', () => {
        expect(getPunctuationDelay('end.', base)).toBe(150);
    });

    it('should return delay for comma', () => {
        expect(getPunctuationDelay('pause,', base)).toBe(50);
    });

    it('should return delay for semicolon', () => {
        expect(getPunctuationDelay('clause;', base)).toBe(100);
    });
});
