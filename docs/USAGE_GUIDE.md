《项目使用说明 / 交接文档》

---

## 目录（TOC）
1. [仓库概览](#1-仓库概览)
2. [快速开始（本地）](#2-快速开始本地)
3. [部署与环境变量（Vercel）](#3-部署与环境变量vercel)
4. [核心业务流程（用户旅程）](#4-核心业务流程用户旅程)
5. [页面与路由清单（App Router）](#5-页面与路由清单app-router)
6. [API 清单与契约（前端视角）](#6-api-清单与契约前端视角)
7. [数据库（Supabase）与表结构](#7-数据库supabase与表结构)
8. [运维/运营指南（非开发也能看懂）](#8-运维运营指南非开发也能看懂)
9. [故障排查：按钮点不动/表单提交无反应](#9-故障排查按钮点不动表单提交无反应)
10. [附录：关键文件索引（按主题）](#10-附录关键文件索引按主题)

---

## 1. 仓库概览

### 1.1 项目做什么（5 行以内）
- 这是一个 NSUK 教育邮箱门户（Portal），用于激活、管理与续期教育邮箱账号。
- 使用 Supabase Auth + PostgreSQL 管理用户与教育邮箱数据。
- 提供用户自助登录/找回/重置密码，以及管理员后台与健康检查。
- Webmail 本体是外部系统（不在仓库内）。

证据：README.md:1-104

### 1.2 技术栈
- Next.js App Router + TypeScript、TailwindCSS + shadcn/ui、Supabase Postgres、JWT Cookie 会话。
- 依赖版本：Next.js `^14.2.7`、Supabase JS `^2.45.4`、Upstash（限流）、jose（JWT）、bcryptjs 等。
- Node 版本要求：`20.x`；包管理器：`pnpm@10.13.1`。

证据：README.md:5-9；package.json:6-45

### 1.3 目录结构导览
- 顶层目录：`src/`（核心代码）、`supabase/`（数据库 SQL）、`public/`（静态资源）、`scripts/`、`middleware.ts`、`vercel.json`、`README.md` 等。
- `src/app/`：App Router 页面与 API 路由（如 `/login`、`/redeem`、`/api/*`）。
- `src/components/`：表单/后台/状态面板等 UI 组件。
- `src/lib/`：环境变量、Supabase 客户端、会话、限流、工具函数等。

证据：README.md:50-70；vercel.json:1-8；middleware.ts:1-40；src/app/page.tsx:1-35；src/app/api/login/route.ts:1-118；src/components/login-form.tsx:1-200；src/components/redeem-form.tsx:1-199；src/lib/env.ts:1-154；src/lib/supabase/server.ts:1-16；src/lib/auth/session.ts:1-49

---

## 2. 快速开始（本地）

### 2.1 Node/包管理器要求
- Node：`20.x`；包管理器：`pnpm@10.13.1`。

证据：package.json:6-9

### 2.2 安装、启动、构建命令（来自 scripts）
- 安装：`pnpm install`（README 示例）。
- 开发：`pnpm dev`（对应 `next dev`）。
- 构建：`pnpm build`（对应 `next build`）。
- 生产启动：`pnpm start`（对应 `next start`）。
- Lint：`pnpm lint`（`next lint`）。

证据：README.md:65-70；package.json:10-15

### 2.3 常见失败点（基于证据）
- **环境变量缺失**会在运行时抛错（如 `getPublicEnv/getSessionEnv/getAdminEnv`）。
- **Supabase Service Role 缺失**导致服务端敏感操作失败（server client 依赖）。
- **APP_BASE_URL 未配置**会导致找回/重置回跳失败（/api/forgot 使用）。
- **Upstash 环境变量缺失**会禁用限流（非生产下会警告）。

证据：src/lib/env.ts:55-105；src/lib/supabase/server.ts:1-8；src/app/api/forgot/route.ts:33-55；src/lib/security/rate-limit.ts:63-83

---

## 3. 部署与环境变量（Vercel）

### 3.1 环境变量分类（必填/可选/NEXT_PUBLIC）
**NEXT_PUBLIC（前端可见）**
- `NEXT_PUBLIC_SUPABASE_URL`：浏览器端/服务端 Supabase URL；`getPublicEnv/getSupabaseServiceEnv` 均依赖。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：浏览器端 Supabase 匿名 key；`getPublicEnv` 依赖。

**服务端必填（核心功能必需）**
- `SUPABASE_SERVICE_ROLE_KEY`：服务端 Supabase client 使用（敏感操作）。
- `SESSION_SECRET`：JWT Cookie 会话签名密钥（用户/管理员会话）。
- `APP_BASE_URL`：找回密码回跳地址（/api/forgot）。
- `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`：管理员登录校验；密码 hash 由 bcrypt 生成。

**可选（功能增强）**
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`：请求限流；缺失时限流禁用（非生产警告）。

**Cron 必填（过期任务）**
- `CRON_SECRET`：保护 `/api/cron/expire` 任务，缺失将返回 500。

证据：src/lib/env.ts:1-153；src/lib/supabase/server.ts:1-8；src/lib/auth/session.ts:4-18；src/app/api/forgot/route.ts:33-55；src/lib/security/rate-limit.ts:63-83；src/app/api/cron/expire/route.ts:12-23

### 3.2 缺失时会怎样？
- `getPublicEnv/getSupabaseServiceEnv/getSessionEnv/getAdminEnv/getCronEnv` 直接抛错（运行时失败）。
- `/api/health` 会报告缺失 env/DB 状态（用于排障）。
- `/api/cron/expire` 缺 `CRON_SECRET` 直接 500；token 不匹配 401。

证据：src/lib/env.ts:55-153；src/app/api/health/route.ts:17-141；src/app/api/cron/expire/route.ts:12-23

### 3.3 Vercel 配置（vercel.json）
- 定义 cron：每天 00:00 触发 `/api/cron/expire`。

证据：vercel.json:1-8

### 3.4 最小可跑环境变量清单（不含敏感值）
- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase anon key。
- `SUPABASE_SERVICE_ROLE_KEY`：服务端写入权限。
- `SESSION_SECRET`：JWT 会话签名。
- `APP_BASE_URL`：找回/重置回跳域名。
- `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`：管理员登录。
- `CRON_SECRET`：过期任务认证（若启用 cron）。

证据：src/lib/env.ts:1-153

---

## 4. 核心业务流程（用户旅程）

### 4.1 流程图式（文本箭头）
`/redeem` → `/api/health` 检查 → `/api/redeem` 创建账号/邮箱 → `/login` → `/api/login` 创建用户会话 → `/dashboard` 查看邮箱信息 → `/dashboard` 续期或改密 → `/api/dashboard/renew` 或 `/api/dashboard/password`
管理员：`/admin/login` → `/api/admin/login` → `/admin`（概览）→ `/admin/codes`/`/admin/users`/`/admin/audit`/`/status`

证据：src/components/redeem-form.tsx:86-199；src/app/api/redeem/route.ts:244-477；src/components/login-form.tsx:41-115；src/app/api/login/route.ts:23-117；src/app/dashboard/page.tsx:10-75；src/components/dashboard-panel.tsx:48-195；src/app/api/dashboard/renew/route.ts:10-77；src/app/api/dashboard/password/route.ts:41-108；src/app/admin/login/page.tsx:1-24；src/app/api/admin/login/route.ts:12-102

### 4.2 关键步骤详解（页面 → API → 数据/系统）
1. **兑换（/redeem）**
   - 页面：`src/app/redeem/page.tsx` 使用 `RedeemForm`。
   - 表单逻辑：提交前调用 `/api/health` 做健康检查；提交 `/api/redeem`，校验字段并解析错误。
   - `/api/redeem`：使用 Supabase Service Role 检查激活码、创建 Auth 用户与 `profiles/edu_accounts`；失败回滚；成功返回 `personal_email/edu_email/expires_at/password/webmail`。

   证据：src/app/redeem/page.tsx:1-22；src/components/redeem-form.tsx:86-199；src/app/api/redeem/route.ts:244-477

2. **登录（/login）**
   - 页面：`src/app/login/page.tsx` → `LoginForm`。
   - 表单提交 `/api/login`（personal/edu 模式）。
   - `/api/login`：查询 `profiles/edu_accounts`，校验密码与过期状态，创建用户会话 Cookie。

   证据：src/app/login/page.tsx:1-34；src/components/login-form.tsx:41-115；src/app/api/login/route.ts:23-117

3. **找回密码（/forgot）**
   - 页面：`src/app/forgot/page.tsx` → `ForgotForm`。
   - `/api/forgot`：检查 `personal_email` 是否存在，调用 Supabase Auth `resetPasswordForEmail` 并指定回跳 `APP_BASE_URL/reset`。

   证据：src/app/forgot/page.tsx:1-29；src/app/api/forgot/route.ts:16-59

4. **重置密码（/reset）**
   - 页面：`src/app/reset/page.tsx` → `ResetForm`（读取 access_token）。
   - `/api/reset`：使用 access_token 更新密码，记录 `audit_logs`。

   证据：src/app/reset/page.tsx:6-22；src/app/api/reset/route.ts:10-48

5. **Dashboard（/dashboard）**
   - 页面：`src/app/dashboard/page.tsx`：需要用户会话；读取用户与 `edu_accounts`；过期则更新状态；Suspended 则跳回登录。
   - `DashboardPanel`：续期调用 `/api/dashboard/renew`，改密调用 `/api/dashboard/password`，可复制 Webmail 信息。

   证据：src/app/dashboard/page.tsx:10-75；src/components/dashboard-panel.tsx:48-195

6. **管理员登录（/admin/login）**
   - 页面：`src/app/admin/login/page.tsx` → `AdminLoginForm`。
   - `/api/admin/login`：校验管理员邮箱/密码（bcrypt hash），创建管理员会话 Cookie。

   证据：src/app/admin/login/page.tsx:1-24；src/app/api/admin/login/route.ts:12-102

---

## 5. 页面与路由清单（App Router）

### 5.1 路由分组
**公共页面**
- `/` 首页（入口）
- `/redeem` 兑换激活码
- `/login` 用户登录
- `/forgot` 找回密码
- `/reset` 重置密码

证据：src/app/page.tsx:1-35；src/app/redeem/page.tsx:1-22；src/app/login/page.tsx:1-34；src/app/forgot/page.tsx:1-29；src/app/reset/page.tsx:1-25

**用户区**
- `/dashboard` 用户控制台（需要登录）

证据：src/app/dashboard/page.tsx:10-75

**管理员区**
- `/admin/login` 管理员登录
- `/admin` 管理概览
- `/admin/codes` 激活码管理
- `/admin/users` 用户管理
- `/admin/audit` 审计日志
- `/status` 系统状态（管理员）

证据：src/app/admin/login/page.tsx:1-24；src/app/admin/page.tsx:1-26；src/app/admin/codes/page.tsx:1-25；src/app/admin/users/page.tsx:1-25；src/app/admin/audit/page.tsx:1-25；src/app/status/page.tsx:1-32

### 5.2 访问控制 / 中间件
- `/admin/*`（除 `/admin/login`）要求 `nsuk_admin_session`。
- `/dashboard` 要求 `nsuk_user_session`。
- `lang=zh|en` 会写入 `portal-lang` cookie。

证据：middleware.ts:5-35

### 5.3 i18n / lang 机制
- `lang` 来源：优先 query 参数，其次 `portal-lang` cookie，默认 `en`。
- `withLang()`：为链接追加 `?lang=`。
- `getDictionary()`：按 locale 取字典。

证据：src/lib/i18n.ts:12-35；src/i18n/index.ts:9-19

---

## 6. API 清单与契约（前端视角）

> 通用返回工具：
> - `jsonSuccess(data)` → `{...data}`
> - `jsonError(message)` → `{ ok:false, error: message }`
> - `jsonFieldError(field, key)` → `{ ok:false, error: { field, key } }`
>
> 证据：src/lib/utils/api.ts:1-19

### 6.1 用户相关
1. **POST /api/redeem**
   - 入参：`activation_code, personal_email, edu_username, password`
   - 鉴权：无（但有 rate limit）
   - 成功：`{ personal_email, edu_email, expires_at, password, webmail }`
   - 失败：字段错误或 500/502

   证据：src/app/api/redeem/route.ts:244-477

2. **POST /api/login**
   - 入参：`email, password, mode`（personal/edu）
   - 鉴权：无（但有 rate limit）
   - 成功：`{ ok: true }` 并写入 `nsuk_user_session`

   证据：src/app/api/login/route.ts:23-117

3. **POST /api/logout**
   - 入参：无
   - 鉴权：无
   - 成功：`{ ok: true }`

   证据：src/app/api/logout/route.ts:1-7

4. **POST /api/forgot**
   - 入参：`personal_email`
   - 鉴权：无（rate limit）
   - 成功：`{ ok: true }` 或带 `hint` 的成功响应

   证据：src/app/api/forgot/route.ts:10-59

5. **POST /api/reset**
   - 入参：`access_token, new_password`
   - 鉴权：无（rate limit）
   - 成功：`{ ok: true }`

   证据：src/app/api/reset/route.ts:10-49

6. **POST /api/dashboard/renew**
   - 入参：`activation_code`
   - 鉴权：`nsuk_user_session`
   - 成功：`{ ok, renewed, enabled, expires_at }`

   证据：src/app/api/dashboard/renew/route.ts:10-77

7. **POST /api/dashboard/password**
   - 入参：`old_password, new_password`
   - 鉴权：`nsuk_user_session`
   - 成功：`{ ok: true }`

   证据：src/app/api/dashboard/password/route.ts:41-108

### 6.2 管理员相关
1. **POST /api/admin/login**
   - 入参：`email, password`
   - 鉴权：无（rate limit）
   - 成功：`{ ok: true }`，写入 `nsuk_admin_session`

   证据：src/app/api/admin/login/route.ts:12-102

2. **GET/POST/PATCH /api/admin/codes**
   - GET：支持 `?status=` 和 `?export=csv`（导出 CSV）
   - POST：生成 codes（数量/前缀/长度/备注）
   - PATCH：撤销未使用 code

   证据：src/app/api/admin/codes/route.ts:16-84

3. **GET/PATCH /api/admin/users**
   - GET：按 query 搜索用户与 edu 账户
   - PATCH：续期/冻结/重置密码

   证据：src/app/api/admin/users/route.ts:11-138

4. **GET /api/admin/audit**
   - GET：查询审计日志

   证据：src/app/api/admin/audit/route.ts:8-21

5. **GET /api/admin/summary**
   - GET：管理员统计概览

   证据：src/app/api/admin/summary/route.ts:7-24

### 6.3 系统相关
1. **GET /api/health**
   - 公开视图：返回 `ok`、`supabase`、`app_base_url` 等
   - 管理员视图：包含 `env` 状态详情

   证据：src/app/api/health/route.ts:9-141

2. **GET/POST /api/cron/expire**
   - 需要 `Authorization: Bearer CRON_SECRET`
   - 扫描过期教育邮箱并禁用账号

   证据：src/app/api/cron/expire/route.ts:12-79

### 6.4 认证与限流
- 用户/管理员会话使用 JWT Cookie：`nsuk_user_session`、`nsuk_admin_session`。
- JWT 签名由 `SESSION_SECRET` 驱动。
- Rate limit 使用 Upstash Redis；缺失时禁用（非生产警告）。

证据：src/lib/auth/user-session.ts:4-23；src/lib/auth/admin-session.ts:4-23；src/lib/auth/session.ts:4-18；src/lib/security/rate-limit.ts:63-83

---

## 7. 数据库（Supabase）与表结构

### 7.1 表与字段（来源：supabase/schema.sql）
- `activation_codes`：`code` 主键，`status`、`used_at` 等。
- `profiles`：`id`、`personal_email`、`is_suspended` 等。
- `edu_accounts`：`user_id`、`edu_email`、`edu_username`、`expires_at` 等。
- `audit_logs`：`action`、`user_id`、`meta` 等。

证据：supabase/schema.sql:6-46

### 7.2 RLS
- 所有核心表启用 RLS；无 public policy（Service Role 绕过）。

证据：supabase/rls.sql:1-7

### 7.3 关键函数（SQL）
- `redeem_activation_code`：激活码兑换并创建 edu_accounts。
- `renew_with_code`：续期 edu_accounts。
- 管理员统计：`admin_code_counts/admin_edu_counts/admin_activity_counts`。

证据：supabase/schema.sql:54-182

### 7.4 API / 页面与表映射
- `/api/redeem`：`activation_codes`、`profiles`、`edu_accounts`、`audit_logs`。
- `/api/login`：`profiles`、`edu_accounts`、`audit_logs`。
- `/api/forgot`：`profiles`。
- `/api/reset`：`audit_logs`。
- `/api/admin/codes`：`activation_codes`、`audit_logs`。
- `/api/admin/users`：`profiles`、`edu_accounts`、`audit_logs`。
- `/api/admin/audit`：`audit_logs`。
- `/api/admin/summary`：`profiles` + SQL RPC counts。
- `/api/cron/expire`：`edu_accounts`。
- Dashboard 页面：`profiles` + `edu_accounts`（聚合读取）。

证据：src/app/api/redeem/route.ts:247-477；src/app/api/login/route.ts:56-117；src/app/api/forgot/route.ts:32-41；src/app/api/reset/route.ts:40-46；src/app/api/admin/codes/route.ts:16-83；src/app/api/admin/users/route.ts:11-137；src/app/api/admin/audit/route.ts:13-20；src/app/api/admin/summary/route.ts:13-23；src/app/api/cron/expire/route.ts:28-56；src/lib/data/user.ts:3-13

### 7.5 初始化步骤
- 必须执行：`supabase/schema.sql` + `supabase/rls.sql` + `supabase/seed.sql`（README 指引）。

证据：README.md:50-54

---

## 8. 运维/运营指南（非开发也能看懂）

### 8.1 如何创建/发放 activation code
- 管理员进入 `/admin/codes`，可生成激活码、导出 CSV、撤销未使用码。

证据：src/app/admin/codes/page.tsx:1-23；src/app/api/admin/codes/route.ts:16-84

### 8.2 常见工单处理思路（依据系统现状）
- **激活失败**：检查激活码状态（unused/used/revoked）。管理员可在 `/admin/codes` 查询与撤销。
- **找回失败**：检查 `APP_BASE_URL` 是否配置；`/api/forgot` 会提示回跳 URL 未配置。
- **登录失败**：确认用户未被停用（`is_suspended`）、邮箱未过期。
- **邮箱不可用**：可检查 `/status` + `/api/health`。

证据：src/app/api/admin/codes/route.ts:16-83；src/app/api/forgot/route.ts:33-55；src/app/api/login/route.ts:56-110；src/app/status/page.tsx:8-30；src/app/api/health/route.ts:93-104

### 8.3 Dashboard / 管理后台能看到什么
- 用户 Dashboard：个人邮箱、教育邮箱、到期时间、状态、续期、改密、Webmail入口。
- 管理概览 `/admin`：激活码统计、用户数、教育账号活跃/过期、近 24h 活动。
- 用户管理 `/admin/users`：搜索、续期、冻结、重置密码。
- 审计日志 `/admin/audit`：查询操作日志。

证据：src/components/dashboard-panel.tsx:96-195；src/app/admin/page.tsx:1-26；src/app/api/admin/summary/route.ts:13-24；src/components/admin-users.tsx:15-92；src/app/api/admin/users/route.ts:11-138；src/components/admin-audit.tsx:13-67；src/app/api/admin/audit/route.ts:13-20

### 8.4 排障 checklist（顺序）
1. 浏览器 Network 看请求是否 4xx/5xx（前端表单逻辑均走 `/api/*`）。
2. Vercel Logs：看服务端报错（常见为 env 缺失或 Supabase）。
3. `/api/health`：检查 env/DB 状态。
4. Supabase Logs：验证表结构与 RLS。需要执行 `schema.sql/rls.sql`。

证据：src/components/redeem-form.tsx:145-231；src/components/login-form.tsx:74-115；src/lib/env.ts:55-153；src/app/api/health/route.ts:17-141；README.md:50-54；supabase/rls.sql:1-7

---

## 9. 故障排查：按钮点不动/表单提交无反应

> 仅提供定位方法，不提供修复方案。

### 9.1 可能原因清单（代码级）
1. **表单校验未通过导致不提交**
   - `/login`、`/redeem` 在前端会先做字段校验，未填或格式不对直接 `setError`。
   - 验证方法：看前端是否出现错误提示。

   证据：src/components/login-form.tsx:41-92；src/components/redeem-form.tsx:41-115

2. **按钮被禁用（loading / submitting）**
   - `/redeem`：提交期间 `submitting` 为 true，按钮 disabled。
   - `/reset`：无 token 时按钮 disabled。
   - 验证方法：查看按钮是否 disabled；检查状态变量。

   证据：src/components/redeem-form.tsx:284-315；src/components/reset-form.tsx:57-88

3. **API 返回非 JSON 或错误结构**
   - Redeem 前端会在解析 JSON 失败时提示 “serverReturnedNonJson”。
   - 验证方法：检查 Network 响应是否 JSON。

   证据：src/components/redeem-form.tsx:130-231

4. **后端被限流（429）**
   - `/api/redeem`、`/api/login`、`/api/forgot`、`/api/reset` 都有 rate limit。
   - 验证方法：Network 中查看 429 和 `Retry-After` 头。

   证据：src/lib/security/rate-limit.ts:63-115；src/app/api/login/route.ts:23-27

5. **环境变量缺失导致接口报错**
   - `getSessionEnv/getSupabaseServiceEnv` 失败会直接返回错误或 500。
   - 验证方法：检查 `/api/health` 输出或 Vercel logs。

   证据：src/lib/env.ts:55-153；src/app/api/health/route.ts:26-53

6. **管理员/用户会话缺失导致页面重定向**
   - `/dashboard`、`/admin/*` 会被 middleware 重定向。
   - 验证方法：看是否被重定向到 `/login` 或 `/admin/login`。

   证据：middleware.ts:17-33

---

## 10. 附录：关键文件索引（按主题）

### 10.1 配置与运行
- `package.json`：Node 版本、脚本、依赖。
- `vercel.json`：定时任务配置（cron）。
- `middleware.ts`：路由保护与语言 cookie。
- `README.md`：项目说明、环境变量示例、初始化步骤。

证据：package.json:6-45；vercel.json:1-8；middleware.ts:5-35；README.md:1-104

### 10.2 认证与会话
- `src/lib/auth/session.ts`：JWT 签名/验证、cookie 操作。
- `src/lib/auth/user-session.ts`：用户会话逻辑。
- `src/lib/auth/admin-session.ts`：管理员会话逻辑。

证据：src/lib/auth/session.ts:1-49；src/lib/auth/user-session.ts:4-29；src/lib/auth/admin-session.ts:4-28

### 10.3 Supabase / 数据
- `src/lib/supabase/server.ts`：服务端 Supabase client（service role）。
- `src/lib/supabase/client.ts`：浏览器 Supabase client（anon key）。
- `supabase/schema.sql`：核心表结构与函数。
- `supabase/rls.sql`：RLS 配置。
- `src/lib/data/user.ts`：用户与 edu_accounts 关联查询。

证据：src/lib/supabase/server.ts:1-8；src/lib/supabase/client.ts:1-14；supabase/schema.sql:6-182；supabase/rls.sql:1-7；src/lib/data/user.ts:3-13

### 10.4 API 路由
- `src/app/api/redeem/route.ts`：兑换激活码与邮箱创建。
- `src/app/api/login/route.ts`：用户登录与会话创建。
- `src/app/api/forgot/route.ts`：找回密码邮件。
- `src/app/api/reset/route.ts`：重置密码。
- `src/app/api/logout/route.ts`：退出登录。
- `src/app/api/dashboard/renew/route.ts`：续期。
- `src/app/api/dashboard/password/route.ts`：改密。
- `src/app/api/health/route.ts`：健康检查。
- `src/app/api/cron/expire/route.ts`：过期处理任务。
- `src/app/api/admin/login/route.ts`：管理员登录。
- `src/app/api/admin/codes/route.ts`：激活码管理。
- `src/app/api/admin/users/route.ts`：用户管理。
- `src/app/api/admin/audit/route.ts`：审计日志。
- `src/app/api/admin/summary/route.ts`：概览统计。

证据：src/app/api/redeem/route.ts:244-477；src/app/api/login/route.ts:23-117；src/app/api/forgot/route.ts:10-59；src/app/api/reset/route.ts:10-49；src/app/api/logout/route.ts:1-7；src/app/api/dashboard/renew/route.ts:10-77；src/app/api/dashboard/password/route.ts:41-108；src/app/api/health/route.ts:9-141；src/app/api/cron/expire/route.ts:12-79；src/app/api/admin/login/route.ts:12-102；src/app/api/admin/codes/route.ts:16-84；src/app/api/admin/users/route.ts:11-138；src/app/api/admin/audit/route.ts:8-21；src/app/api/admin/summary/route.ts:7-24

### 10.5 UI 页面与组件
- `src/app/redeem/page.tsx` + `src/components/redeem-form.tsx`：兑换流程 UI。
- `src/app/login/page.tsx` + `src/components/login-form.tsx`：登录 UI。
- `src/app/forgot/page.tsx` + `src/components/forgot-form.tsx`：找回 UI。
- `src/app/reset/page.tsx` + `src/components/reset-form.tsx`：重置 UI。
- `src/app/dashboard/page.tsx` + `src/components/dashboard-panel.tsx`：控制台 UI。
- `src/app/admin/*` + `src/components/admin-*`：后台 UI。

证据：src/app/redeem/page.tsx:1-22；src/components/redeem-form.tsx:1-199；src/app/login/page.tsx:1-34；src/components/login-form.tsx:1-200；src/app/forgot/page.tsx:1-29；src/components/forgot-form.tsx:1-101；src/app/reset/page.tsx:1-25；src/components/reset-form.tsx:1-97；src/app/dashboard/page.tsx:10-75；src/components/dashboard-panel.tsx:19-195；src/app/admin/page.tsx:1-26；src/components/admin-users.tsx:15-115
