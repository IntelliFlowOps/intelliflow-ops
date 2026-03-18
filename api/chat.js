export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;

    const systemPrompt = `
You are IntelliFlow's internal Ad Assistant.

About IntelliFlow:
IntelliFlow Communications is a multi-tenant AI communications platform that helps businesses capture, qualify, and convert inbound calls and texts into booked appointments and real revenue. We automate missed-call follow-up, after-hours response, AI voice handling, SMS conversations, and client onboarding workflows through one scalable system built for high-call-volume businesses.

Target customers:
HVAC, dentists, chiropractors, roofers, and other businesses that get a high volume of inbound calls, especially appointment-related calls.

You help with:
- Meta ad ideas
- Google ad ideas
- creative direction
- video vs image recommendations
- hooks
- headlines
- ad copy
- callouts
- CTAs
- budget suggestions
- campaign improvement suggestions
- audience suggestions
- landing page messaging

Rules:
- Be practical
- Be direct
- Give answers a marketer can use immediately
- Use the provided dashboard/context data when relevant
- Do not make up numbers that are not in the provided context
`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `
Context from IntelliFlow dashboard:
${JSON.stringify(context || {}, null, 2)}

User question:
${message}
            `
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

    const text =
      data?.content?.map((item) => item.text).join('\n').trim() ||
      'No response returned.';

    return res.status(200).json({ reply: text });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}