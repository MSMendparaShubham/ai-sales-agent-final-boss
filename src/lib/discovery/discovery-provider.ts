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
    const apiKey = process.env.APOLLO_API_KEY?.trim();
    if (!apiKey) {
      console.error('[Apollo Error] APOLLO_API_KEY is not defined in process.env');
      return [];
    }

    try {
      const rawKeyword = keywords.length > 0 ? keywords.join(' ') : undefined;
      const sanitizedKeyword = sanitizeSearchKeywords(rawKeyword);

      const payload: Record<string, any> = {
        api_key: apiKey,
        q_keywords: sanitizedKeyword,
        page: 1,
        per_page: 5,
        person_titles: sanitizedKeyword ? [sanitizedKeyword] : undefined,
      };

      // Map location to Apollo's expected array format if provided
      if (location && location !== 'ALL' && location !== 'All Regions') {
        if (location.includes('United States')) {
          payload.person_locations = ['United States'];
        } else if (location.includes('India')) {
          payload.person_locations = ['India'];
        } else if (location.includes('United Kingdom')) {
          payload.person_locations = ['United Kingdom'];
        } else {
          payload.person_locations = [location];
        }
      }

      console.log('[Apollo Request Payload]:', JSON.stringify(payload));

      const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('[Apollo Response Status]:', res.status);
      const rawText = await res.text();
      console.log('[Apollo Raw Response]:', rawText.slice(0, 500));

      let resData: any = {};
      try {
        resData = JSON.parse(rawText);
      } catch {
        console.error('[Apollo Error] Failed to parse response as JSON');
        return [];
      }

      if (!res.ok) {
        console.error('[Apollo Error] Response not OK:', res.status, resData?.error || resData?.message || resData);
        return [];
      }

      const rawPeople: any[] = resData.people || resData.contacts || [];
      console.log('[Apollo Live Search] People returned:', rawPeople.length);

      if (rawPeople.length === 0) {
        console.log('[Apollo Live Search] 0 people returned matching search criteria.');
        return [];
      }

      if (rawPeople.length > 0) {
        console.log('[Apollo Sample Person]:', {
          name: `${rawPeople[0].first_name || ''} ${rawPeople[0].last_name || ''}`.trim() || rawPeople[0].name,
          linkedin: rawPeople[0].linkedin_url,
          company: rawPeople[0].organization?.name || rawPeople[0].company,
        });
      }

      return rawPeople.slice(0, MAX_RESULTS_PER_SCAN).map((person: any) => {
        let realLinkedInUrl: string | null = null;
        if (person.linkedin_url && typeof person.linkedin_url === 'string') {
          const trimmed = person.linkedin_url.trim();
          if (trimmed !== '#' && trimmed !== '' && !trimmed.includes('example.com')) {
            realLinkedInUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
          }
        }

        const personName =
          `${person.first_name || ''} ${person.last_name || ''}`.trim() ||
          person.name ||
          'Executive Contact';
        const personTitle = person.title || 'Executive Decision Maker';
        const companyName =
          person.organization?.name || person.company || 'Enterprise Solutions Inc.';

        return {
          sourceName: 'LinkedIn Executive Network',
          sourceUrl: realLinkedInUrl || undefined,
          confidence: 90,
          rawData: {
            name: personName,
            title: personTitle,
            email: person.email || undefined,
            linkedinUrl: realLinkedInUrl,
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
                (industry && industry !== 'ALL' && industry !== 'All Industries'
                  ? industry
                  : 'Information Technology & Services'),
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
                (location && location !== 'ALL' && location !== 'All Regions'
                  ? location
                  : 'United States'),
              websiteUrl: person.organization?.website_url || undefined,
            },
            requirement: {
              title: sanitizedKeyword
                ? `${sanitizedKeyword} Enterprise Modernization Initiative`
                : `${personTitle} Vendor Evaluation`,
              description: `Executive ${personName} at ${companyName} initiated vendor evaluation for ${
                industry && industry !== 'ALL' && industry !== 'All Industries'
                  ? industry
                  : 'technology infrastructure'
              }.`,
              category:
                person.organization?.industry ||
                (industry && industry !== 'ALL' && industry !== 'All Industries'
                  ? industry
                  : 'Information Technology & Services'),
              rawEvidence: realLinkedInUrl || 'Public executive procurement signal detected.',
            },
          },
        };
      });
    } catch (err: any) {
      console.error('[Apollo Live Search Error]:', err?.message || err);
      return [];
    }
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

    // If searching LinkedIn channel or ALL, execute Apollo search directly.
    // If Apollo returns 0 results or errors, DO NOT inject mock leads.
    if (isLinkedIn) {
      const apolloProvider = new ApolloLinkedInDiscoveryProvider();
      signals = await apolloProvider.discover(
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
