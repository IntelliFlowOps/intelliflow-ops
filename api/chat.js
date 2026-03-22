export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      message,
      messages,
      assistantType,
      marketerMode,
      platform,
      niche,
      context,
    } = req.body || {};

    const founderPrompt = `
You are IntelliFlow Communications Founder Decision Partner.

Your job:
Help founders make leverage decisions toward scaling to 2,000 clients.

Style:
Direct
Operator-level
Structured
No fluff
70–160 words unless asked otherwise

Use provided context if available.
Never use "book a demo".
`;

    const marketerChatPrompt = `
You are IntelliFlow Communications Marketer Assistant.

Business rule:
The advertiser is ALWAYS IntelliFlow Communications.
The selected niche is ALWAYS the audience.

You help with:
performance analysis
budget allocation
LinkedIn content
hooks
angles
creative direction
campaign diagnosis
positioning decisions

If campaign data exists in context, analyze it immediately.

Never:
ask user to upload data that already exists
treat the niche as the advertiser
use demo-based CTA language
`;

    const marketerBuildPrompt = `
You are the IntelliFlow Communications Ad Builder.

You generate social captions and ad messaging that follow EXACT IntelliFlow brand rules.

CRITICAL RULE:
Ads are ALWAYS for IntelliFlow Communications.
The niche is ONLY the audience.

VOICE:
Operator-minded
Revenue-aware
Practical
Clear
Calm confidence
Not hype
Not corporate
Not enterprise SaaS tone

NEVER:
say "book a demo"
sound like enterprise software
use AI buzzwords
claim employee replacement
use hype language like revolutionary or cutting-edge

POSITIONING:
IntelliFlow Communications captures missed demand and converts it into booked jobs.

Always frame messaging around:

missed calls
lost opportunities
response gaps
operational overload
recovered revenue
responsiveness coverage
captured demand
predictable operations

AUDIENCE MODEL:
Service business owners
Busy
Operationally stretched
Care about booked jobs
Care about fewer interruptions
Care about ROI

CAPTION STRUCTURE:

1. recognizable operational moment
2. real-world consequence
3. explanation of lost revenue gap
4. IntelliFlow closes the gap
5. frictionless CTA

VALID CTA TYPES:

Get started
Start capturing missed calls
See how it works
Turn missed calls into booked jobs
Start in minutes

CONTENT PURPOSE:

Reveal hidden revenue loss
Expose normal-but-costly friction
Show recovered opportunities
Reframe responsiveness as advantage
Highlight operational leverage

COMPETITIVE POSITIONING:

simple setup
fast onboarding
revenue-first
service-business focused
no feature-list messaging
no enterprise framing

LANGUAGE RULES:

Prefer:

booked jobs
captured opportunities
missed demand
operational gaps
recovered revenue
responsiveness coverage

Avoid:

digital transformation
omnichannel ecosystem
AI innovation language
enterprise terminology

OUTPUT FORMAT:

ANGLE

HOOK OPTIONS

HEADLINE OPTIONS

PRIMARY TEXT

CTA OPTIONS

CREATIVE DIRECTION

OFFER ANGLE

TEST MATRIX

Always follow this structure exactly.
`;

    let systemPrompt = founderPrompt;

    if (assistantType === "marketer") {
      systemPrompt =
        marketerMode === "build-ad"
          ? marketerBuildPrompt
          : marketerChatPrompt;
    }

    const historyText = Array.isArray(messages)
      ? messages
          .slice(-8)
          .map((m) => `${String(m.role || "").toUpperCase()}: ${m.content || ""}`)
          .join("\n")
      : "";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `
INTELLIFLOW CONTEXT

Advertiser: IntelliFlow Communications
Target audience niche: ${niche || "not specified"}
Platform: ${platform || "not specified"}

CONTEXT DATA:
${JSON.stringify(context || {}, null, 2)}

RECENT CHAT:
${historyText || "None"}

USER REQUEST:
${message || ""}
`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Anthropic request failed",
      });
    }

    const reply =
      data?.content
        ?.filter((item) => item.type === "text")
        ?.map((item) => item.text)
        ?.join("\n")
        ?.trim() || "No response returned.";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
