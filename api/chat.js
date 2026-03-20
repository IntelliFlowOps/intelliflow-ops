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
- Never suggest "book a demo" unless explicitly asked.

Response rules:
- Recommendation first.
- Then short reason.
- Then one next move if useful.
- Use only provided context and data.
- Never make up numbers.
- If data is missing, say what is missing in one short sentence.
- Keep responses under 150 words.
- Prefer 60-120 words when possible.
- If asked about budget reallocation, be explicit about what to increase, reduce, pause, or test next.
- If a campaign-specific question is asked, prefer exact campaign/ad name matches from context.
`;

    const buildPlannerSystemPrompt = `
You are IntelliFlow Ad Build Planner.

Your job:
- Help a marketer plan how to build an ad in Canva.
- Do NOT write the full finished ad.
- Do NOT ramble.
- Do NOT use filler.
- Never suggest "book a demo".

Style rules:
- Calm, direct, pain-driven.
- Specific to the niche.
- Useful enough to execute immediately.
- No fake numbers.
- No bloated explanations.

Output rules:
- Keep the total response between 220 and 420 words.
- Be complete, but compact.
- Finish every section cleanly.
- Use short bullets, not long paragraphs.
- If a campaign/ad name is provided, treat it as an exact-match reference if possible.
- This is a build plan, not a final ad.

Return ONLY these sections in this exact order:

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

Formatting rules:
- Each section title must be one line.
- Each section body must be 1-3 short bullets max.
- Canva build steps can be 3-5 bullets max.
- No intro paragraph.
- No closing paragraph.
`;

    const isBuildMode = mode === 'generate_ad' || mode === 'build_plan';

    const systemPrompt = isBuildMode
      ? buildPlannerSystemPrompt
      : founderSystemPrompt;

    const historyText = Array.isArray(history)
      ? history
          .slice(-10)
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
        max_tokens: isBuildMode ? 700 : 300,
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
