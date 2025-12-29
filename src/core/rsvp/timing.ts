
export const getPunctuationDelay = (word: string, baseInterval: number): number => {
    const lastChar = word.slice(-1);
    const lastTwoChars = word.slice(-2);

    // Strong punctuation (Sentence end)
    if (['.', '!', '?'].includes(lastChar) || ['."', '!"', '?"'].includes(lastTwoChars)) {
        return baseInterval * 1.5; // Add 1.5x extra delay (total 2.5x)
    }

    // Medium punctuation (Clause end)
    if ([';', ':'].includes(lastChar)) {
        return baseInterval * 1.0; // Add 1x extra delay (total 2x)
    }

    // Weak punctuation (Pause)
    if ([',', '—', '-'].includes(lastChar)) {
        return baseInterval * 0.5; // Add 0.5x extra delay (total 1.5x)
    }

    return 0;
};
