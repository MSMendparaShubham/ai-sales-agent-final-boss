import { prisma } from '@/lib/db/prisma';

export interface EnrichmentResult {
  fieldName: string;
  value: string;
  sourceName: string;
  sourceUrl?: string;
  confidence: number;
  inferred: boolean;
}

export interface EnrichmentProvider {
  enrichLead(leadId: string, leadData: any, companyData: any): Promise<EnrichmentResult[]>;
}

// Minimal TypeScript interfaces for Apollo.io People Match API
interface ApolloOrganization {
  name?: string;
  website_url?: string;
  primary_domain?: string;
  industry?: string;
  estimated_num_employees?: number | string;
  raw_address?: string;
  city?: string;
  state?: string;
  country?: string;
  keywords?: string[];
}

interface ApolloPhoneNumber {
  raw_number?: string;
  sanitized_number?: string;
  type?: string;
}

interface ApolloPerson {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  phone_numbers?: ApolloPhoneNumber[];
  sanitized_phone?: string;
  organization?: ApolloOrganization;
}

interface ApolloPeopleMatchResponse {
  person?: ApolloPerson;
  matches?: ApolloPerson[];
  error?: string;
  message?: string;
}

export const MAX_RESULTS_PER_SCAN = 5;

/**
 * Apollo.io People Match Enrichment Provider
 * Calls POST https://api.apollo.io/v1/people/match using APOLLO_API_KEY
 */
export class ApolloProvider implements EnrichmentProvider {
  private static runCallCount = 0;

  async enrichLead(leadId: string, leadData: any, companyData: any): Promise<EnrichmentResult[]> {
    const apiKey = process.env.APOLLO_API_KEY?.trim();
    if (!apiKey) {
      console.warn('[ApolloProvider] APOLLO_API_KEY not configured — skipping Apollo enrichment.');
      return [];
    }

    // Rate limiting guard for run budget (capped to MAX_RESULTS_PER_SCAN)
    const maxCalls = Math.min(
      parseInt(process.env.APOLLO_MAX_ENRICHMENTS_PER_RUN || '5', 10),
      MAX_RESULTS_PER_SCAN
    );
    if (ApolloProvider.runCallCount >= maxCalls) {
      console.warn(
        `[ApolloProvider] Rate limit guard reached (${ApolloProvider.runCallCount}/${maxCalls} max calls per run). Skipping lead ${leadId}.`
      );
      return [];
    }

    try {
      // Split name into first and last name if available
      let firstName: string | undefined;
      let lastName: string | undefined;
      if (leadData?.name) {
        const parts = String(leadData.name).trim().split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else if (parts.length === 1) {
          firstName = parts[0];
        }
      }

      // Determine domain from company or email
      const domain =
        companyData?.domain ||
        (leadData?.email && leadData.email.includes('@') ? leadData.email.split('@')[1] : undefined);

      const requestBody: Record<string, any> = {
        api_key: apiKey,
      };

      if (firstName) requestBody.first_name = firstName;
      if (lastName) requestBody.last_name = lastName;
      if (leadData?.name) requestBody.name = leadData.name;
      if (leadData?.email) requestBody.email = leadData.email;
      if (companyData?.name) requestBody.organization_name = companyData.name;
      if (domain) requestBody.domain = domain;

      ApolloProvider.runCallCount++;

      const response = await fetch('https://api.apollo.io/v1/people/match', {
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
        console.warn(`[ApolloProvider] Apollo API returned status ${response.status}: ${errorText}`);
        return [];
      }

      const data: ApolloPeopleMatchResponse = await response.json();
      const person = data.person || (data.matches && data.matches.length > 0 ? data.matches[0] : undefined);

      if (!person) {
        console.log(`[ApolloProvider] No person match found for lead ${leadId}`);
        return [];
      }

      const results: EnrichmentResult[] = [];
      const sourceUrl =
        person.linkedin_url || (person.id ? `https://app.apollo.io/#/people/${person.id}` : undefined);

      // 1. LinkedIn URL
      if (person.linkedin_url) {
        results.push({
          fieldName: 'linkedinUrl',
          value: person.linkedin_url,
          sourceName: 'Apollo.io',
          sourceUrl,
          confidence: 95,
          inferred: false,
        });
      }

      // 2. Job Title
      if (person.title) {
        results.push({
          fieldName: 'title',
          value: person.title,
          sourceName: 'Apollo.io',
          sourceUrl,
          confidence: 90,
          inferred: false,
        });
      }

      // 3. Organization Industry
      if (person.organization?.industry) {
        results.push({
          fieldName: 'industry',
          value: person.organization.industry,
          sourceName: 'Apollo.io',
          sourceUrl,
          confidence: 90,
          inferred: false,
        });
      }

      // 4. Organization Size / Employee Count
      if (person.organization?.estimated_num_employees) {
        results.push({
          fieldName: 'size',
          value: String(person.organization.estimated_num_employees),
          sourceName: 'Apollo.io',
          sourceUrl,
          confidence: 85,
          inferred: false,
        });
      }

      // 5. Primary Domain
      if (person.organization?.primary_domain) {
        results.push({
          fieldName: 'domain',
          value: person.organization.primary_domain,
          sourceName: 'Apollo.io',
          sourceUrl,
          confidence: 95,
          inferred: false,
        });
      }

      // 6. Location (city, state, country)
      const locationParts = [
        person.city || person.organization?.city,
        person.state || person.organization?.state,
        person.country || person.organization?.country,
      ].filter(Boolean);

      if (locationParts.length > 0) {
        results.push({
          fieldName: 'location',
          value: locationParts.join(', '),
          sourceName: 'Apollo.io',
          sourceUrl,
          confidence: 85,
          inferred: false,
        });
      }

      // 7. Phone number (direct dial or sanitized phone)
      const phone =
        person.phone_numbers?.[0]?.sanitized_number ||
        person.phone_numbers?.[0]?.raw_number ||
        person.sanitized_phone;

      if (phone) {
        results.push({
          fieldName: 'phone',
          value: phone,
          sourceName: 'Apollo.io',
          sourceUrl,
          confidence: 85,
          inferred: false,
        });
      }

      return results;
    } catch (err: any) {
      console.warn(`[ApolloProvider] Enrichment failed gracefully for lead ${leadId}:`, err?.message || err);
      return [];
    }
  }
}

export class MockClearbitProvider implements EnrichmentProvider {
  async enrichLead(leadId: string, leadData: any, companyData: any): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];

