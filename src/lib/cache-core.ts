import { createHash } from 'node:crypto';

// Phần lõi của cache, tách khỏi Redis thật để kiểm thử được bằng client giả.
export type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
  incr(key: string): Promise<number>;
};

export type CacheResult<T> = { value: T; hit: boolean };

const VERSION_KEY = 'cache:catalog:version';

export function createCache(getClient: () => Promise<CacheClient>, onError: (e: unknown) => void) {
  // Mọi lỗi Redis đều "fail-open": bỏ qua cache và đọc thẳng từ MongoDB, không làm hỏng yêu cầu.
  async function version(client: CacheClient) {
    return (await client.get(VERSION_KEY)) ?? '0';
  }

  return {
    keyOf(namespace: string, params: unknown) {
      const hash = createHash('sha1').update(JSON.stringify(params)).digest('hex').slice(0, 20);
      return `${namespace}:${hash}`;
    },

    async cached<T>(
      key: string,
      ttlSeconds: number,
      loader: () => Promise<T>,
    ): Promise<CacheResult<T>> {
      let client: CacheClient;
      let fullKey: string;
      try {
        client = await getClient();
        // Phiên bản nằm trong khóa: khi dữ liệu đổi, tăng phiên bản là mọi khóa cũ tự vô hiệu.
        fullKey = `cache:v${await version(client)}:${key}`;
        const raw = await client.get(fullKey);
        if (raw !== null) return { value: JSON.parse(raw) as T, hit: true };
      } catch (error) {
        onError(error);
        return { value: await loader(), hit: false };
      }
      const value = await loader();
      try {
        await client.set(fullKey, JSON.stringify(value), { EX: ttlSeconds });
      } catch (error) {
        onError(error);
      }
      return { value, hit: false };
    },

    // Gọi sau mỗi lần ghi (thêm/sửa/xóa) vào MongoDB.
    async invalidate() {
      try {
        await (await getClient()).incr(VERSION_KEY);
      } catch (error) {
        onError(error);
      }
    },
  };
}
