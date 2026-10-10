import { MongoClient, type Db } from 'mongodb';
import { getEnv } from '@/config/env';

const globalDb = globalThis as typeof globalThis & { wandoraMongo?: Promise<MongoClient> };

export async function getMongo(): Promise<Db> {
  globalDb.wandoraMongo ??= new MongoClient(getEnv().MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
    .connect()
    .catch((error) => {
      globalDb.wandoraMongo = undefined;
      throw error;
    });
  return (await globalDb.wandoraMongo).db();
}

export async function closeMongo() {
  const pending = globalDb.wandoraMongo;
  globalDb.wandoraMongo = undefined;
  if (pending) await (await pending).close();
}
