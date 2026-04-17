import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: state, error: stateErr } = await supabase
      .from('telegram_bot_state')
      .select('update_offset')
      .eq('id', 1)
      .single();

    if (stateErr) throw stateErr;

    let currentOffset = state.update_offset;
    let totalProcessed = 0;

    while (true) {
      const elapsed = Date.now() - startTime;
      const remainingMs = MAX_RUNTIME_MS - elapsed;
      if (remainingMs < MIN_REMAINING_MS) break;

      const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
      if (timeout < 1) break;

      const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ['message'],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('getUpdates failed:', data);
        break;
      }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      const rows = updates
        .filter((u: any) => u.message)
        .map((u: any) => ({
          update_id: u.update_id,
          chat_id: u.message.chat.id,
          username: u.message.from?.username ?? null,
          text: u.message.text ?? null,
          raw_update: u,
        }));

      if (rows.length > 0) {
        const { error: insertErr } = await supabase
          .from('telegram_messages')
          .upsert(rows, { onConflict: 'update_id' });

        if (insertErr) {
          console.error('Insert error:', insertErr);
          break;
        }

        // Process /start LINKCODE commands inline
        for (const row of rows) {
          const text = row.text?.trim() ?? '';
          const startMatch = text.match(/^\/start\s+(TG-[A-Z0-9]{8})$/i);
          if (startMatch) {
            const code = startMatch[1].toUpperCase();
            const { data: link } = await supabase
              .from('telegram_chat_links')
              .select('id, user_id, parent_user_id')
              .eq('link_code', code)
              .eq('is_active', true)
              .maybeSingle();

            if (link) {
              await supabase
                .from('telegram_chat_links')
                .update({
                  chat_id: row.chat_id,
                  username: row.username,
                  linked_at: new Date().toISOString(),
                })
                .eq('id', link.id);

              // Send confirmation
              await fetch(`${GATEWAY_URL}/sendMessage`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'X-Connection-Api-Key': TELEGRAM_API_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: row.chat_id,
                  text: '✅ <b>Аккаунт привязан!</b>\n\nТеперь вы будете получать уведомления о сессиях, заявках и протоколах прямо здесь.',
                  parse_mode: 'HTML',
                }),
              });
            } else {
              await fetch(`${GATEWAY_URL}/sendMessage`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'X-Connection-Api-Key': TELEGRAM_API_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: row.chat_id,
                  text: '⚠️ Код не найден или уже использован. Скопируйте актуальный код из личного кабинета.',
                }),
              });
            }
          } else if (text === '/start') {
            await fetch(`${GATEWAY_URL}/sendMessage`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'X-Connection-Api-Key': TELEGRAM_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: row.chat_id,
                text: '👋 Здравствуйте! Это бот платформы Universum.\n\nЧтобы привязать ваш аккаунт, отправьте команду:\n<code>/start ВАШ-КОД</code>\n\nКод можно получить в личном кабинете в разделе «Уведомления».',
                parse_mode: 'HTML',
              }),
            });
          }
        }

        totalProcessed += rows.length;
      }

      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase
        .from('telegram_bot_state')
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq('id', 1);
      currentOffset = newOffset;
    }

    return new Response(JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('telegram-poll error:', errorMessage);
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
