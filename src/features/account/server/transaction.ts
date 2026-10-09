import 'server-only';
import type { ManagedTransaction } from 'neo4j-driver';
import { getNeo4j } from '@/lib/db/neo4j';
import { HttpError } from '@/lib/http';
import type { StoredUser } from '@/features/auth/server/users';

// Serialize account mutations so concurrent admin changes cannot remove every active admin.
export async function accountTransaction<T>(action: (tx: ManagedTransaction) => Promise<T>) {
  const session = getNeo4j().session();
  try {
    await session.run(
      'CREATE CONSTRAINT account_policy_unique IF NOT EXISTS FOR (p:AccountPolicy) REQUIRE p.id IS UNIQUE',
    );
    return await session.executeWrite(async (tx) => {
      await tx.run(
        "MERGE (p:AccountPolicy {id: 'accounts'}) SET p.revision = coalesce(p.revision, 0) + 1",
      );
      return action(tx);
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed'
    )
      throw new HttpError(409, 'Email đã được sử dụng.');
    throw error;
  } finally {
    await session.close();
  }
}
export async function transactionUser(tx: ManagedTransaction, id: string) {
  const result = await tx.run('MATCH (u:User {id: $id}) RETURN u', { id });
  const user = result.records[0]?.get('u').properties as StoredUser | undefined;
  if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản.');
  return user;
}
