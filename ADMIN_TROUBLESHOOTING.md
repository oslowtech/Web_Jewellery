# Admin Portal Troubleshooting

If you cannot access or see anything in the admin portal, check these things in order:

## 1. Check Browser Console for Errors
Open DevTools (F12) → Console tab and look for red errors.

## 2. Check Access Level
Admin portal redirects you based on your auth status:
- **"Admin portal not configured"** → Supabase not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`
- **Redirected to `/login`** → Not logged in. Log in first at `/login`
- **Redirected to `/profile`** → Not an admin. Check your profile role in Supabase

## 3. Check Supabase Configuration

### Verify Environment Variables
Your `.env` file must have:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### Verify Supabase Tables Exist
In Supabase SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see:
- `profiles` table
- `products` table

If either is missing, run the setup from `SUPABASE_SETUP.md`.

### Verify Admin Role
In Supabase, check the `profiles` table for your user:
```sql
SELECT id, email, full_name, role FROM public.profiles WHERE email = 'your@email.com';
```

The `role` column must be `'admin'`. If it's `'user'`, update it:
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-id';
```

## 4. Check Products Table Permissions
In Supabase, check the Row Level Security (RLS) policies on `products`:

```sql
SELECT policy_name, qual FROM pg_policies WHERE tablename = 'products';
```

You should see policies like:
- "Products are readable by everyone"
- "Products are editable by admins"

If missing, run the setup from `SUPABASE_SETUP.md`.

## 5. If Still Blank

The admin page now shows helpful error messages:
- **"Supabase not configured"** message at top
- **"Error loading products:"** message with details if the query fails

If you don't see any error message and the page appears completely blank:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Check Network tab to see if Supabase requests are failing

## 6. Test Supabase Connection
In browser console, run:
```javascript
// Check if Supabase is configured
console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL)
console.log("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing")

// Check your current user
const { data: session } = await supabase.auth.getSession();
console.log("Current session:", session);

// Try to fetch products
const { data, error } = await supabase.from('products').select('count');
console.log("Products query result:", { data, error });
```

Note: You need the global `supabase` object exposed in your app for this to work.

## Quick Checklist
- [ ] `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] I am logged in (see email at top of admin page)
- [ ] My user role is `'admin'` in Supabase `profiles` table
- [ ] `products` table exists in Supabase
- [ ] RLS policies are set up correctly
- [ ] No red errors in browser console
