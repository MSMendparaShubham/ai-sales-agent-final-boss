/**
 * Gemini Intent Parser & Google Search Dork Builder
 * Converts open-ended natural service descriptions into high-precision Google Dorks targeting public LinkedIn posts.
 */

export async function buildSerperDork(userInput: string, location?: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const locFilter = location && location !== 'ALL' && location !== 'All Regions' ? `"${location}"` : '';

  if (!geminiKey) {
    const rawTerms = userInput.split(/\s+/).slice(0, 3).join(' ');
    return `site:linkedin.com/posts/ "${rawTerms}" ("looking for" OR "seeking" OR "vendor" OR "RFP") ${locFilter}`.trim();
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
          // Remove any accidental markdown backticks
          return text.replace(/`/g, '').trim();
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.error('[Gemini Dork Builder Error]:', err);
  }

  const sanitized = userInput.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
  return `site:linkedin.com/posts/ "${sanitized || 'Cloud Modernization'}" ("looking for" OR "seeking" OR "vendor" OR "RFP") ${locFilter}`.trim();
}
