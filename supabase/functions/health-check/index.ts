import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check database connectivity
    const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
    if (dbError) throw new Error(`Database check failed: ${dbError.message}`);

    // Check storage
    const { error: storageError } = await supabase.storage.listBuckets();
    if (storageError) throw new Error(`Storage check failed: ${storageError.message}`);

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
          storage: 'ok',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
