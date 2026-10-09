# Wandora UI foundation

## Packages

MUI + Emotion: component primitives, theme, SSR cache. `AppRouterCacheProvider` uses the Next.js 16 entrypoint with CSS layers. Geist fonts stay local through `@fontsource/geist`. `src/lib/theme.ts` is the shared source for color, typography, shape and component defaults. Component styles belong in MUI `sx`; global CSS is limited to reset and skip link.

Keep universal resets inside the `reset` CSS layer, below `mui`. An unlayered universal box-sizing rule overrides MUI input sizing and can clip the text fields.

Zustand: UI state in `src/stores/ui-store.ts`, currently mobile sidebar visibility and desktop collapse. Do not put credentials, tokens, password fields or fetched server data in this store. Auth stays in HttpOnly cookies and server checks. React Hook Form manages form values; Zod schemas validate on both client and API. Sonner provides one root Toaster; call `toast.success` for completed actions, retain field errors and API errors inline.

## Routes and layouts

| Route               | Purpose                                        | Access        |
| ------------------- | ---------------------------------------------- | ------------- |
| /                   | Public welcome page                            | Public        |
| /login              | Login form                                     | Public        |
| /dashboard          | Personal workspace                             | Authenticated |
| /admin              | Admin overview                                 | Admin         |
| /admin/users        | Real Neo4j user list, search, sort, pagination | Admin         |
| /admin/users/create | Create user form                               | Admin         |
| /admin/components   | Interactive shared-component examples          | Admin         |

`(public)` and `(workspace)` route groups do not change URLs. Protected layouts perform server checks. APIs enforce authorization independently of layouts. A refresh gate renews an expired access cookie; missing or invalid refresh credentials lead to login. Admin role is checked again after refresh.

`PublicLayout`: header, navigation, main container, footer. `WorkspaceLayout`: sidebar, MUI AppBar/Toolbar header, responsive content container. `Sidebar` uses a desktop MUI Drawer that toggles between 256px and an 80px icon rail, with tooltips and accessible link names. Mobile uses a temporary MUI Drawer with an explicit close button and keyboard focus management. Desktop collapse and mobile open state are separate in Zustand. Feature components compose through the app layer; shared components do not import feature modules. Logout is composed by the app into `sidebarFooter` and `compactSidebarFooter`.

## Shared components

| Component       | Responsibility                                                              |
| --------------- | --------------------------------------------------------------------------- |
| Brand           | Shared SVG mark and wordmark                                                |
| PageHeader      | Page title, description, breadcrumbs and actions                            |
| Card            | Optional title, description, action slot and content                        |
| Badge           | Semantic status or role via MUI Chip                                        |
| EmptyState      | Empty title, explanation and optional action                                |
| ErrorState      | Inline error and optional retry                                             |
| ConfirmDialog   | Controlled confirmation, pending state and destructive variant              |
| FormTextField   | Typed RHF Controller, MUI field, field errors, select support               |
| SubmitButton    | Pending label and disabled submit                                           |
| DataTable       | Typed columns and rows, loading, empty, error, sorting and pagination       |
| TableToolbar    | Title, description, controlled search, create link/callback, custom actions |
| TableHeader     | Column headings and optional controlled sort                                |
| TablePagination | Zero-based page, page size options and accessible navigation labels         |

## Table contract

`TableColumn<T>` defines `id`, `label`, `render(row)`, optional `align`, `width`, `sortable`. DataTable requires `columns`, `rows`, stable `rowKey(row)` and an accessible `caption`. Custom actions can be rendered as another column.

The table does not fetch, filter, sort or slice rows automatically. Pass the current page's rows. `pagination.total` is the full filtered count; `page` is zero-based. Changing size resets page to zero. `sort` is controlled, and `onSortChange` informs the parent. `toolbar` is a ReactNode so features can compose filters or additional actions.

For server data, see `features/users/components/users-table.tsx`: debounced search, cancellation of obsolete requests, server-side sort and pagination. `GET /api/users` accepts `page`, `pageSize` (1–50), `search` (max 100 characters), `sortBy` (`name`, `email`, `role`, `createdAt`) and `direction` (`asc`, `desc`). The query parser whitelists interpolated sort fields, and Cypher search/pagination values are parameterized. Password hashes never appear in list responses.

For client data, see `features/showcase/components/components-showcase.tsx`: filter, sort and slice rows before rendering. Example data is labeled as illustrative. Loading skeleton, empty, error, pagination, toast and dialog states can all be tried here.

## Form contract

Use `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>` with `zodResolver(schema)` when a schema transforms or defaults values. Keep schema in the feature's `schemas.ts`. Pass `control`, typed `name`, `label` and appropriate `autoComplete` to FormTextField. `select` supports MUI MenuItem children. Server failures use `setError('root', ...)`; invalid fields stay focused by React Hook Form. The server parses the same schema again.

## Scope

The base foundation includes working auth, user listing/creation and public/admin shells. Travel CRUD, analytics and recommendations remain future features. Profile editing, password change/reset and admin user editing/lock controls are also available; see account-management.md. No public signup, fake business metrics or external push was added.
