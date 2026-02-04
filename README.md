# NSUK Mail Portal

A Next.js App Router portal for **National Science University of Kyrgyzstan (NSUK)** to activate, manage, and renew official education mailboxes.

## Stack
- Next.js (App Router) + TypeScript
- TailwindCSS + shadcn/ui primitives
- Supabase Postgres (service role for all sensitive actions)
- JWT cookie sessions

## Environment
Copy `.env.example` to `.env.local` and fill values:

```
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Session / Admin (required)
SESSION_SECRET=
APP_BASE_URL=http://localhost:3000
ADMIN_EMAIL=admin@nsuk.edu.kg
ADMIN_PASSWORD_HASH=

# Rate limit (required)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Mailcow (required for email operations & health check)
MAILCOW_API_BASE_URL=
MAILCOW_API_KEY=

# Cron (required for expiry job)
CRON_SECRET=

# Cron schedule example (VPS)
# */5 * * * * curl -sS -X POST https://portal.nsuk.edu.kg/api/cron/expire \\
#   -H "Authorization: Bearer $CRON_SECRET"
```

  > `SUPABASE_SERVICE_ROLE_KEY` must only exist on the server. **Never expose it to the browser**.
  > Password recovery emails are sent by Supabase Auth; configure email provider/templates in Supabase if needed.
  > `APP_BASE_URL` must match your Vercel domain (e.g. https://portal.nsuk.edu.kg) for recovery redirects to work.

## Database setup (Supabase)
1. Create a Supabase project and open SQL editor.
2. Run `supabase/schema.sql`.
3. Run `supabase/rls.sql`.
4. Run `supabase/seed.sql` to create 3 unused activation codes.

### Admin password hash
Generate bcrypt hash:

```
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('YOUR_PASSWORD',10).then(console.log);"
```

Set output to `ADMIN_PASSWORD_HASH`.

## Development

```
pnpm install
pnpm dev
```

## End-to-end self-check (with Supabase configured)
1. Use `seed.sql` codes to redeem on `/redeem`.
2. Confirm activation code becomes `used` and a new `profiles` + `edu_accounts` row is created.
3. Login with personal email on `/login`, reach `/dashboard`.
4. Login with edu email on `/login` (mode: education), allowed only if `expires_at` is in the future.
5. Change password in `/dashboard` and verify personal/edu login use the new password.
6. Use `/forgot` to request a reset; Supabase Auth sends the recovery email.
7. Use `/reset` via the Supabase recovery link to set a new password and verify login works.
8. Redeem another activation code on `/dashboard` renewal and check `expires_at` +1 year.
9. Suspend a user from `/admin/users` and confirm login is blocked.
10. Admin login via `/admin/login` using `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`.
11. Use `/admin/codes` to generate codes, export CSV, revoke unused codes.
12. Review `/admin/audit` for recorded actions.

## 上线后 10 分钟自检清单（无需本地）
1) 打开 `/api/health`，确认 `ok: true`。
2) 在 Supabase SQL Editor 执行 `supabase/schema.sql` 与 `supabase/seed.sql`。
3) 访问 `/admin/login` 登录管理员。
4) 在 `/admin/codes` 生成 3 个激活码，并点击导出 CSV。
5) 打开 `/redeem` 使用激活码兑换（个人邮箱 + edu 用户名 + 密码）。
6) 登录 `/dashboard`，确认 edu_email 与 expires_at 正常显示。
7) 在 `/dashboard` 输入激活码续费，确认 expires_at +1 year。
8) 用“教育邮箱模式登录”验证过期逻辑（过期禁止登录）。
9) 在 `/dashboard` 修改密码，确认 personal/edu 都能用新密码登录。
10) 点击 Webmail 按钮跳转到 https://mail.nsuk.edu.kg/。

## Notes
- Portal is the management layer (activation, renewal, console). Webmail is external: `https://mail.nsuk.edu.kg/`.
- Webmail service is hosted on VPS `173.254.220.67` (Mailcow/SOGo), and is not implemented in this repo.
- All sensitive operations happen in server routes using the Supabase Service Role key.
- The project uses `?lang=zh` or `?lang=en` to switch language and stores it in a cookie.
- Password recovery emails are sent by Supabase Auth; configure email provider/templates in Supabase if needed.

