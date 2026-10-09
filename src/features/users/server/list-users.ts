import 'server-only';
import { int } from 'neo4j-driver';
import type { z } from 'zod';
import { getNeo4j } from '@/lib/db/neo4j';
import type { User } from '@/types/user';
import { usersQuerySchema } from '../schemas';
export async function listUsers(input: z.output<typeof usersQuerySchema>) {
  const query = usersQuerySchema.parse(input);
  const session = getNeo4j().session();
  const parameters = {
    search: query.search.toLowerCase(),
    offset: int(query.page * query.pageSize),
    limit: int(query.pageSize),
  };
  const filter =
    'MATCH (u:User) WHERE toLower(u.name) CONTAINS $search OR toLower(u.email) CONTAINS $search';
  try {
    return await session.executeRead(async (transaction) => {
      const count = await transaction.run(`${filter} RETURN count(u) AS total`, parameters);
      const rows = await transaction.run(
        `${filter} RETURN u { .id, .name, .email, .role, .createdAt, status: coalesce(u.status, 'active'), phone: coalesce(u.phone, ''), bio: coalesce(u.bio, '') } AS user ORDER BY u.${query.sortBy} ${query.direction === 'asc' ? 'ASC' : 'DESC'}, u.id ASC SKIP $offset LIMIT $limit`,
        parameters,
      );
      return {
        users: rows.records.map((record) => record.get('user') as User),
        total: count.records[0].get('total').toNumber() as number,
      };
    });
  } finally {
    await session.close();
  }
}
