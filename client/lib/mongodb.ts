import { MongoClient } from 'mongodb';
import { getMongoDbName, getMongoUri } from './app-runtime';

const globalForMongo = globalThis as typeof globalThis & {
  __mirrorProgressMongoClient?: MongoClient;
  __mirrorProgressMongoPromise?: Promise<MongoClient>;
};

export async function getMongoClient() {
  if (globalForMongo.__mirrorProgressMongoClient) {
    return globalForMongo.__mirrorProgressMongoClient;
  }

  if (!globalForMongo.__mirrorProgressMongoPromise) {
    globalForMongo.__mirrorProgressMongoPromise = new MongoClient(getMongoUri()).connect();
  }

  const client = await globalForMongo.__mirrorProgressMongoPromise;
  globalForMongo.__mirrorProgressMongoClient = client;
  return client;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}
