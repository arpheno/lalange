
import { describe, it, expect } from 'vitest';
import { removeLicenseText } from './license';

describe('removeLicenseText', () => {
    it('should remove Project Gutenberg header', () => {
        const text = `
*** START OF THIS PROJECT GUTENBERG EBOOK ALICE'S ADVENTURES IN WONDERLAND ***
Alice was beginning to get very tired of sitting by her sister on the bank.
        `;
        const cleaned = removeLicenseText(text);
        expect(cleaned).not.toContain('*** START OF THIS PROJECT GUTENBERG EBOOK');
        expect(cleaned).toContain('Alice was beginning');
    });

    it('should remove Project Gutenberg footer', () => {
        const text = `
The End.
*** END OF THIS PROJECT GUTENBERG EBOOK ALICE'S ADVENTURES IN WONDERLAND ***
        `;
        const cleaned = removeLicenseText(text);
        expect(cleaned).not.toContain('*** END OF THIS PROJECT GUTENBERG EBOOK');
        expect(cleaned).toContain('The End.');
    });

    it('should remove standard ebooks disclaimer', () => {
        const text = `
This is a publication of Standard Ebooks.
Chapter 1
It was a dark and stormy night.
        `;
        const cleaned = removeLicenseText(text);
        expect(cleaned).not.toContain('This is a publication of Standard Ebooks');
        expect(cleaned).toContain('Chapter 1');
    });

    it('should handle text without license', () => {
        const text = 'Just some normal text.';
        const cleaned = removeLicenseText(text);
        expect(cleaned).toBe('Just some normal text.');
    });

    it('should remove metadata lines', () => {
        const text = `
Title: Some Book
Author: Some Author
Chapter 1
        `;
        const cleaned = removeLicenseText(text);
        expect(cleaned).not.toContain('Title: Some Book');
        expect(cleaned).not.toContain('Author: Some Author');
        expect(cleaned).toContain('Chapter 1');
    });
});
