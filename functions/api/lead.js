function json(payload, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(payload), { ...init, headers });
}

function normalizeValue(value, maxLength = 4000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function parseRequestPayload(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "POST, OPTIONS"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const webhookUrl = env.N8N_FORM_WEBHOOK_URL;

  if (!webhookUrl) {
    return json({ success: false, error: "missing_form_transport" }, { status: 503 });
  }

  let body;

  try {
    body = await parseRequestPayload(request);
  } catch {
    return json({ success: false, error: "invalid_payload" }, { status: 400 });
  }

  if (normalizeValue(body.website)) {
    return json({ success: true, spam: true });
  }

  const payload = {
    name: normalizeValue(body.name, 200),
    email: normalizeValue(body.email, 320).toLowerCase(),
    company: normalizeValue(body.company, 240),
    interest: normalizeValue(body.interest, 240),
    message: normalizeValue(body.message),
    consent: normalizeValue(body.consent, 40),
    locale: normalizeValue(body.locale, 16),
    page_url: normalizeValue(body.page_url, 1200),
    page_title: normalizeValue(body.page_title, 300),
    submitted_at: normalizeValue(body.submitted_at, 80),
    utm_source: normalizeValue(body.utm_source, 140),
    utm_medium: normalizeValue(body.utm_medium, 140),
    utm_campaign: normalizeValue(body.utm_campaign, 240),
    utm_term: normalizeValue(body.utm_term, 240),
    utm_content: normalizeValue(body.utm_content, 240),
    ip: normalizeValue(request.headers.get("cf-connecting-ip"), 120),
    user_agent: normalizeValue(request.headers.get("user-agent"), 400),
    referer: normalizeValue(request.headers.get("referer"), 1200)
  };

  if (!payload.name || !payload.email || !payload.interest || !payload.consent) {
    return json({ success: false, error: "validation_failed" }, { status: 400 });
  }

  const upstreamResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!upstreamResponse.ok) {
    return json({ success: false, error: "lead_forward_failed" }, { status: 502 });
  }

  return json({ success: true });
}
