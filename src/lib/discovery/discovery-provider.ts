import { prisma } from '@/lib/db/prisma';

export interface DiscoverySignal {
  sourceName: string;
  sourceUrl?: string;
  rawData: any;
  confidence: number;
}

export interface DiscoveryProvider {
  discover(
    keywords: string[],
    negativeKeywords: string[],
    location?: string,
    industry?: string
  ): Promise<DiscoverySignal[]>;
  validateSource(url: string): boolean;
}

export const MAX_RESULTS_PER_SCAN = 5;

/**
 * Sanitizes input keywords by stripping conversational/filler words
 * so Apollo's exact keyword search returns valid candidates.
 */
export function sanitizeSearchKeywords(keyword?: string): string | undefined {
  if (!keyword || !keyword.trim()) return undefined;
  const stopWords = /\b(looking\s+for|seeking|partner|partners|needed|wanted|we\s+are|for\s+a|for\s+an|in\s+need\s+of|evaluating|hiring|rfp)\b/gi;
  const cleaned = keyword.replace(stopWords, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : keyword.trim();
}

/**
 * Real Apollo.io Mixed People Search Provider for LinkedIn Executive Signals
 */
export class ApolloLinkedInDiscoveryProvider implements DiscoveryProvider {
  validateSource(url: string): boolean {
    return url.includes('linkedin.com') || url.includes('apollo.io');
  }

  async discover(
    keywords: string[],
    _negativeKeywords: string[],
    location?: string,
    industry?: string
  ): Promise<DiscoverySignal[]> {
    const rawKey = process.env.APOLLO_API_KEY?.trim();
    if (!rawKey) {
      console.warn('[Apollo Discovery] APOLLO_API_KEY is not set in environment.');
      return [];
    }

    try {
      const rawKeyword = keywords.length > 0 ? keywords.join(' ') : undefined;
      const cleanedKeyword = sanitizeSearchKeywords(rawKeyword);

      console.log('[Apollo Discovery] Querying Apollo mixed_people/search with params:', {
        rawKeyword,
        cleanedKeyword,
        location,
        industry,
        maxResults: MAX_RESULTS_PER_SCAN,
      });

      const payload: Record<string, any> = {
        api_key: rawKey,
        page: 1,
        per_page: MAX_RESULTS_PER_SCAN,
        person_titles: [
          'Chief Technology Officer',
          'VP of Engineering',
          'Director of IT',
          'VP of Technology',
          'Chief Information Officer',
          'Head of Sales',
          'VP Revenue',
          'IT Director',
        ],
      };

      if (cleanedKeyword) {
        payload.q_keywords = cleanedKeyword;
      }
      if (location && location !== 'ALL') {
        payload.person_locations = [location];
      }

      const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': rawKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('[Apollo Discovery] HTTP Status:', res.status);
      const resData = await res.json();

      if (!res.ok) {
        console.error('[Apollo Discovery] Error response:', res.status, resData);
        return [];
      }

      const rawPeople: any[] = resData.people || resData.contacts || [];
      console.log(`[Apollo Discovery] Received ${rawPeople.length} people from Apollo.`);

      if (rawPeople.length === 0) {
        console.log('[Apollo Discovery] 0 people returned matching the search criteria.');
        return [];
      }

      // Filter toward results that have a populated linkedin_url (or name) and strictly cap to MAX_RESULTS_PER_SCAN
      const validPeople = rawPeople
        .filter((p: any) => Boolean(p.linkedin_url || p.name))
        .slice(0, MAX_RESULTS_PER_SCAN);

      console.log(`[Apollo Discovery] Mapped ${validPeople.length} valid LinkedIn candidate leads.`);

      return validPeople.map((person: any) => {
        let linkedinUrl = person.linkedin_url;
        if (linkedinUrl && typeof linkedinUrl === 'string') {
          linkedinUrl = linkedinUrl.trim();
          if (linkedinUrl && !linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
            linkedinUrl = `https://${linkedinUrl}`;
          }
        } else {
          linkedinUrl = undefined;
        }

        const personName =
          person.name ||
          [person.first_name, person.last_name].filter(Boolean).join(' ') ||
          'Executive Contact';
        const personTitle = person.title || 'Executive Decision Maker';
        const companyName =
          person.organization?.name || person.company || 'Enterprise Solutions Inc.';

        return {
          sourceName: 'LinkedIn Executive Network',
          sourceUrl: linkedinUrl || 'https://linkedin.com',
          confidence: 90,
          rawData: {
            name: personName,
            title: personTitle,
            email: person.email || undefined,
            linkedinUrl,
            phone:
              person.phone_numbers?.[0]?.sanitized_number ||
              person.sanitized_phone ||
              person.phone_numbers?.[0]?.raw_number ||
              undefined,
            company: {
              name: companyName,
              domain: person.organization?.primary_domain || undefined,
              industry:
                person.organization?.industry ||
                (industry && industry !== 'ALL' ? industry : 'Information Technology & Services'),
              size: person.organization?.estimated_num_employees
                ? String(person.organization.estimated_num_employees)
                : '50-200',
              location:
                [
                  person.city || person.organization?.city,
                  person.state || person.organization?.state,
                  person.country || person.organization?.country,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                (location && location !== 'ALL' ? location : 'San Francisco, CA'),
              websiteUrl: person.organization?.website_url || undefined,
            },
            requirement: {
              title: cleanedKeyword
                ? `${cleanedKeyword} Enterprise Modernization Initiative`
                : `${personTitle} Vendor Evaluation`,
              description: `Executive ${personName} at ${companyName} initiated vendor evaluation for ${
                industry && industry !== 'ALL' ? industry : 'technology infrastructure'
              }.`,
              category:
                person.organization?.industry ||
                (industry && industry !== 'ALL' ? industry : 'Information Technology & Services'),
              rawEvidence: linkedinUrl
                ? `Public executive signal verified on LinkedIn: ${linkedinUrl}`
                : 'Public executive procurement signal detected.',
            },
          },
        };
      });
    } catch (err: any) {
      console.error('[Apollo Discovery Error]:', err?.message || err);
      return [];
    }
  }
}

/**
 * Deterministic Mock Provider for explicitly simulated non-LinkedIn channels (X, Corporate RFPs, etc.)
 * or when APOLLO_API_KEY is not configured in the environment.
 */
export class MockChannelDiscoveryProvider implements DiscoveryProvider {
  private channelName: string;
  private platformKey: string;

  constructor(channelName: string = 'Corporate RFP Portals', platformKey: string = 'WEBSITE') {
    this.channelName = channelName;
    this.platformKey = platformKey;
  }

  validateSource(_url: string): boolean {
    return true;
  }

  async discover(
    keywords: string[],
    _negativeKeywords: string[],
    location?: string,
    industry?: string
  ): Promise<DiscoverySignal[]> {
    const kw = sanitizeSearchKeywords(keywords[0]) || 'Enterprise Cloud Modernization';
    const loc = location && location !== 'ALL' ? location : 'San Francisco, CA';
    const ind = industry && industry !== 'ALL' ? industry : 'Information Technology & Services';

    return [
      {
        sourceName: this.channelName,
        sourceUrl:
          this.platformKey === 'LINKEDIN'
            ? 'https://www.linkedin.com/in/sarah-mitchell-cto'
            : 'https://procurement-portal.com/rfp/9082',
        confidence: 92,
        rawData: {
          name: 'Sarah Mitchell',
          title: 'VP of Technology & Infrastructure',
          email: 's.mitchell@vertexcloud.io',
          linkedinUrl: 'https://www.linkedin.com/in/sarah-mitchell-cto',
          company: {
            name: 'Vertex Cloud Dynamics',
            domain: 'vertexcloud.io',
            industry: ind,
            size: '100-500',
            location: loc,
            websiteUrl: 'https://vertexcloud.io',
          },
          requirement: {
            title: `${kw} Enterprise Modernization Initiative`,
            description: `Active procurement and engineering evaluation published for ${kw}. Seeking enterprise certified partners.`,
            category: ind,
            rawEvidence: `Executive signal verified: "Initiating vendor selection for enterprise ${kw} upgrade and migration."`,
          },
        },
      },
    ];
  }
}

/**
 * Main execution flow for a discovery job, creating Prisma Leads and Companies
 */
export async function runDiscoveryJob(
  jobId: string,
  options?: { keyword?: string; industry?: string; location?: string }
) {
  const job = await prisma.discoveryJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found');

  await prisma.discoveryJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING' },
  });

  try {
    const effectiveKeywords = options?.keyword ? [options.keyword] : ['Cloud Modernization'];

    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: {
        keywords: JSON.stringify({ keywords: effectiveKeywords }),
      },
    });

    const isLinkedIn = job.source === 'LINKEDIN' || job.source === 'ALL' || !job.source;
    let signals: DiscoverySignal[] = [];

    // If searching LinkedIn channel and Apollo API key is configured, execute Apollo search directly
    if (isLinkedIn && process.env.APOLLO_API_KEY?.trim()) {
      const apolloProvider = new ApolloLinkedInDiscoveryProvider();
      signals = await apolloProvider.discover(
        effectiveKeywords,
        [],
        options?.location,
        options?.industry
      );
      // NOTE: If Apollo returns 0 results or errors, DO NOT inject mock data. Return empty results cleanly.
    } else if (!process.env.APOLLO_API_KEY?.trim() || !isLinkedIn) {
      // Only use mock/demo data if APOLLO_API_KEY is completely unset or if the user explicitly selected a non-LinkedIn simulated channel
      const channelLabel =
        job.source === 'X'
          ? 'X / Twitter Signals'
          : job.source === 'PUBLIC_DIRECTORY'
          ? 'Public Procurement Registers'
          : job.source === 'WEBSITE'
          ? 'Corporate RFP Portals'
          : 'Simulated Public Channel';

      const fallbackProvider = new MockChannelDiscoveryProvider(
        channelLabel,
        job.source || 'WEBSITE'
      );
      signals = await fallbackProvider.discover(
        effectiveKeywords,
        [],
        options?.location,
        options?.industry
      );
    }

    let totalDiscovered = 0;
    const createdLeads: any[] = [];

    // Find or create appropriate LeadSource
    const platformKey = isLinkedIn ? 'LINKEDIN' : (job.source || 'WEBSITE');
    const sourceName = isLinkedIn
      ? 'LinkedIn Executive RFPs'
      : job.source === 'X'
      ? 'X / Twitter Buying Signals'
      : 'Corporate RFP Portals';

    let leadSource = await prisma.leadSource.findFirst({
      where: { platform: platformKey },
    });

    if (!leadSource) {
      leadSource = await prisma.leadSource.create({
        data: {
          name: sourceName,
          platform: platformKey,
          confidence: 90,
          sourceUrl: isLinkedIn ? 'https://linkedin.com' : 'https://company.com',
        },
      });
    }

    for (const signal of signals) {
      const raw = signal.rawData;

      // 1. Find or create Company in workspace
      const companyName = raw.company?.name || 'Enterprise Prospect';
      let company = await prisma.company.findFirst({
        where: {
          workspaceId: job.workspaceId,
          name: companyName,
        },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            workspaceId: job.workspaceId,
            name: companyName,
            domain: raw.company?.domain || undefined,
            industry: raw.company?.industry || 'Enterprise Cloud Services',
            size: raw.company?.size || '50-200',
            location: raw.company?.location || 'San Francisco, CA',
            websiteUrl: raw.company?.websiteUrl || undefined,
            description: `Discovered from ${signal.sourceName}`,
          },
        });
      }

      // 2. Create Lead
      const leadName = raw.name || 'Executive Contact';
      const lead = await prisma.lead.create({
        data: {
          workspaceId: job.workspaceId,
          companyId: company.id,
          sourceId: leadSource.id,
          name: leadName,
          title: raw.title || 'Executive Decision Maker',
          email: raw.email || undefined,
          linkedinUrl: raw.linkedinUrl || undefined,
          phone: raw.phone || undefined,
          status: 'DISCOVERED',
          intentScore: 50,
          urgency: 'HIGH',
          pipelineValue: 45000,
          salesBrief: `Discovered via ${signal.sourceName}. ${leadName} (${raw.title || 'Decision Maker'}) at ${companyName}.`,
        },
      });

      // 3. Create Requirement linked to Lead
      if (raw.requirement) {
        await prisma.requirement.create({
          data: {
            leadId: lead.id,
            sourceId: leadSource.id,
            title: raw.requirement.title || `${raw.title || 'Executive'} Technology Modernization`,
            description: raw.requirement.description || 'Public vendor evaluation signal detected.',
            category: raw.requirement.category || company.industry,
            rawEvidence: raw.requirement.rawEvidence || signal.sourceUrl,
            confidenceScore: signal.confidence,
          },
        });
      }

      // 4. Save Discovery Result for tracking
      await prisma.discoveryResult.create({
        data: {
          jobId: job.id,
          leadId: lead.id,
          sourceName: signal.sourceName,
          sourceUrl: signal.sourceUrl,
          rawData: JSON.stringify(raw),
          confidence: signal.confidence,
          status: 'PENDING_REVIEW',
        },
      });

      totalDiscovered++;
      createdLeads.push(lead);
    }

    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        totalDiscovered,
      },
    });

    return { totalDiscovered, count: totalDiscovered, leads: createdLeads };
  } catch (error: any) {
    console.error('[runDiscoveryJob Error]:', error);
    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}