## Supabase Auth 必配项（小白版）
为避免忘记密码/重置密码失败，请在 Supabase 控制台完成以下配置：

1) **Authentication → URL Configuration**
   - **Site URL** = `APP_BASE_URL`（例如 `https://portal.nsuk.edu.kg`）
   - **Redirect URLs** 必须包含：
     - `APP_BASE_URL/reset`
     - `APP_BASE_URL/login`
     - `APP_BASE_URL/dashboard`

2) **Authentication → Email Templates（可选）**
   - 默认模板即可；需要更好体验再自定义。

3) **邮件不发送怎么办**
   - 需要在 Supabase 的 Email provider 中配置邮件服务。
   - 若未配置 provider，重置邮件可能无法送达。

## GitHub Actions 依赖安装 403 如何处理（无需本地操作）
当 GitHub Actions 日志出现 `pnpm install failed: 403` 时，通常是因为 registry 被指向了私有源，但没有 token 导致拒绝访问。CI 已经在 workflow 中强制切回公共 npm registry，并提供可选 token 注入。

### 在 GitHub 网页添加 Secrets（无需本地）
1. 进入你的 GitHub 仓库页面。
2. 点击 **Settings → Secrets and variables → Actions**。
3. 点击 **New repository secret**，按需添加以下任一项：

#### NPM_TOKEN
用于 npmjs 私有包访问（如你发布/依赖私有 npm 包）。

#### GH_PACKAGES_TOKEN
用于 GitHub Packages 私有包访问（例如 `npm.pkg.github.com`）。

#### PRIVATE_REGISTRY_TOKEN
用于公司私有 registry（若你们有自建 registry）。

> 如果你不需要私有包，可以不配置任何 token。

### 仍然失败怎么办
请把 GitHub Actions 日志里的 **Debug registry** 输出贴出来，便于进一步定位（其中 token 会自动打码）。

## CI 自愈策略与私有依赖说明
本仓库的 CI 已内置“自愈”策略，确保公共依赖能稳定安装与构建：

- **强制公共 npm registry**：CI 会忽略仓库根目录 `.npmrc`（自动重命名为 `.npmrc.ci-backup`），并把 registry 指向 `https://registry.npmjs.org/`，避免误用私有源导致 403。
- **可选私有 token 注入**：如果你未来需要私有依赖，可在 GitHub Secrets 中添加 `NPM_TOKEN`、`GH_PACKAGES_TOKEN` 或 `PRIVATE_REGISTRY_TOKEN`，CI 会自动启用；未配置时不会失败。
- **自动识别 scope registry**：CI 会读取 `.npmrc.ci-backup` 中的 `@scope:registry` 配置，若是 GitHub Packages 且提供 token 则启用，否则统一回退到公共 npm registry。
- **锁文件自适应**：存在 `pnpm-lock.yaml` 时使用 `--frozen-lockfile`，不存在则使用 `--no-frozen-lockfile`，保证 CI 可运行。

以上策略无需任何本地操作，直接在 GitHub Actions 中生效。

## CI 依赖安装与私有包（无需本地操作）
当 CI 使用私有 registry（例如 GitHub Packages 或公司私有源）而未提供 token 时，会出现 `403 no authorization header`。本仓库的 CI 会先检测私有 registry 迹象并给出**可读错误提示**，避免晦涩的 403。

### 仅用 GitHub 网页配置 Secrets（无需本地）
1. 打开仓库 **Settings → Secrets and variables → Actions**。
2. 点击 **New repository secret**。
3. 按需添加以下任一项（不需要私有包则无需配置任何 secret）：

#### NPM_TOKEN
用于 npmjs 私有包访问。

#### GH_PACKAGES_TOKEN
用于 GitHub Packages（需 `read:packages` 权限）。

#### PRIVATE_REGISTRY_TOKEN
用于公司私有 registry（如 Artifactory/Nexus/JFrog）。

如果你不依赖私有包，CI 会自动走公共 npm registry，不需要任何 secret。
