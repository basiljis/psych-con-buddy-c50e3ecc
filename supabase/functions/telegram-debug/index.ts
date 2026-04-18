const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');

  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing keys' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const headers = {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': TELEGRAM_API_KEY,
    'Content-Type': 'application/json',
  };

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'info';

  if (action === 'deleteWebhook') {
    const r = await fetch(`${GATEWAY_URL}/deleteWebhook`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ drop_pending_updates: false }),
    });
    return new Response(JSON.stringify(await r.json()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const meR = await fetch(`${GATEWAY_URL}/getMe`, { method: 'POST', headers });
  const me = await meR.json();

  const whR = await fetch(`${GATEWAY_URL}/getWebhookInfo`, { method: 'POST', headers });
  const wh = await whR.json();

  const upR = await fetch(`${GATEWAY_URL}/getUpdates`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ offset: 0, timeout: 0, allowed_updates: ['message'] }),
  });
  const up = await upR.json();

  return new Response(JSON.stringify({ me, webhook: wh, updates: up }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
