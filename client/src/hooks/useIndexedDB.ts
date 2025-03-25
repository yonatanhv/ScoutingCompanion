import { useState, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface UseIndexedDBOptions<T> {
  dbName: string;
  storeName: string;
  version?: number;
  keyPath?: string;
  indexes?: Array<{ name: string; keyPath: string; options?: IDBIndexParameters }>;
}

export function useIndexedDB<T>({
  dbName,
  storeName,
  version = 1,
  keyPath = 'id',
  indexes = [],
}: UseIndexedDBOptions<T>) {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize database connection
  useEffect(() => {
    const initDB = async () => {
      try {
        setIsLoading(true);
        const database = await openDB(dbName, version, {
          upgrade(db) {
            // Create the object store if it doesn't exist
            if (!db.objectStoreNames.contains(storeName)) {
              const store = db.createObjectStore(storeName, { keyPath, autoIncrement: true });
              
              // Create indexes
              indexes.forEach(({ name, keyPath, options }) => {
                store.createIndex(name, keyPath, options);
              });
            }
          },
        });
        
        setDb(database);
        setError(null);
      } catch (err) {
        console.error('Error initializing IndexedDB:', err);
        setError(err instanceof Error ? err : new Error('Unknown error initializing IndexedDB'));
      } finally {
        setIsLoading(false);
      }
    };

    initDB();

    // Close the database connection when component unmounts
    return () => {
      if (db) {
        db.close();
      }
    };
  }, [dbName, version, storeName, keyPath, indexes]);

  // Add item to the store
  const add = useCallback(
    async (item: T): Promise<IDBValidKey> => {
      if (!db) throw new Error('Database not initialized');
      return db.add(storeName, item);
    },
    [db, storeName],
  );

  // Get all items from the store
  const getAll = useCallback(async (): Promise<T[]> => {
    if (!db) throw new Error('Database not initialized');
    return db.getAll(storeName);
  }, [db, storeName]);

  // Get item by key
  const getByKey = useCallback(
    async (key: IDBValidKey): Promise<T | undefined> => {
      if (!db) throw new Error('Database not initialized');
      return db.get(storeName, key);
    },
    [db, storeName],
  );

  // Get items by index
  const getByIndex = useCallback(
    async (indexName: string, key: IDBValidKey): Promise<T[]> => {
      if (!db) throw new Error('Database not initialized');
      return db.getAllFromIndex(storeName, indexName, key);
    },
    [db, storeName],
  );

  // Update item
  const update = useCallback(
    async (item: T): Promise<IDBValidKey> => {
      if (!db) throw new Error('Database not initialized');
      return db.put(storeName, item);
    },
    [db, storeName],
  );

  // Delete item by key
  const remove = useCallback(
    async (key: IDBValidKey): Promise<void> => {
      if (!db) throw new Error('Database not initialized');
      return db.delete(storeName, key);
    },
    [db, storeName],
  );

  // Clear all items from the store
  const clear = useCallback(async (): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    return db.clear(storeName);
  }, [db, storeName]);

  return {
    db,
    isLoading,
    error,
    add,
    getAll,
    getByKey,
    getByIndex,
    update,
    remove,
    clear,
  };
}
