import 'server-only';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { objectIdSchema } from '@/lib/mongo-id';
import { requireUser } from '@/features/auth/server/session';
import { catalogQuerySchema } from '../schemas';
import type { CatalogRepository } from './repository';

type Context = { params: Promise<{ id: string }> };

// Tạo các hàm xử lý HTTP (GET/POST/PATCH/DELETE) từ repository + schema.
export function createCatalogHandlers<T extends { name: string; placeId: string }>(config: {
  repository: CatalogRepository<T>;
  inputSchema: z.ZodType<T, unknown>;
  updateSchema: z.ZodType<Partial<T>, unknown>;
}) {
  const { repository, inputSchema, updateSchema } = config;
  return {
    list(request: Request) {
      return handleApi(async () => {
        await requireUser();
        const query = catalogQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        );
        return NextResponse.json(await repository.list(query));
      });
    },
    create(request: Request) {
      return handleApi(async () => {
        assertSameOrigin(request);
        await requireUser(true);
        const input = inputSchema.parse(await parseJson(request));
        return NextResponse.json({ item: await repository.create(input) }, { status: 201 });
      });
    },
    get(_request: Request, context: Context) {
      return handleApi(async () => {
        await requireUser();
        const id = objectIdSchema.parse((await context.params).id);
        return NextResponse.json({ item: await repository.get(id) });
      });
    },
    update(request: Request, context: Context) {
      return handleApi(async () => {
        assertSameOrigin(request);
        await requireUser(true);
        const id = objectIdSchema.parse((await context.params).id);
        const patch = updateSchema.parse(await parseJson(request));
        return NextResponse.json({ item: await repository.update(id, patch) });
      });
    },
    remove(request: Request, context: Context) {
      return handleApi(async () => {
        assertSameOrigin(request);
        await requireUser(true);
        const id = objectIdSchema.parse((await context.params).id);
        await repository.remove(id);
        return NextResponse.json({ ok: true });
      });
    },
  };
}
