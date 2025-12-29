
export const removeLicenseText = (text: string): string => {
    let cleaned = text;

    // Common Project Gutenberg headers/footers
    const patterns = [
        /^\s*The Project Gutenberg EBook of.*$/gim,
        /^\s*This eBook is for the use of anyone anywhere.*$/gim,
        /^\s*Copyright laws are changing all over the world.*$/gim,
        /^\s*Be sure to check the copyright laws for your country.*$/gim,
        /^\s*Title:.*$/gim,
        /^\s*Author:.*$/gim,
        /^\s*Release Date:.*$/gim,
        /^\s*Language:.*$/gim,
        /^\s*\*\*\* START OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*$/gim,
        /^\s*\*\*\* END OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*$/gim,
        /^\s*Produced by.*$/gim,
        /^\s*End of the Project Gutenberg EBook.*$/gim,
        // Standard Ebooks
        /^\s*This is a publication of Standard Ebooks.*$/gim,
        /^\s*The Standard Ebooks project is a volunteer effort.*$/gim,
    ];

    // Remove specific blocks
    // Project Gutenberg Header
    const pgHeaderStart = /\*\*\* START OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i;
    const pgHeaderEnd = /\*\*\* END OF THIS PROJECT GUTENBERG EBOOK .* \*\*\*/i;

    // Sometimes the header is at the beginning, sometimes there is metadata before it.
    // We can try to find the start marker and remove everything before it.
    const startMatch = cleaned.match(pgHeaderStart);
    if (startMatch && startMatch.index !== undefined) {
        // Check if it's reasonably close to the start (e.g. within first 5000 chars)
        // If it is, we assume everything before it is license/metadata
        if (startMatch.index < 10000) {
            cleaned = cleaned.substring(startMatch.index + startMatch[0].length);
        }
    }

    // Remove footer
    const endMatch = cleaned.match(pgHeaderEnd);
    if (endMatch && endMatch.index !== undefined) {
        cleaned = cleaned.substring(0, endMatch.index);
    }

    // Remove single line patterns
    patterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Remove multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
};
