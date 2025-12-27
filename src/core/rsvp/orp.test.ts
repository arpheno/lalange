import { describe, it, expect } from 'vitest';
import { calculateORP } from './orp';

describe('calculateORP', () => {
    it('should return 0 for words with length <= 1', () => {
        expect(calculateORP('')).toBe(0);
        expect(calculateORP('a')).toBe(0);
    });

    it('should return 1 for words with length 2-5', () => {
        expect(calculateORP('it')).toBe(1);
        expect(calculateORP('the')).toBe(1);
        expect(calculateORP('test')).toBe(1);
        expect(calculateORP('hello')).toBe(1);
    });

    it('should return 2 for words with length 6-9', () => {
        expect(calculateORP('reader')).toBe(2);
        expect(calculateORP('testing')).toBe(2);
        expect(calculateORP('software')).toBe(2);
        expect(calculateORP('developer')).toBe(2);
    });

    it('should return 3 for words with length 10-13', () => {
        expect(calculateORP('javascript')).toBe(3);
        expect(calculateORP('programming')).toBe(3);
        expect(calculateORP('development')).toBe(3);
    });

    it('should return 4 for words with length >= 14', () => {
        expect(calculateORP('internationalization')).toBe(4);
        expect(calculateORP('telecommunications')).toBe(4);
    });
});
