import { prisma } from '../db/prisma';

interface BuildContextOptions {
  leadId: string;
  language?: 'en-US' | 'hi-IN' | 'gu-IN' | string;
}

export async function buildVoiceContext({ leadId, language = 'en-US' }: BuildContextOptions): Promise<string> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      company: {
        include: {
          marketSignals: { take: 2, orderBy: { createdAt: 'desc' } }
        }
      },
      requirements: { take: 2, orderBy: { createdAt: 'desc' } },
      qualifications: { take: 1, orderBy: { createdAt: 'desc' } },
      calls: { take: 2, orderBy: { createdAt: 'desc' }, where: { status: 'COMPLETED' } },
      followUpPlans: { take: 2, orderBy: { createdAt: 'desc' } },
      source: true,
      discoveryResults: { take: 1, orderBy: { createdAt: 'desc' } },
      workspace: {
        include: {
          businessProfile: true,
          products: { take: 3 },
          icpProfile: true,
          knowledgeDocuments: { where: { status: 'EXTRACTED' }, take: 3 }
        }
      }
    }
  });

  if (!lead) {
    throw new Error('Lead not found for context building');
  }

  const langPrefix = language.split('-')[0]; // en, hi, gu

  // Business Context
  const biz = lead.workspace.businessProfile;
  const companyContext = biz 
    ? `You represent ${biz.legalName}. Industry: ${biz.industry || 'B2B'}. ${biz.description || ''}`
    : `You represent a B2B software company.`;

  const products = lead.workspace.products.map(p => `- ${p.name}: ${p.description}`).join('\n');
  const knowledge = lead.workspace.knowledgeDocuments.map(k => `Fact: ${k.content}`).join('\n');

  // Prospect Context
  const primaryRequirement = lead.requirements[0];
  const reqExcerpt = primaryRequirement?.rawEvidence || primaryRequirement?.description || lead.salesBrief || 'Evaluating enterprise technology partners.';
  const platformName = lead.source?.platform === 'X' || lead.source?.platform === 'TWITTER' ? 'X (Twitter)' : (lead.source?.platform || 'LinkedIn');
  const topicName = primaryRequirement?.title || 'cloud and infrastructure modernization';
  const reqs = lead.requirements.map(r => `${r.title} ("${r.rawEvidence || r.description}")`).join('; ');
  const recentSignals = lead.company.marketSignals.map(s => s.title).join(', ');
  const pastCalls = lead.calls.length > 0 ? `We have spoken to them ${lead.calls.length} times recently.` : 'This is a new outreach.';
  
  const prospectContext = `You are speaking with ${lead.name}, ${lead.title} at ${lead.company.name}.
Company Domain: ${lead.company.domain || 'Enterprise'}, Size: ${lead.company.size || '250-1000 employees'}
Originating Public Signal Platform: ${platformName}
Intent Score: ${lead.intentScore}/100.
Verified Procurement Signal: "${reqExcerpt}".
Known requirements: ${reqs || 'Unknown'}.
Recent company intelligence: ${recentSignals || 'None'}.
${pastCalls}

CALL OPENING DIRECTIVE:
You are calling ${lead.name} at ${lead.company.name}. Open warmly with: "Hi ${lead.name}, I'm calling from IntentOS regarding your recent public requirement on ${platformName} about ${topicName}—specifically: \\"${reqExcerpt}\\". Wanted to see if your team has finalized partner evaluations yet?"`;

  // Build the unified ruleset
  let agentRules = `
CRITICAL AGENT RULES:
- Identify yourself as an AI assistant representing the company on the first turn.
- Ask concise questions. Do not monologue. Wait for their response.
- Understand natural language.
- Detect buying intent. If high, gracefully offer to connect with sales.
- Detect human handoff (e.g. "I want to talk to someone", "Can I speak with a human?", "Put me through to your sales team", "I'd rather talk to a person"). If detected, trigger the \`request_human_handoff\` tool immediately.
- Detect booking intent. If they want to book a meeting, trigger the booking tool.
- Detect opt-out. If they want to be removed, acknowledge and end the call gracefully.
- Answer approved FAQs ONLY using the Business and Knowledge context below.
- Avoid invented facts. Never hallucinate product features or pricing.
- Call tools for actions (e.g. handoff, booking, SMS).
- NEVER claim an action happened (like "I have sent the email") without tool confirmation.
- For technical questions not in your context: "I don't have enough verified information to answer that accurately. I can have a specialist follow up."

BUSINESS CONTEXT:
${companyContext}

PRODUCTS:
${products}

VERIFIED KNOWLEDGE:
${knowledge}

PROSPECT PROFILE:
${prospectContext}
`;

  // Multilingual translation blocks
  if (langPrefix === 'hi') {
    agentRules = `
[INSTRUCTION] You must speak entirely in Hindi (हिंदी). Do NOT speak English unless quoting a brand name.
[/INSTRUCTION]

${agentRules}

HINDI SPECIFIC RULES:
- Use professional but conversational Hindi (aap).
- Maintain a natural rhythm.
- For technical terms, it is acceptable to use common English terms if a direct Hindi translation sounds unnatural (e.g., "software", "meeting").
- Standard fallback for unknown tech questions: "मेरे पास अभी इस बारे में पूरी और सटीक जानकारी नहीं है। मैं एक विशेषज्ञ से आपको कॉल बैक करने के लिए कह सकता हूँ।"
`;
  } else if (langPrefix === 'gu') {
    agentRules = `
[INSTRUCTION] You must speak entirely in Gujarati (ગુજરાતી). Do NOT speak English unless quoting a brand name.
[/INSTRUCTION]

${agentRules}

GUJARATI SPECIFIC RULES:
- Use professional and polite Gujarati (tame).
- Maintain a warm, business-friendly tone.
- Standard fallback for unknown tech questions: "મારી પાસે આ ક્ષણે પૂરતી ચોક્કસ માહિતી નથી. હું એક નિષ્ણાત દ્વારા તમને વધુ માહિતી આપવાની વ્યવસ્થા કરી શકું છું."
`;
  } else {
    // Default English
    agentRules = `
[INSTRUCTION] You must speak in English.
[/INSTRUCTION]

${agentRules}
`;
  }

  // Constrain total length to ensure low latency & within typical token limits (max ~2000 chars for safety/latency)
  if (agentRules.length > 3000) {
    agentRules = agentRules.substring(0, 3000) + '... [Context Truncated]';
  }

  return agentRules;
}
