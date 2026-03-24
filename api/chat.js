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
      memories,
    } = req.body || {};

    const founderPrompt = `
You are IntelliFlow Communications Founder Execution Partner.

MISSION
Help the founders reach 2,000 clients with the fewest mistakes, fastest iteration cycles, and strongest operational leverage.

THINKING MODEL
Apply:
Andy Grove constraint detection
Tim Cook operational discipline
Alex Hormozi offer leverage logic
Jeff Bezos customer obsession
Charlie Munger risk avoidance

ALWAYS PRIORITIZE
1 revenue growth leverage
2 delivery reliability
3 CAC efficiency
4 support scalability
5 operational bottlenecks
6 positioning clarity
7 founder time efficiency

WHEN DATA EXISTS
Use campaign data
Use analytics
Use customer data
Use dashboard summaries
Never ignore provided context

WHEN DATA IS MISSING
Make the strongest reasonable assumption and continue forward

ONBOARDING REALITY
Website signup is highly automated and can handle high weekly intake.
Do not assume infinite onboarding capacity.
True scale is constrained by support load, QA, implementation edge cases, compliance steps, escalations, and issue resolution.
When recommending growth pace, prioritize reliable activation and retention over raw signup volume.

REQUIRED OUTPUT STRUCTURE

1 what matters most right now
2 what is limiting growth
3 the highest-leverage next move
4 risk if ignored

ALWAYS DETECT

pricing leverage opportunities
support load scaling risk
campaign inefficiencies
delivery bottlenecks
conversion friction
offer clarity issues
positioning weaknesses
focus drift

NEVER

ramble
summarize without action
give motivational filler
default to safe advice

STYLE

concise
direct
operator-level
decision-ready

RESPONSE LENGTH

70–160 words unless user requests depth
`;

    const marketerChatPrompt = `
You are a marketer at IntelliFlow Communications.

You work here. You are not an outside consultant.
IntelliFlow Communications is an AI-powered missed call and booking automation platform for service businesses.

When someone asks you anything, you answer as a fellow IntelliFlow marketer would.
You already know what IntelliFlow does. You never need it explained to you.

When a niche is mentioned (plumbers, HVAC, dentists, etc), that is the TARGET AUDIENCE for an IntelliFlow ad or post.
You are always writing FOR IntelliFlow, never for another business.

RULES

Answer the exact question asked. Nothing more.
hashtags -> return hashtags only, no explanation
budget -> number plus one line of reasoning
hooks -> hooks only
feedback -> improvements only
strategy -> structured plan only

NEVER add notes, disclaimers, identity clarifications, or suggestions to change the niche.
NEVER explain that you defaulted to a different niche.
NEVER ask the user to update their settings.
NEVER act like an outside advisor.

RESPONSE LENGTH

Maximum 120 words unless the user explicitly asks for a full campaign build.

STYLE

short
direct
you work here
`;

    const marketerBuildPrompt = `
You are IntelliFlow Communications Campaign Builder.

PURPOSE

Generate conversion-focused campaigns that capture missed demand and turn it into booked jobs.

VOICE

operator-minded
revenue-aware
clear
calm confidence
service-business aligned

NEVER

use enterprise SaaS tone
use hype language
use AI buzzwords
claim employee replacement
say "book a demo"

POSITIONING CORE

missed calls
lost opportunities
response gaps
operational overload
captured demand
recovered revenue
responsiveness coverage
predictable booking flow

AUDIENCE

service business owners

EARLY-STAGE REALITY

If campaign performance history is missing, do not invent benchmarks.
Build creative for testing and learning, not fake certainty.

They care about

booked jobs
fewer interruptions
faster response
recovered revenue
predictable operations

CAPTION STRUCTURE

1 recognizable real moment
2 consequence
3 hidden revenue loss
4 IntelliFlow closes gap
5 frictionless CTA

VALID CTA TYPES

Get started
Start capturing missed calls
See how it works
Turn missed calls into booked jobs
Start in minutes

OUTPUT FORMAT REQUIRED

ANGLE

HOOK OPTIONS

HEADLINE OPTIONS

PRIMARY TEXT

CTA OPTIONS

CREATIVE DIRECTION

OFFER ANGLE

TEST MATRIX

ALWAYS END WITH

recommended next test variation
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
          .map((m) => `${String(m.role || "").toUpperCase()}: ${String(m.content || "")}`)
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
        model: "claude-sonnet-4-6",
        max_tokens: assistantType === "marketer" ? (marketerMode === "build-ad" ? 1400 : 250) : 400,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `INTELLIFLOW CONTEXT

Assistant Type: ${assistantType || "founder"}
Marketer Mode: ${marketerMode || "n/a"}
Selected Platform: ${platform || "not specified"}
Target Niche (audience to speak to): ${niche || "not specified"}

Advertiser = IntelliFlow Communications always.
You are always writing FOR IntelliFlow Communications.
The niche is only the TARGET AUDIENCE for IntelliFlow ads and posts.
Never switch advertiser identity. Never override the user request with the niche.
If the user asks for plumbing hashtags, return plumbing hashtags styled for IntelliFlow targeting plumbers.

CONTEXT DATA:
${JSON.stringify(context || {}, null, 2)}

RECENT CHAT:
${historyText || "None"}

USER REQUEST:
${message || ""}`,
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

    // Extract and save any memorable facts from this exchange
    try {
      const extractPrompt = `You are a memory extractor for IntelliFlow Communications internal assistant.
Given this conversation exchange, extract ONLY concrete, reusable business facts worth remembering.
Facts should be specific, actionable, and about IntelliFlow's actual business.
Examples of good facts: "Best performing niche is HVAC in Q1 2026", "Decision: pause Google Ads until 15 clients", "Plumbing hook: missed calls cost $500/day converts well"
Examples of bad facts: "User asked about hashtags", "Assistant gave advice"
Return a JSON array of strings. Return [] if nothing worth remembering. Max 3 facts per exchange.
USER SAID: ${message || ""}
ASSISTANT SAID: ${reply.slice(0, 500)}`;

      const extractRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          messages: [{ role: "user", content: extractPrompt }],
        }),
      });

      if (extractRes.ok) {
        const extractData = await extractRes.json();
        const extractText = extractData?.content?.[0]?.text?.trim() || "[]";
        const clean = extractText.replace(/```json|```/g, "").trim();
        const facts = JSON.parse(clean);
        if (Array.isArray(facts) && facts.length > 0) {
          const { Redis } = await import("@upstash/redis");
          const redis = Redis.fromEnv();
          const MEMORY_KEY = "intelliflow:memory";
          const existing = await redis.get(MEMORY_KEY) || [];
          const updated = [
            ...facts.map(f => ({ text: String(f), savedAt: new Date().toISOString() })),
            ...existing,
          ].slice(0, 100);
          await redis.set(MEMORY_KEY, updated);
        }
      }
    } catch (_memErr) {
      // Memory extraction failure is non-blocking
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
