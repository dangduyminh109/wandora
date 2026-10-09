import { randomUUID } from 'node:crypto';
import { getNeo4j } from '@/lib/db/neo4j';
import type { User } from '@/types/user';
import { hashPassword } from './password';
export type StoredUser = User & {
  passwordHash: string;
  authVersion?: string;
  resetTokenHash?: string;
  resetExpiresAt?: number;
};
export function publicUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    status: user.status ?? 'active',
    phone: user.phone ?? '',
    bio: user.bio ?? '',
  };
}
export async function findUser(field: 'email' | 'id', value: string): Promise<StoredUser | null> {
  const session = getNeo4j().session();
  try {
    const result = await session.run(`MATCH (u:User {${field}: $value}) RETURN u`, { value });
    return result.records[0]?.get('u').properties ?? null;
  } finally {
    await session.close();
  }
}
export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
}) {
  const session = getNeo4j().session();
  try {
    await session.run(
      'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
    );
    await session.run(
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
    );
    const user: StoredUser = {
      id: randomUUID(),
      email: input.email,
      name: input.name,
      role: input.role,
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(input.password),
      status: 'active',
      phone: '',
      bio: '',
      authVersion: randomUUID(),
    };
    await session.run('CREATE (u:User $user)', { user });
    return publicUser(user);
  } finally {
    await session.close();
  }
}
