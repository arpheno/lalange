
export interface GutenbergBook {
    id: number;
    title: string;
    authors: { name: string; birth_year: number | null; death_year: number | null }[];
    translators: { name: string; birth_year: number | null; death_year: number | null }[];
    subjects: string[];
    bookshelves: string[];
    languages: string[];
    copyright: boolean | null;
    media_type: string;
    formats: { [key: string]: string };
    download_count: number;
}

export interface GutendexResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: GutenbergBook[];
}

const BASE_URL = 'https://gutendex.com/books';

export const searchGutenberg = async (query: string): Promise<GutendexResponse> => {
    const params = new URLSearchParams({ search: query });
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Gutendex API error: ${response.statusText}`);
    }
    return response.json();
};

export const getGutenbergBook = async (id: number): Promise<GutenbergBook | null> => {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Gutendex API error: ${response.statusText}`);
    }
    return response.json();
};

export const getGutenbergBooksByIds = async (ids: number[]): Promise<GutendexResponse> => {
    const params = new URLSearchParams({ ids: ids.join(',') });
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Gutendex API error: ${response.statusText}`);
    }
    return response.json();
};
