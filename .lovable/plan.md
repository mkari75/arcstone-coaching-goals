

## Secure Admin API Edge Function

Create a backend edge function that allows an external agent (like Claude) to execute database operations over HTTP, authenticated with a shared secret key.

### How It Works

1. A new secret (`ADMIN_API_SECRET`) will be added -- you'll provide a strong password/token of your choice
2. A new edge function (`admin-query`) will accept SQL queries via POST request
3. The function validates the secret before executing anything
4. Your Claude agent can then call this endpoint with the secret to read/write data

### Usage Example

Once deployed, your Claude agent would call it like this:

```text
POST https://xxohypikxcssudspnher.supabase.co/functions/v1/admin-query
Headers:
  x-admin-secret: <your-chosen-secret>
  Content-Type: application/json
Body:
  { "query": "SELECT * FROM profiles LIMIT 5" }
```

### Security Measures

- Protected by a secret key only you know (not the service role key)
- Blocks dangerous operations: DROP DATABASE, TRUNCATE (configurable)
- Logs all queries for audit purposes
- Only accessible via HTTPS

### Implementation Steps

1. Request you to set the `ADMIN_API_SECRET` (you choose the value)
2. Create the `admin-query` edge function that:
   - Validates the `x-admin-secret` header
   - Accepts a SQL query in the request body
   - Executes it using the service role key (server-side only)
   - Returns the results as JSON
3. Update `supabase/config.toml` to disable JWT verification for this function
4. Deploy and test

### Technical Details

- **New file**: `supabase/functions/admin-query/index.ts`
- **New secret**: `ADMIN_API_SECRET` (you provide the value)
- **Config change**: Add `[functions.admin-query]` with `verify_jwt = false` to config.toml
- The function uses `SUPABASE_SERVICE_ROLE_KEY` internally via `Deno.env.get()` but never exposes it

