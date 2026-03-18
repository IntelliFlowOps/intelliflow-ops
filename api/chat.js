export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, history } = req.body || {};

    const systemPrompt = `
You are IntelliFlow Assistant.

Main goal:
Get to 25 paying clients.

Business:
- IntelliFlow sells AI communications automation for high-call-volume service businesses.
- We target HVAC, dentists, chiropractors, roofers, and similar businesses.
- We run Meta and Google ads.
- Never suggest "book a demo" unless explicitly asked.

Hard rules:
- Never make up numbers.
- Use only provided context.
- If data is missing, say what is missing in one short sentence.
- Keep answers under 100 words.
- Recommendation first. Reason second. One next move if useful.
`;

    const historyText = Array.isArray(history)
      ? history.slice(-10).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
      : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
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
