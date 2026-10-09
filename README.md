# Wandora

Hệ thống quản lý và đề xuất địa điểm du lịch. Next.js App Router phục vụ cả frontend và API, TypeScript strict, tổ chức theo feature lấy cảm hứng từ [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md).

## Chạy local

Yêu cầu Node.js >= 20.9, npm và Docker Desktop với Linux containers.

```powershell
npm install
Copy-Item .env.example .env.local
# Sửa JWT_SECRET, NEO4J_PASSWORD và SEED_ADMIN_PASSWORD trước khi chạy.
docker compose --env-file .env.local up -d --wait
npm run db:seed
npm run dev
```

Mở http://localhost:3000 và đăng nhập bằng SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Sinh JWT_SECRET ngẫu nhiên bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Không commit `.env.local`. APP_URL phải khớp origin thực tế; production phải dùng HTTPS để cookie Secure hoạt động.

## Kiểm tra

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

Khi server và Neo4j/Redis đang chạy: `npm run test:smoke` kiểm tra auth trên database thật, tạo một user thử nghiệm (không dùng production database).

## Cấu trúc

```text
src/app/                 Next.js routes, layouts, API composition
src/features/auth/       Schemas, UI, password, sessions and login
src/features/users/      Admin user creation UI
src/lib/                 Shared HTTP, API client, database connections
src/config/              Validated server environment
src/types/               Shared public user type
scripts/                 Idempotent initial admin seed
tests/                   Auth validation and password tests
docs/                    Original report and implementation decisions
```

Routes chỉ kết nối HTTP với logic nghiệp vụ. UI không import server module. Shared code không phụ thuộc features; compose các features ở tầng app. Không tạo folder rỗng hoặc barrel file khi chưa cần.

## Auth API

| Endpoint               | Mục đích                               | Quyền                                 |
| ---------------------- | -------------------------------------- | ------------------------------------- |
| POST /api/auth/login   | Đăng nhập bằng email/password          | Public, giới hạn 10 lần/15 phút/email |
| POST /api/auth/refresh | Xoay vòng refresh token                | Refresh cookie hợp lệ                 |
| POST /api/auth/logout  | Xóa session và cookie                  | Session hiện tại                      |
| GET /api/auth/me       | Lấy user hiện tại                      | Đã đăng nhập                          |
| GET /api/users         | Danh sách user, search/sort/pagination | Admin                                 |
| POST /api/users        | Tạo user với email/name/password/role  | Admin                                 |

POST requests yêu cầu header Origin bằng APP_URL, kể cả khi gọi bằng curl hoặc Postman. Password tạo user tối thiểu 12 ký tự. Không có public signup. User được lưu trong Neo4j với constraint email/id unique, mật khẩu băm scrypt có salt. Chỉ public fields được trả về client.

Access JWT sống 1 giờ, refresh token opaque sống 7 ngày. Cookie HttpOnly, SameSite=Lax, Secure trong production. Redis chỉ lưu hash refresh token và user ID. Rotation dùng Lua compare-and-set để hai request không cùng dùng một token cũ. Mỗi rotation cấp TTL 7 ngày mới (sliding session). Logout revoke ngay session, access token của session đó không còn hợp lệ. Mỗi request protected kiểm tra Redis và đọc role hiện tại từ Neo4j.

## UI foundation

MUI + Emotion, Zustand, React Hook Form + Zod và Sonner đã được tích hợp. Trang public `/`, login `/login`, workspace `/dashboard`, admin `/admin`, bảng user `/admin/users`, tạo user `/admin/users/create`, trang mẫu `/admin/components`.

Hồ sơ `/profile` hỗ trợ sửa tên/điện thoại/giới thiệu và đổi mật khẩu. Admin có thể sửa thông tin, đổi quyền và khóa/mở khóa user. Quên mật khẩu `/forgot-password` gửi link dùng một lần, hết hạn 15 phút tới Mailpit local: mở http://localhost:8025 để đọc email. SMTP local mặc định `127.0.0.1:1025`; Mailpit chạy cùng compose. Xem [docs/account-management.md](docs/account-management.md). Chạy `npm run test:accounts` để kiểm tra các luồng này bằng tài khoản thử nghiệm.

Xem [docs/ui-foundation.md](docs/ui-foundation.md) cho API các component Table, toolbar, pagination, card, badge, form, dialog và layout. `src/lib/theme.ts` quản lý theme chung; Zustand chỉ giữ trạng thái UI, không lưu token hoặc credentials.

## Database và phạm vi

Neo4j + Redis chạy mặc định. MongoDB được chuẩn bị trong profile `travel`, Cassandra trong `analytics`:

```powershell
docker compose --env-file .env.local --profile travel --profile analytics up -d
```

Các container chỉ bind loopback; compose dành cho local development. Chưa có repository, schema hay CRUD cho MongoDB/Cassandra. Xem [docs/project-plan.md](docs/project-plan.md) để biết các giả định và việc tiếp theo. GitHub remote: https://github.com/dangduyminh109/wandora.git. Chưa push theo yêu cầu.
