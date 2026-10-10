import { closeMongo, getMongo } from '../src/lib/db/mongodb';

async function main() {
  const db = await getMongo();
  await db.command({ ping: 1 });
  console.log('MongoDB OK:', db.databaseName);
}
main()
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exitCode = 1;
  })
  .finally(closeMongo);
