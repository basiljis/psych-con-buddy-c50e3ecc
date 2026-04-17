import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

interface NotifyPayload {
  recipient_user_id?: string;
  recipient_parent_id?: string;
  message_text: string;
  notification_type: string;
  parse_mode?: 'HTML' | 'Markdown';
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotifyPayload = await req.json();

    if (!payload.message_text || !payload.notification_type) {
      return new Response(
        JSON.stringify({ error: 'message_text and notification_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload.recipient_user_id && !payload.recipient_parent_id) {
      return new Response(
        JSON.stringify({ error: 'recipient_user_id or recipient_parent_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find linked Telegram chat
    let query = supabase
      .from('telegram_chat_links')
      .select('chat_id')
      .eq('is_active', true)
      .not('chat_id', 'is', null);

    if (payload.recipient_user_id) {
      query = query.eq('user_id', payload.recipient_user_id);
    } else {
      query = query.eq('parent_user_id', payload.recipient_parent_id);
    }

    const { data: link } = await query.maybeSingle();

    // Queue notification
    const { data: queued, error: queueErr } = await supabase
      .from('telegram_notifications_queue')
      .insert({
        recipient_user_id: payload.recipient_user_id ?? null,
        recipient_parent_id: payload.recipient_parent_id ?? null,
        recipient_chat_id: link?.chat_id ?? null,
        message_text: payload.message_text,
        notification_type: payload.notification_type,
        parse_mode: payload.parse_mode ?? 'HTML',
        metadata: payload.metadata ?? {},
        status: link ? 'pending' : 'failed',
        error_message: link ? null : 'No linked Telegram chat found',
      })
      .select()
      .single();

    if (queueErr) throw queueErr;

    if (!link) {
      return new Response(
        JSON.stringify({ ok: false, queued_id: queued.id, reason: 'no_telegram_link' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send immediately
    const sendResp = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: link.chat_id,
        text: payload.message_text,
        parse_mode: payload.parse_mode ?? 'HTML',
      }),
    });

    const sendData = await sendResp.json();

    if (!sendResp.ok) {
      await supabase
        .from('telegram_notifications_queue')
        .update({
          status: 'failed',
          error_message: JSON.stringify(sendData),
        })
        .eq('id', queued.id);

      return new Response(
        JSON.stringify({ ok: false, queued_id: queued.id, telegram_error: sendData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('telegram_notifications_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', queued.id);

    return new Response(
      JSON.stringify({ ok: true, queued_id: queued.id, message_id: sendData.result?.message_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('telegram-notify error:', errorMessage);
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
