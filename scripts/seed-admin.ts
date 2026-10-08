import { createUserSchema } from '../src/features/auth/schemas';
import { createUser, findUser } from '../src/features/auth/server/users';
import { getNeo4j } from '../src/lib/db/neo4j';
async function main() {
  const input = createUserSchema.parse({ email: process.env.SEED_ADMIN_EMAIL, name: process.env.SEED_ADMIN_NAME, password: process.env.SEED_ADMIN_PASSWORD, role: 'admin' });
  if (input.password.startsWith('replace-')) throw new Error('Set a real SEED_ADMIN_PASSWORD');
  const existing = await findUser('email', input.email);
  if (existing) { if (existing.role !== 'admin') throw new Error('Existing account is not an admin'); console.log('Admin already exists'); return; }
  await createUser(input); console.log('Wandora admin created');
}
main().catch(() => { console.error('Seed failed. Check environment, password and Neo4j availability.'); process.exitCode = 1; }).finally(async () => { await getNeo4j().close(); });
