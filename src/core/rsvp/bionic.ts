
export const getBionicSplit = (word: string): { bold: string, light: string } => {
    if (word.length === 0) return { bold: '', light: '' };
    if (word.length === 1) return { bold: word, light: '' };

    // Bold roughly the first half, favoring slightly less for longer words to avoid overwhelming
    let boldLength = 1;
    if (word.length <= 3) boldLength = 1;
    else if (word.length <= 5) boldLength = 2;
    else if (word.length <= 9) boldLength = 3;
    else boldLength = Math.ceil(word.length * 0.4);

    return {
        bold: word.slice(0, boldLength),
        light: word.slice(boldLength)
    };
};