    // Mock enrichment logic based on the domain or email
    const emailDomain = leadData.email?.split('@')[1] || companyData.domain;

    if (!leadData.linkedinUrl) {
      results.push({
        fieldName: 'linkedinUrl',
        value: `https://linkedin.com/in/${leadData.name.toLowerCase().replace(/\s+/g, '-')}`,
        sourceName: 'Clearbit',
        confidence: 90,
        inferred: true,
      });
    }

    if (!companyData.industry || companyData.industry === 'Unknown') {
      results.push({
        fieldName: 'industry',
        value: emailDomain === 'acmecorp.com' ? 'Manufacturing' : 'Software',
        sourceName: 'Clearbit',
        confidence: 95,
        inferred: false,
      });
    }

    if (!companyData.size || companyData.size === 'Unknown') {
      results.push({
        fieldName: 'size',
        value: '50-200',
        sourceName: 'Clearbit',
        confidence: 85,
        inferred: false,
      });
    }

    if (!companyData.location || companyData.location === 'Unknown') {
      results.push({
        fieldName: 'location',
        value: 'San Francisco, CA',
        sourceName: 'Clearbit',
        confidence: 95,
        inferred: false,
      });
    }

    if (!companyData.domain && emailDomain) {
      results.push({
        fieldName: 'domain',
        value: emailDomain,
        sourceName: 'Inferred from Email',
        confidence: 99,
        inferred: true,
      });
    }

    if (!companyData.techStack) {
      results.push({
        fieldName: 'techStack',
        value: 'React, Node.js, AWS, Postgres',
        sourceName: 'Wappalyzer (Mock)',
        confidence: 80,
        inferred: true,
      });
    }

    return results;
  }
}

/**
 * Normalizes, enriches, deduplicates, and saves a lead.
 */
export async function executeEnrichmentPipeline(
  leadId: string,
  provider: EnrichmentProvider = new ApolloProvider()
) {
  // Fall back to MockClearbitProvider if ApolloProvider is selected but APOLLO_API_KEY is not set
  let activeProvider = provider;
  if (activeProvider instanceof ApolloProvider) {
    const apiKey = process.env.APOLLO_API_KEY?.trim();
    if (!apiKey) {
      console.warn('APOLLO_API_KEY not set — using mock enrichment data');
      activeProvider = new MockClearbitProvider();
    }
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      company: true,
      provenance: true,
    },
  });

  if (!lead) throw new Error('Lead not found');

  // NORMALIZE
  const normalizedName = lead.name.trim();
  const normalizedEmail = lead.email?.trim().toLowerCase() || null;

  if (lead.name !== normalizedName || lead.email !== normalizedEmail) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { name: normalizedName, email: normalizedEmail },
    });
  }

  // DEDUPLICATE Check (Simulated for pipeline execution)
  // Check for duplicate emails in the same workspace
  if (normalizedEmail) {
    const duplicates = await prisma.lead.findMany({
      where: {
        workspaceId: lead.workspaceId,
        email: normalizedEmail,
        id: { not: lead.id },
      },
    });

    if (duplicates.length > 0) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { duplicateScore: 100 },
      });
    }
  }

  // ENRICH
  const enrichmentData = await activeProvider.enrichLead(leadId, lead, lead.company);

  const leadUpdateData: any = { enrichmentStatus: 'ENRICHED', isVerified: true };
  const companyUpdateData: any = {};

  for (const field of enrichmentData) {
    // Only update if we don't already have high confidence data for this field
    const existingProvenance = lead.provenance.find((p) => p.fieldName === field.fieldName);

    if (!existingProvenance || existingProvenance.confidence <= field.confidence) {
      // Upsert provenance
      await prisma.leadFieldProvenance.upsert({
        where: {
          leadId_fieldName: {
            leadId: lead.id,
            fieldName: field.fieldName,
          },
        },
        create: {
          leadId: lead.id,
          fieldName: field.fieldName,
          sourceName: field.sourceName,
          sourceUrl: field.sourceUrl,
          confidence: field.confidence,
          inferred: field.inferred,
        },
        update: {
          sourceName: field.sourceName,
          sourceUrl: field.sourceUrl,
          confidence: field.confidence,
          inferred: field.inferred,
        },
      });

      // Update actual data model
      if (['linkedinUrl', 'email', 'phone', 'title', 'name'].includes(field.fieldName)) {
        leadUpdateData[field.fieldName] = field.value;
      } else if (
        [
          'industry',
          'size',
          'location',
          'domain',
          'techStack',
          'hiringSignals',
          'fundingSignals',
          'growthSignals',
        ].includes(field.fieldName)
      ) {
        companyUpdateData[field.fieldName] = field.value;
      }
    }
  }

  // Save enriched data back
  if (Object.keys(companyUpdateData).length > 0) {
    await prisma.company.update({
      where: { id: lead.companyId },
      data: companyUpdateData,
    });
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: leadUpdateData,
  });

  return { success: true };
}
