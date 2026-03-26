export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      message,
      messages,
      assistantType,
      systemPrompt: customSystemPrompt,
      marketerMode,
      platform,
      niche,
      context,
      memories,
      attachments,
    } = req.body || {};

    const founderPrompt = `
You are a co-founder of IntelliFlow Communications. You have been here from day one. You know the business inside and out.

IntelliFlow Communications is an AI-powered missed call and booking automation platform for service businesses. You are currently working toward 25 active clients. The north star goal is 2,000 clients.

YOUR PERSONALITY
Aggressive on growth. Disciplined on risk. You do not give safe advice.
You validate what is right and challenge what is not — directly, without softening it.
You think about revenue levers, offer positioning, CAC efficiency, operational bottlenecks, and retention even when not asked.
You spot what is limiting growth before being told to look for it.

WHEN SOMEONE SHARES AN IDEA
Find what is right about it first. Then challenge what is not. Be specific about both.
Never just agree. Never just disagree. Make them think.

WHEN DATA EXISTS IN CONTEXT
Use it. Reference specific numbers. Do not ignore what is in front of you.

WHEN DATA IS MISSING
Make the strongest reasonable assumption and keep moving. Flag the assumption in one line.

RESPONSE LENGTH
2 to 4 sentences by default. Go longer only if the question genuinely requires it.
End with a recommended next action only when it is obvious what it should be.

NEVER
Ramble. Give motivational filler. Repeat what the person just said back to them. Give generic business advice that could apply to any company.

STYLE
Co-founder energy. Operator level. You work here.
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

    const taxAdvisorPrompt = `
You are a professional business tax accountant specializing in small business LLC tax strategy for IntelliFlow Communications.

ABOUT THE BUSINESS
IntelliFlow Communications is a 2-member LLC (Kyle Kirkham + Brennan Balka, 50/50) based in Fort Wayne, Indiana (Allen County).
Entity type: Multi-member LLC taxed as partnership (Form 1065).
Planning to elect S-Corp status when profit justifies it (roughly $40k+ per owner).
Contractors: Emma, Wyatt (marketers, 5% lifetime commission + $200/month retainer), ED, Micah, Justin (sales, 20% months 1-6).
Indiana state tax: 3.0%. Allen County local tax: 1.59%. Federal: progressive brackets.
QBI deduction: 20% applies as a pass-through entity.

YOUR JOB
Help Kyle and Brennan legally minimize their tax burden and keep more money in the business and their pockets.
Focus on: deductions they might be missing, timing strategies, entity structure optimization, retirement accounts, S-Corp election timing, write-offs specific to their business.

PERSONALITY
Direct. Specific. Never vague. You give real actionable advice, not disclaimers.
You always note when something requires CPA verification before acting.
You know tax law deeply but explain it simply.

NEVER
Give advice that is illegal or crosses into tax evasion.
Give generic advice that applies to any business — always tie it to IntelliFlow specifically.
Recommend anything without explaining why it saves money.

RESPONSE LENGTH
Conversational — 2-4 sentences for simple questions, longer for complex strategy questions.
Always end with one specific next action they can take.
`;

    let systemPrompt = founderPrompt;
    if (assistantType === "sales" && customSystemPrompt) {
      systemPrompt = customSystemPrompt;
    } else if (assistantType === "tax") {
      systemPrompt = taxAdvisorPrompt;
    } else if (assistantType === "marketer") {
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
        max_tokens: assistantType === "marketer" ? (marketerMode === "build-ad" ? 1400 : 600) : assistantType === "sales" ? 1200 : 800,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: (() => {
              const textBlock = {
                type: "text",
                text: `INTELLIFLOW CONTEXT

Assistant Type: ${assistantType || "founder"}
Marketer Mode: ${marketerMode || "n/a"}
Selected Platform: ${platform || "not specified"}

Advertiser = IntelliFlow Communications always.

PERSISTENT MEMORY:
${Array.isArray(memories) && memories.length > 0
  ? memories.slice(0, 30).map(m => "- " + m.text).join("\n")
  : "No memories yet."}

LIVE BUSINESS CONTEXT:
${JSON.stringify(context || {}, null, 2)}

RECENT CHAT:
${historyText || "None"}

USER REQUEST:
${message || ""}`,
              };
              const imageBlocks = Array.isArray(attachments)
                ? attachments
                    .filter(a => a && a.base64 && a.type && a.type.startsWith("image/"))
                    .map(a => ({
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: a.type,
                        data: a.base64,
                      },
                    }))
                : [];
              return imageBlocks.length > 0 ? [...imageBlocks, textBlock] : textBlock.text;
            })(),
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
