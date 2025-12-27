import { createRxDatabase, addRxPlugin, type RxDatabase, type RxCollection, type RxStorage } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { bookSchema, chapterSchema, readingStateSchema } from './schema';

// Define types for the database
export type BookDocType = {
    id: string;
    title: string;
    author?: string;
    cover?: string;
    totalWords: number;
    chapterIds: string[];
};

export type ChapterDocType = {
    id: string;
    bookId: string;
    index: number;
    title: string;
    content: string[];
};

export type HighlightType = {
    id: string;
    chapterId: string;
    startWordIndex: number;
    endWordIndex: number;
    text: string;
    note?: string;
    createdAt: number;
};

export type ReadingStateDocType = {
    bookId: string;
    currentChapterId?: string;
    currentWordIndex: number;
    lastRead: number;
    highlights: HighlightType[];
};

export type BookCollection = RxCollection<BookDocType>;
export type ChapterCollection = RxCollection<ChapterDocType>;
export type ReadingStateCollection = RxCollection<ReadingStateDocType>;

export type MyDatabaseCollections = {
    books: BookCollection;
    chapters: ChapterCollection;
    reading_states: ReadingStateCollection;
};

export type MyDatabase = RxDatabase<MyDatabaseCollections>;

let dbPromise: Promise<MyDatabase> | null = null;

export const initDB = async (): Promise<MyDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = (async () => {
        let storage: RxStorage<any, any> = getRxStorageDexie();
        if (import.meta.env.DEV) {
            const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
            addRxPlugin(RxDBDevModePlugin);

            const { wrappedValidateAjvStorage } = await import('rxdb/plugins/validate-ajv');
            storage = wrappedValidateAjvStorage({
                storage
            });
        }

        const db = await createRxDatabase<MyDatabaseCollections>({
            name: 'lalange_db_v2', // Bumped version/name to force fresh DB
            storage,
            ignoreDuplicate: true
        });

        await db.addCollections({
            books: {
                schema: bookSchema
            },
            chapters: {
                schema: chapterSchema
            },
            reading_states: {
                schema: readingStateSchema
            }
        });

        return db;
    })();

    return dbPromise;
};
