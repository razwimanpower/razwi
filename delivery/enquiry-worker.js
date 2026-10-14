// Cloudflare Worker: receives website enquiries and delivers them by EMAIL (Resend) and WHATSAPP (Meta Cloud API).
// Secrets/vars (set in Cloudflare dashboard): RESEND_API_KEY, MAIL_FROM, MAIL_TO, WA_TOKEN, WA_PHONE_ID, WA_TO, WA_TEMPLATE, ALLOWED_ORIGIN
export default {
  async fetch(req, env) {
    const cors = {'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'};
    if (req.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (req.method !== 'POST') return json({ok: false}, 405, cors);
    let d; try { d = await req.json(); } catch { return json({ok: false, error: 'bad json'}, 400, cors); }
    if (d.website) return json({ok: true}, 200, cors); // honeypot: bots fill this hidden field
    const name = String(d.name || d.co || '').slice(0, 100), phone = String(d.phone || '').slice(0, 20);
    if (!name || !/^[+\d][\d\s-]{8,14}$/.test(phone) || !d.consent) return json({ok: false, error: 'invalid'}, 400, cors);
    const title = String(d.form || 'Website enquiry').slice(0, 80);
    const skip = new Set(['form', 'consent', 'website', '_subject', '_template', '_captcha', '_replyto']);
    const lines = Object.entries(d).filter(([k, v]) => !skip.has(k) && v).map(([k, v]) => k + ': ' + String(v).slice(0, 1000));
    const text = title + '\n\n' + lines.join('\n'), tasks = [];
    if (env.RESEND_API_KEY) tasks.push(fetch('https://api.resend.com/emails', {method: 'POST', headers: {Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json'}, body: JSON.stringify({from: env.MAIL_FROM, to: [env.MAIL_TO], reply_to: d.email || undefined, subject: title, text})}));
    if (env.WA_TOKEN && env.WA_PHONE_ID) tasks.push(fetch('https://graph.facebook.com/v20.0/' + env.WA_PHONE_ID + '/messages', {method: 'POST', headers: {Authorization: 'Bearer ' + env.WA_TOKEN, 'Content-Type': 'application/json'}, body: JSON.stringify({messaging_product: 'whatsapp', to: env.WA_TO, type: 'template', template: {name: env.WA_TEMPLATE || 'new_enquiry', language: {code: 'en'}, components: [{type: 'body', parameters: [title, name, phone, lines.join(' | ')].map(t => ({type: 'text', text: t.replace(/\s+/g, ' ').slice(0, 900)}))}]}})}));
    if (!tasks.length) return json({ok: false, error: 'not configured'}, 500, cors);
    const res = await Promise.allSettled(tasks.map(async t => { const r = await t; if (!r.ok) throw new Error(String(r.status)); return 1; }));
    const ok = res.some(r => r.status === 'fulfilled');
    return json({ok, email: env.RESEND_API_KEY ? res[0].status === 'fulfilled' : null}, ok ? 200 : 502, cors);
  }
};
function json(o, s, h) { return new Response(JSON.stringify(o), {status: s, headers: {...h, 'Content-Type': 'application/json'}}); }
