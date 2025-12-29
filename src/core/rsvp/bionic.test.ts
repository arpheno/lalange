
import { describe, it, expect } from 'vitest';
import { getBionicSplit } from './bionic';

describe('getBionicSplit', () => {
    it('should handle empty string', () => {
        expect(getBionicSplit('')).toEqual({ bold: '', light: '' });
    });

    it('should handle single character', () => {
        expect(getBionicSplit('a')).toEqual({ bold: 'a', light: '' });
    });

    it('should handle short words', () => {
        expect(getBionicSplit('the')).toEqual({ bold: 't', light: 'he' });
        expect(getBionicSplit('and')).toEqual({ bold: 'a', light: 'nd' });
    });

    it('should handle medium words', () => {
        expect(getBionicSplit('hello')).toEqual({ bold: 'he', light: 'llo' });
        expect(getBionicSplit('world')).toEqual({ bold: 'wo', light: 'rld' });
    });

    it('should handle long words', () => {
        expect(getBionicSplit('information')).toEqual({ bold: 'infor', light: 'mation' });
    });
});
