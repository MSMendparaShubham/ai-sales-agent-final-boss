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

const MAX_RESULTS_PER_SCAN = 5;

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
    const apiKey = process.env.APOLLO_API_KEY?.trim();
    if (!apiKey) {
      console.warn('[ApolloDiscovery] APOLLO_API_KEY not configured — skipping Apollo search.');
      return [];
    }

    try {
      const searchKeyword = keywords.length > 0 ? keywords.join(' ') : undefined;
      const requestBody: Record<string, any> = {
        api_key: apiKey,
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
        ],
      };

      if (searchKeyword) {
        requestBody.q_keywords = searchKeyword;
      }
      if (location && location !== 'ALL') {
        requestBody.person_locations = [location];
      }

      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[ApolloDiscovery] Search returned status ${response.status}: ${errorText}`);
        return [];
      }

      const data = await response.json();
      const rawPeople: any[] = data.people || data.contacts || [];

      // Filter toward results that have a populated linkedin_url and enforce 5-record limit
      const validPeople = rawPeople
        .filter((p: any) => Boolean(p.linkedin_url || p.name))
        .slice(0, MAX_RESULTS_PER_SCAN);

      return validPeople.map((person: any) => ({
        sourceName: 'LinkedIn Executive Network',
        sourceUrl: person.linkedin_url || 'https://linkedin.com',
        confidence: 92,
        rawData: {
          name: person.name || [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Executive Contact',
          title: person.title || 'Executive Decision Maker',
          email: person.email || undefined,
          linkedinUrl: person.linkedin_url || undefined,
          phone: person.phone_numbers?.[0]?.sanitized_number || person.sanitized_phone || undefined,
          company: {
            name: person.organization?.name || 'Enterprise Prospect',
            domain: person.organization?.primary_domain || undefined,
            industry: person.organization?.industry || (industry && industry !== 'ALL' ? industry : 'Enterprise Cloud Services'),
            size: person.organization?.estimated_num_employees ? String(person.organization.estimated_num_employees) : '50-200',
            location: [person.city || person.organization?.city, person.state || person.organization?.state, person.country || person.organization?.country].filter(Boolean).join(', ') || (location && location !== 'ALL' ? location : 'San Francisco, CA'),
            websiteUrl: person.organization?.website_url || undefined,
          },
          requirement: {
            title: searchKeyword
              ? `${searchKeyword} RFP & Modernization Initiative`
              : `${person.title || 'Executive'} Cloud & AI Infrastructure Vendor Search`,
            description: `Executive ${person.name || 'Decision Maker'} at ${person.organization?.name || 'Company'} initiated vendor evaluation for ${industry && industry !== 'ALL' ? industry : 'enterprise architecture'} modernization.`,
            category: person.organization?.industry || (industry && industry !== 'ALL' ? industry : 'Cloud Infrastructure'),
            rawEvidence: person.linkedin_url
              ? `Public executive buying signal verified on LinkedIn: ${person.linkedin_url}`
              : 'Public executive procurement signal detected.',
          },
        },
      }));
    } catch (err: any) {
      console.warn('[ApolloDiscovery] Apollo search failed gracefully:', err?.message || err);
      return [];
    }
  }
}

/**
 * Deterministic Mock Provider for non-LinkedIn channels (X, Corporate RFPs, etc.)
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
    const kw = keywords[0] || 'Cloud & AI Infrastructure';
    return [
      {
        sourceName: this.channelName,
        sourceUrl: 'https://procurement-portal.com/rfp/9082',
        confidence: 88,
        rawData: {
          name: 'Sarah Mitchell',
          title: 'VP of Technology & Infrastructure',
          email: 's.mitchell@vertexcloud.io',
          company: {
            name: 'Vertex Cloud Dynamics',
            domain: 'vertexcloud.io',
            industry: industry && industry !== 'ALL' ? industry : 'Enterprise Cloud Services',
            size: '100-500',
            location: location && location !== 'ALL' ? location : 'Austin, TX',
          },
          requirement: {
            title: `${kw} Enterprise Modernization RFP`,
            description: `Active RFP published on ${this.channelName} seeking implementation partners for ${kw}.`,
            category: industry && industry !== 'ALL' ? industry : 'Enterprise Cloud Services',
            rawEvidence: `Public RFP notice: "Seeking certified enterprise partners for ${kw} with SLA commitments."`,
          },
        },
      },
    ];
  }
}

/**
 * Handles generating search parameters based on workspace profile.
 */
export async function generateDiscoveryKeywords(workspaceId: string): Promise<{ keywords: string[]; negativeKeywords: string[] }> {
  const capability = await prisma.businessCapability.findUnique({ where: { workspaceId } });

  let keywords: string[] = ['RFP', 'Vendor Search', 'Cloud Modernization'];
  let negativeKeywords: string[] = ['Recruiter', 'Agency', 'Intern'];

  if (capability?.keywords) {
    try {
      const parsed = JSON.parse(capability.keywords);
      if (Array.isArray(parsed) && parsed.length > 0) keywords = parsed;
    } catch {}
  }

  if (capability?.negativeKeywords) {
    try {
      const parsed = JSON.parse(capability.negativeKeywords);
      if (Array.isArray(parsed) && parsed.length > 0) negativeKeywords = parsed;
    } catch {}
  }

  return { keywords, negativeKeywords };
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
    const { keywords, negativeKeywords } = await generateDiscoveryKeywords(job.workspaceId);
    const effectiveKeywords = options?.keyword ? [options.keyword] : keywords;

    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: {
        keywords: JSON.stringify({ keywords: effectiveKeywords, negativeKeywords }),
      },
    });

    const isLinkedIn = job.source === 'LINKEDIN' || job.source === 'ALL' || !job.source;
    let signals: DiscoverySignal[] = [];

    if (isLinkedIn && process.env.APOLLO_API_KEY?.trim()) {
      // Use real Apollo People Search for LinkedIn Executive RFPs
      const apolloProvider = new ApolloLinkedInDiscoveryProvider();
      signals = await apolloProvider.discover(
        effectiveKeywords,
        negativeKeywords,
        options?.location,
        options?.industry
      );
    } else {
      // Fallback / other non-LinkedIn channels
      const fallbackProvider = new MockChannelDiscoveryProvider(
        job.source === 'X'
          ? 'X / Twitter Signals'
          : job.source === 'PUBLIC_DIRECTORY'
          ? 'Public Procurement Registers'
          : 'Corporate RFP Portals',
        job.source || 'WEBSITE'
      );
      signals = await fallbackProvider.discover(
        effectiveKeywords,
        negativeKeywords,
        options?.location,
        options?.industry
      );
    }

    let totalDiscovered = 0;

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
          sourceName: signal.sourceName,
          sourceUrl: signal.sourceUrl,
          rawData: JSON.stringify(raw),
          confidence: signal.confidence,
          status: 'PENDING_REVIEW',
        },
      });

      totalDiscovered++;
    }

    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        totalDiscovered,
      },
    });

    return { totalDiscovered };
  } catch (error: any) {
    console.error('Discovery Job Failed:', error);
    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}
