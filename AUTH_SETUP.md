# Auth Setup Guide

This document covers every step needed to wire up the custom authentication
system — Supabase `users` table, role-based access, and protected routes.

---

## 1. Run the Supabase migration

Open the Supabase SQL editor for your project and run the file:

```
supabase/migrations/001_create_users_table.sql
```

This creates:
- A `user_role` enum with all supported roles
- A `public.users` table (`id`, `email`, `password_hash`, `full_name`, `role`, `tenant_id`, `is_active`)
- Row-level security (RLS) allowing only the **service role** key to read/write it
- An index on `lower(email)` for fast login lookups

---

## 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in every value:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**keep secret!**) |
| `AUTH_JWT_SECRET` | Generate with: `openssl rand -hex 32` |
| `AUTH_SESSION_HOURS` | e.g. `8` |
| `NEXT_PUBLIC_AUTH_COOKIE_NAME` | `voiceos_auth_token` (default is fine) |

---

## 3. Seed users

Generate a bcrypt hash for each user's password:

```bash
node scripts/hash-password.mjs "yourpassword"
# prints: $2a$10$...
```

Then insert rows in Supabase (Table Editor or SQL editor):

```sql
insert into public.users (email, password_hash, full_name, role)
values
  ('admin@example.com',  '<hash>', 'Super Admin',   'super_admin'),
  ('ops@example.com',    '<hash>', 'Ops User',      'operations'),
  ('user@example.com',   '<hash>', 'Regular User',  'owner');
```

Only users that exist in this table can log in — no self-signup.

---

## 4. Role reference

### Admin panel roles  (`/admin/*`)
| Role | Access |
|---|---|
| `super_admin` | Everything |
| `operations` | Overview, Customers, Agents, Call Monitoring, Recordings, Operations |
| `support` | Overview, Customers, Call Monitoring, Recordings, Support Tools |
| `finance` | Overview, Customers, Billing, Settings |

### Dashboard roles  (`/dashboard/*` and all user routes)
| Role | Notes |
|---|---|
| `owner` | Full tenant access |
| `admin` | Full tenant access |
| `manager` | Team management |
| `member` | Standard user |
| `viewer` | Read-only |

---

## 5. How login works end-to-end

```
User submits email + password on /auth/login
  ↓
POST /api/auth/login  (Next.js API route — server side)
  ↓
Supabase service-role client → SELECT from public.users WHERE email = ?
  ↓
bcrypt.compare(submittedPassword, user.password_hash)
  ↓  success
Sign JWT (jose) containing { sub, email, role, tenantId }
Return { accessToken, expiresAt, user }
  ↓
Client (useLogin hook) calls useAuthStore.setSession()
  • stores token + user in localStorage
  • sets cookies:  voiceos_auth_token=1  and  voiceos_user_role=<role>
  ↓
router.replace() → /admin/overview  (admin roles)  or  /dashboard  (others)
```

---

## 6. Route protection (middleware)

`src/middleware.ts` runs on every request matched by its `config.matcher`:

| Scenario | Behaviour |
|---|---|
| No session cookie, visits `/dashboard/*` or `/admin/*` | Redirect to `/auth/login?next=<url>` |
| Has session, non-admin role visits `/admin/*` | Redirect to `/dashboard` |
| Has session, visits `/auth/login` | Redirect to their home (`/admin/overview` or `/dashboard`) |

The `voiceos_user_role` cookie is set on the **client** at login time  
(see `src/utils/auth-session.ts → persistAuthSession`).  
The middleware reads it as a plain string — no JWT verification needed  
at the edge, since accessing `/admin` just shows a UI; all sensitive data  
fetches still use the bearer token which is validated server-side.

---

## 7. Admin permission guard (client-side)

Wrap any admin page section with `<AdminPermissionGuard allow={[...]} >`:

```tsx
<AdminPermissionGuard allow={["billing", "settings"]}>
  <BillingPanel />
</AdminPermissionGuard>
```

The guard reads the role from Zustand (`useAdminRole`) and shows an  
"access denied" empty state if the user lacks the required permission.  
This is a **UX layer** on top of the middleware, not a security boundary.

---

## 8. Disabling a user

Set `is_active = false` in the `users` table.  
The login API will return HTTP 403 and the user cannot sign in.  
Existing sessions remain valid until they expire (`AUTH_SESSION_HOURS`).  
To force immediate logout, change `AUTH_JWT_SECRET` (invalidates all tokens).
