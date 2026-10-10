import { serviceHandlers as handlers } from '@/features/catalog/server/registry';

export const GET = handlers.get;
export const PATCH = handlers.update;
export const DELETE = handlers.remove;
