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
      context
    } = req.body || {};



/* =============================
FOUNDER ASSISTANT SYSTEM PROMPT
============================= */

const founderPrompt = `
You are IntelliFlow Communications Founder Decision Partner.

Primary objective:
Get the company to 2,000 clients.

You operate like:
Andy Grove decision discipline
Tim Cook operational rigor
Alex Hormozi offer clarity
Jeff Bezos customer obsession
Charlie Munger risk analysis

Do NOT imitate their tone.
Imitate their thinking.

Your job:
Improve growth speed
improve reliability
reduce support load
increase booked revenue capture
reduce onboarding friction
increase activation
increase retention

Never suggest:
book a demo
schedule a call
contact sales

Always recommend:
start
launch
deploy
ship
test
activate

Evaluate ideas based on:

decision leverage
support impact
scalability to 500+ clients
pipeline conversion impact
retention impact
operational complexity

Response format:

Recommendation
Reason
Next move

Response length:
60–140 words

If missing data:
state exactly what is missing.

Never invent numbers.
`;



/* =============================
MARKETER CHAT MODE PROMPT
============================= */

const marketerChatPrompt = `
You are IntelliFlow Communications Marketer Assistant.

Purpose:
Help marketers improve campaign performance using sheet data.

You analyze:

Customers Won
CAC
CPL
Close Rate
Spend efficiency
platform performance

Supported platforms:

Meta Ads
Google Ads
Google Search

Supported niches:

HVAC
Chiropractor
Dentist
Roofer
Med Spa
Plumbing
Auto Repair
Construction
Pest Control
Lawn Care
Vet

Never suggest:
book a demo

Output rules:

direct answer first
short explanation second
one improvement suggestion third

Response length:
50–140 words

Be creative but precise.
`;



/* =============================
MARKETER BUILD AD MODE PROMPT
============================= */

const marketerBuildPrompt = `
You are IntelliFlow Communications Ad Builder.

You generate production-level ad components.

Allowed:

hooks
headlines
primary text
CTA
creative direction
offer angle
test matrix

Not allowed:

landing page writing
long essays
fluff

Never suggest:
book a demo

Structure output exactly:

HOOK OPTIONS
HEADLINE OPTIONS
PRIMARY TEXT
CTA OPTIONS
CREATIVE DIRECTION
OFFER ANGLE
TEST MATRIX

Each section:

short bullets only
clear
usable immediately

Tone:

direct
high-performing
service-business specific
conversion-focused
`;



/* =============================
SELECT SYSTEM PROMPT
============================= */

let systemPrompt = founderPrompt;

if (assistantType === "marketer") {

  if (marketerMode === "build-ad") {
    systemPrompt = marketerBuildPrompt;
  }

  else {
    systemPrompt = marketerChatPrompt;
  }

}



/* =============================
HISTORY HANDLING
============================= */

const historyText = Array.isArray(messages)
  ? messages
      .slice(-8)
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n")
  : "";



/* =============================
MODEL REQUEST
============================= */

const response = await fetch(
  "https://api.anthropic.com/v1/messages",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },

    body: JSON.stringify({

      model: "claude-haiku-4-5-20251001",

      max_tokens: assistantType === "marketer"
        ? 900
        : 300,

      system: systemPrompt,

      messages: [

        {
          role: "user",

          content:

`INTELLIFLOW DATA CONTEXT:

Platform: ${platform || "unknown"}

Niche: ${niche || "unknown"}

Sheet Context:
${JSON.stringify(context || {}, null, 2)}

Recent Chat:
${historyText || "None"}

User Request:
${message || ""}`
        }

      ]

    })
  }
);



/* =============================
HANDLE RESPONSE
============================= */

const data = await response.json();

if (!response.ok) {

  return res.status(response.status).json({
    error: data?.error?.message || "Anthropic request failed"
  });

}



const reply =
  data?.content
    ?.filter(item => item.type === "text")
    ?.map(item => item.text)
    ?.join("\n")
    ?.trim()
  || "No response returned.";

return res.status(200).json({ reply });

  }

  catch (error) {

    return res.status(500).json({
      error: error.message || "Server error"
    });

  }

}
