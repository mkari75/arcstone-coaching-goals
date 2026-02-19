import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

const DANGEROUS_PATTERNS = [
  /DROP\s+DATABASE/i,
  /DROP\s+SCHEMA/i,
  /TRUNCATE/i,
  /DROP\s+OWNED/i,
  /ALTER\s+SYSTEM/i,
  /CREATE\s+EXTENSION/i,
  /pg_terminate_backend/i,
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate admin secret
    const adminSecret = req.headers.get('x-admin-secret');
    const expectedSecret = Deno.env.get('ADMIN_API_SECRET');

    if (!adminSecret || adminSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid "query" field' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for dangerous operations
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(query)) {
        return new Response(
          JSON.stringify({ error: `Blocked: query matches dangerous pattern "${pattern.source}"` }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Execute using service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });

    if (error) {
      // Fallback: use postgres connection directly via fetch to PostgREST
      // If rpc doesn't exist, try using the REST API with raw SQL
      console.error('RPC exec_sql failed, trying direct approach:', error.message);

      // Use the database URL for direct queries
      const dbUrl = Deno.env.get('SUPABASE_DB_URL');
      if (!dbUrl) {
        return new Response(
          JSON.stringify({ error: 'Database connection not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { Pool } = await import('https://deno.land/x/postgres@v0.19.3/mod.ts');
      const pool = new Pool(dbUrl, 3, true);
      const connection = await pool.connect();

      try {
        const result = await connection.queryObject(query);
        const response = {
          success: true,
          data: result.rows,
          rowCount: result.rowCount,
          timestamp: new Date().toISOString(),
        };
        console.log(`[admin-query] Executed: ${query.substring(0, 100)}... | Rows: ${result.rowCount}`);
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } finally {
        connection.release();
        await pool.end();
      }
    }

    const response = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };

    console.log(`[admin-query] Executed via RPC: ${query.substring(0, 100)}...`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[admin-query] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
