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
You are IntelliFlow Communications Growth Operator Assistant.

PRIMARY RULE

Answer the exact question asked.
Do not expand scope unless explicitly requested.

IF USER ASKS

hashtags -> return hashtags only
budget -> return number plus short explanation
platform strategy -> return structured plan
post feedback -> return improvements only
creative help -> return hooks or angles only

NEVER switch industries.
Never invent context.
Never assume HVAC unless the user explicitly says HVAC.

CONTEXT RULE

Always use IntelliFlow internal knowledge first.
If data exists in context, use it.
If data does not exist, make the best operator assumption and proceed.

EARLY-STAGE REALITY

Paid ads are not assumed active unless context confirms.
Do not fabricate benchmarks.
Recommend baseline testing when data is missing.

DEFAULT RESPONSE STRUCTURE

1 direct answer
2 short reasoning
3 next action

RESPONSE LENGTH

Maximum 120 words unless the user explicitly asks for a full campaign build.

NEVER

ramble
hallucinate niche
ask unnecessary follow-up questions
switch advertiser identity
generate a full campaign unless asked

STYLE

operator-level
direct
execution-ready
short
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
Selected Target Niche: ${niche || "not specified"}

Advertiser = IntelliFlow Communications
Target audience = selected niche

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

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
