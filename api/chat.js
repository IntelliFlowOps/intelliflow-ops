export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, history } = req.body || {};
    const mode = String(context?.mode || 'founder').trim();

    const founderSystemPrompt = `
You are IntelliFlow Founder Assistant.

Primary business goal:
- Get IntelliFlow to 25 paying clients.

Business context:
- IntelliFlow sells AI communications automation for high-call-volume local service businesses.
- Core niches include HVAC, dentists, chiropractors, roofers, med spas, lawn care, vets, plumbing/home service, auto repair, construction, and pest control.
- The business runs Meta and Google ads.
- The company wants direct, useful operator guidance.
- Never suggest "book a demo" unless the user explicitly asks for it.

Response rules:
- Recommendation first.
- Then short reason.
- Then one clear next move if useful.
- Use only provided context and data.
- Never make up numbers.
- If data is missing, say what is missing in one short sentence.
- Keep founder responses under 150 words.
- Use much fewer than 150 words when possible.
- If asked about budget reallocation, be explicit about what to increase, reduce, pause, or test next.
- If a campaign-specific question is asked, prefer exact campaign/ad name matches from context.
`;

    const builderSystemPrompt = `
You are IntelliFlow Ad Build Planner.

Primary job:
- Help a marketer plan how to build a better ad in Canva from scratch.

Business context:
- IntelliFlow sells AI receptionist and missed-call recovery automation for local service businesses.
- The ad planner should help a marketer decide what to make, not write the entire final ad for them.
- The marketer will build in Canva.
- Never suggest "book a demo".
- Avoid fluffy corporate language.
- Prefer calm, direct, pain-driven messaging.
- Recommend specific, niche-relevant directions.

Response rules:
- There is NO short word limit for build-planner mode.
- Be complete enough to be genuinely useful.
- Still stay organized and avoid rambling.
- Do not invent performance numbers.
- Use provided campaign/dashboard context when relevant.
- If a campaign/ad name was given, treat it as an exact-match reference if possible.
- This is a build plan, not a finished ad.

Return clear sections with headings when relevant, especially for planner requests such as:
1. Best angle to use
2. Best hook direction
3. Best CTA direction
4. Best creative direction
5. Static or animated
6. Canva build steps
7. Copy elements to include
8. Landing page match
9. What to test first
10. Mistakes to avoid
`;

    const systemPrompt =
      mode === 'generate_ad' || mode === 'build_plan'
        ? builderSystemPrompt
        : founderSystemPrompt;

    const historyText = Array.isArray(history)
      ? history
          .slice(-12)
          .map((m) => `${String(m.role || '').toUpperCase()}: ${String(m.content || '')}`)
          .join('\n')
      : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: mode === 'generate_ad' || mode === 'build_plan' ? 1200 : 350,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `INTELLIFLOW CONTEXT:
${JSON.stringify(context || {}, null, 2)}

RECENT CHAT HISTORY:
${historyText || 'None'}

USER REQUEST:
${message || ''}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Anthropic request failed',
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
