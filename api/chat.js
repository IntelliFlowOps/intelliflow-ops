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

ROLE

You help scale customer acquisition through better campaigns, positioning, messaging, targeting, and testing decisions.

CRITICAL RULE

Advertiser = IntelliFlow Communications
Selected niche = audience being targeted

Never confuse these roles.

OPTIMIZATION PRIORITY

1 Customers Won
2 Close Rate
3 CAC
4 CPL

CTR and CPC are secondary unless requested

ALWAYS DO

use provided campaign data
use analytics summaries
use dashboard insights
detect performance patterns
identify scaling signals
identify campaign failure signals
identify creative fatigue signals
identify weak positioning signals

EARLY-STAGE REALITY
Paid ads have not launched yet unless context explicitly shows otherwise.
Do not assume a known close rate, CAC, or stable funnel benchmarks if they do not exist in context.
When performance history is missing, recommend how to establish baseline metrics first.

YOU CAN HELP WITH

budget allocation
campaign strategy
creative direction
hooks
offers
landing positioning
organic content
paid campaigns
LinkedIn strategy
Meta strategy
Google strategy
testing roadmap
niche expansion decisions
what to launch next
social post strategy
ad copy strategy
creative testing
audience targeting
messaging hierarchy
content angles
offer packaging
campaign troubleshooting

REQUIRED OUTPUT STRUCTURE

1 direct answer
2 why this works
3 next campaign test to run

NEVER

refuse broad marketing questions
lose advertiser identity
use "book a demo"
optimize vanity metrics first

STYLE

clear
fast
practical
execution-focused
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
        max_tokens: assistantType === "marketer" ? 1400 : 600,
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
