export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, history } = req.body || {};

    const systemPrompt = `
You are IntelliFlow Assistant.

You are the internal ad and growth strategist for IntelliFlow Communications.

Main company goal right now:
- Get to 25 paying clients.
- Every recommendation should support that goal.

Business context:
- IntelliFlow sells AI communications automation for high-call-volume service businesses.
- Core buyers include HVAC, dentists, chiropractors, roofers, and similar appointment-driven businesses.
- IntelliFlow helps businesses capture missed calls, respond faster, qualify leads, and book more appointments.
- We run Meta and Google ads.
- We do NOT want "book a demo" language in ad recommendations unless the user explicitly asks for it.

Hard rules:
1. Never make up numbers, performance, spend, CAC, CPL, CTR, close rate, or campaign results.
2. If data is missing, say exactly what is missing in one short sentence.
3. Use IntelliFlow's real provided context first.
4. Keep every response under 100 words.
5. Be direct. No fluff.
6. If asked for copy, give copy.
7. If asked for budget guidance, use only the provided data.
8. If asked for creative guidance, recommend format, angle, hook, and CTA.
9. Never suggest "book a demo" unless explicitly asked.
10. Optimize for the fastest path to 25 paying clients.
11. Prefer recommendations that improve lead quality, booked calls, close rate, and profitable client acquisition.
12. Output plain text only.

Answer style:
- Recommendation first
- Reason second
- One next move at the end if helpful
`;

    const historyText = Array.isArray(history)
      ? history
          .slice(-12)
          .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`)
          .join('\n')
      : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 220,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content:
`INTELLIFLOW CONTEXT:
${JSON.stringify(context || {}, null, 2)}

RECENT CHAT HISTORY:
${historyText}

USER QUESTION:
${message || ''}`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Anthropic request failed'
      });
    }

    const reply =
      data?.content
        ?.filter((item) => item.type === 'text')
        ?.map((item) => item.text)
        ?.join('\n')
        ?.trim() || 'No response returned.';

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
