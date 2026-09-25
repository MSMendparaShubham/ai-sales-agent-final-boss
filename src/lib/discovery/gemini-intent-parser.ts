/**
 * Gemini Intent Parser & Multi-Channel Google Search Dork Builder
 * Converts open-ended natural service descriptions into high-precision Google Dorks
 * targeting public LinkedIn posts, X / Twitter posts, and corporate RFP portals.
 */

export async function buildSerperDork(
  userInput: string,
  location?: string,
  channel?: string
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const locFilter = location && location !== 'ALL' && location !== 'All Regions' ? `"${location}"` : '';
  const normalizedChannel = (channel || 'LINKEDIN').toUpperCase();

  const cleanInput = userInput.trim() || 'Enterprise Cloud Modernization';
  const cleanTerms = cleanInput.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 3).join(' ') || 'Cloud Modernization';

  // Direct fast path or fallback for X / Twitter
  if (normalizedChannel === 'TWITTER' || normalizedChannel === 'X') {
    if (!geminiKey) {
      return `(site:x.com OR site:twitter.com) "${cleanTerms}" ("looking for" OR "seeking" OR "need recommendations" OR "vendor" OR "hiring agency") ${locFilter}`.trim();
    }

    try {
      const prompt = `You are a B2B sales intelligence engine.
The user describes what service they provide or what clients they target:
"${userInput}"

Extract 1-2 core keywords (e.g. "SharePoint migration", "cloud security", "SOC 2").
Construct a high-precision Google Search query targeting public X/Twitter tweets where founders, CTOs, or buyers are seeking vendors, recommendations, or agency partners.
Strict format: (site:x.com OR site:twitter.com) "KEYWORD" ("looking for" OR "seeking" OR "need recommendations" OR "vendor" OR "hiring agency") ${locFilter}

Return ONLY the raw search string. No markdown fences, no commentary.`;

      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
        'gemini-3-flash-preview',
        'gemini-flash-latest',
        'gemini-3.8-flash',
      ];

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          });

          const text = response.text?.trim();
          if (text && (text.includes('site:x.com') || text.includes('site:twitter.com'))) {
            return text.replace(/`/g, '').trim();
          }
        } catch {
          continue;
        }
      }
    } catch (err) {
      console.error('[Gemini Twitter Dork Builder Error]:', err);
    }

    return `(site:x.com OR site:twitter.com) "${cleanTerms}" ("looking for" OR "seeking" OR "need recommendations" OR "vendor" OR "hiring agency") ${locFilter}`.trim();
  }

  // Direct fast path or fallback for Corporate RFP Portals
  if (normalizedChannel === 'WEBSITE') {
    return `("RFP" OR "Request for Proposal" OR "vendor procurement" OR "seeking vendor") "${cleanTerms}" ${locFilter}`.trim();
  }

  // LinkedIn or ALL
  if (!geminiKey) {
    return `site:linkedin.com/posts/ "${cleanTerms}" ("looking for" OR "seeking" OR "vendor" OR "RFP") ${locFilter}`.trim();
  }

  const prompt = `You are a B2B sales intelligence engine. 
The user describes what service they provide or what clients they target:
"${userInput}"

Extract the 2-3 most critical technology or service terms.
Construct a high-precision Google Search query targeting public LinkedIn posts where buyers, directors, or VPs are asking for vendors, help, recommendations, or posting an RFP.
Strict format: site:linkedin.com/posts/ ("TERM1" OR "TERM2") ("looking for" OR "seeking" OR "recommendations" OR "RFP" OR "vendor") ${locFilter}

Return ONLY the raw search string. No markdown fences, no commentary.`;

  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text?.trim();
        if (text && text.includes('site:linkedin.com/posts/')) {
          return text.replace(/`/g, '').trim();
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.error('[Gemini LinkedIn Dork Builder Error]:', err);
  }

  return `site:linkedin.com/posts/ "${cleanTerms}" ("looking for" OR "seeking" OR "vendor" OR "RFP") ${locFilter}`.trim();
}
