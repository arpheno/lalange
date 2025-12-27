import { createRxDatabase, addRxPlugin, type RxDatabase, type RxCollection, type RxStorage } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { bookSchema } from './schema';

// Define types for the database
export type BookDocType = {
    id: string;
    title: string;
    author?: string;
    cover?: string;
    progress: number;
    totalWords: number;
    content: string[];
    lastRead: number;
};

export type BookCollection = RxCollection<BookDocType>;

export type MyDatabaseCollections = {
    books: BookCollection;
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
            name: 'lalange_db',
            storage,
            ignoreDuplicate: true
        });

        await db.addCollections({
            books: {
                schema: bookSchema
            }
        });

        return db;
    })();

    return dbPromise;
};
