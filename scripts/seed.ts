import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth/auth';
import {
  SEED_COMPANIES,
  HERO_REQUIREMENT,
  RAW_SAMPLE_REQUIREMENTS,
} from '../src/data/demo/seed-data';

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Pat', 'Casey', 'Riley', 'Avery',
  'Logan', 'Cameron', 'Dakota', 'Reese', 'Skyler', 'Kendall', 'Harper', 'Peyton', 'Quinn', 'Rowan',
  'Devon', 'Finley', 'Hayden', 'Emerson', 'Sawyer', 'Adrian', 'Elliott', 'Sydney', 'Jesse', 'Kai'
];

const LAST_NAMES = [
  'Chen', 'Patel', 'Smith', 'Vance', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark'
];

const TECH_CATEGORIES = [
  'Cloud Infrastructure Modernization',
  'Cybersecurity & Zero Trust',
  'Enterprise Data Integration & ETL',
  'AI & Machine Learning Pipelines',
  'Legacy System Migration',
  'SaaS & API Orchestration',
  'Customer Experience & Voice Automation',
  'Compliance & Risk Analytics',
  'Industrial IoT & Telemetry',
  'DevSecOps & Kubernetes Orchestration'
];

const PLATFORMS = [
  { platform: 'LINKEDIN', name: 'LinkedIn Executive Network', url: 'https://linkedin.com' },
  { platform: 'X', name: 'X / Twitter Buying Signals', url: 'https://x.com' },
  { platform: 'WEBSITE', name: 'Corporate Career & RFP Portals', url: 'https://company.com' },
  { platform: 'PUBLIC_DIRECTORY', name: 'Public Procurement Registers', url: 'https://procurement.gov' },
  { platform: 'FREELANCE_PLATFORM', name: 'Enterprise Contract RFP Boards', url: 'https://upwork.com/enterprise' },
];

async function signUpUser(email: string, name: string, role: string, avatarUrl?: string) {
  const mockRequest = new Request("http://localhost/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email, password: "password123", name }),
    headers: { "Content-Type": "application/json" }
  });
  const res = await auth.handler(mockRequest);
  const data = await res.json();
  if (!data.user) {
    throw new Error(`Failed to create user ${email}: ${JSON.stringify(data)}`);
  }
  
  // Update custom fields manually via Prisma since better auth signup doesn't easily expose this in the handler without config
  await prisma.user.update({
    where: { id: data.user.id },
    data: { role, avatarUrl }
  });
  
  return data.user;
}

export async function runSeed() {
  console.log('🌱 Starting IntentOS deterministic seed...');

  // Clean previous data
  await prisma.transcript.deleteMany();
  await prisma.call.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.marketSignal.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.leadSource.deleteMany();
  await prisma.company.deleteMany();
  await prisma.businessCapability.deleteMany();
  await prisma.icpProfile.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.product.deleteMany();
  
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Default Workspace & Profile
  const workspace = await prisma.workspace.create({
    data: {
      name: 'IntentOS Enterprise Workspace',
      businessProfile: {
        create: {
          legalName: 'IntentOS, Inc.',
          websiteUrl: 'https://intentos.ai',
          domain: 'intentos.ai',
          industry: 'Enterprise Software & AI',
          description: 'Autonomous public intent discovery and AI-guided qualification engine.',
          headquarters: 'San Francisco, CA',
          targetGeographies: 'North America, EMEA',
        }
      },
      icpProfile: {
        create: {
          targetIndustries: JSON.stringify(['Enterprise Cloud Services', 'Financial Technology']),
          companySize: '200+ employees',
          geographies: 'North America, Remote',
          decisionMakers: 'CTOs, VPs of Engineering, IT Directors',
          technologies: 'Legacy Infrastructure, Cloud Migration',
          buyingSignals: 'RFPs, Modernization Budgets',
          excludedIndustries: 'Consumer Retail',
        }
      }
    }
  });

  // 1b. Create Default Users via Better Auth API
  const user = await signUpUser(
    'alex.morgan@intentos.ai',
    'Alex Morgan',
    'SALES_MANAGER',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  const voiceAgentUser = await signUpUser(
    'nova.voice@intentos.ai',
    'Nova AI Voice Agent',
    'VOICE_OPERATOR'
  );

  // Link users to workspace
  await prisma.workspaceMember.createMany({
    data: [
      { userId: user.id, workspaceId: workspace.id, role: 'SALES_MANAGER' },
      { userId: voiceAgentUser.id, workspaceId: workspace.id, role: 'VOICE_OPERATOR' },
    ]
  });

  // 2. Create Products
  await prisma.product.createMany({
    data: [
      {
        workspaceId: workspace.id,
        name: 'IntentOS Intelligence Suite',
        description: 'Autonomous public buying intent discovery and AI-guided qualification engine.',
        targetAudience: 'Enterprise B2B Sales & Revenue Teams',
        priceRange: '$24,000 - $120,000/yr',
        valueProps: 'Automated intent discovery, real-time public RFP enrichment, Voice AI qualification.',
      },
      {
        workspaceId: workspace.id,
        name: 'IntentOS Voice Outreach Copilot',
        description: 'Sub-second conversational voice agent for outbound requirement validation.',
        targetAudience: 'Inside Sales & SDR Teams',
        priceRange: '$12,000 - $60,000/yr',
        valueProps: 'Zero-latency voice qualification, automated CRM sync, live sentiment extraction.',
      },
    ],
  });

  // 3. Create LeadSources
  const createdSources: Record<string, any> = {};
  for (const src of PLATFORMS) {
    const sourceRecord = await prisma.leadSource.create({
      data: {
        name: src.name,
        platform: src.platform,
        sourceUrl: src.url,
        confidence: 88 + (src.platform.length % 10),
      },
    });
    createdSources[src.platform] = sourceRecord;
  }

  // 4. Create Companies & Insights
  const companyMap = new Map<string, any>();
  for (const compData of SEED_COMPANIES) {
    const comp = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: compData.name,
        domain: compData.domain,
        industry: compData.industry,
        size: compData.size,
        location: compData.location,
        description: compData.description,
        techStack: compData.techStack,
        hiringSignals: compData.hiringSignals,
        fundingSignals: compData.fundingSignals,
        growthSignals: compData.growthSignals,
      },
    });
    companyMap.set(comp.name, comp);

    if (comp.name === 'TechNova Solutions') {
      await prisma.marketSignal.createMany({
        data: [
          { companyId: comp.id, type: 'HIRING', title: 'Job Posting: Senior SharePoint Migration Architect', details: 'Active recruitment for senior architect', confidence: 96, source: 'LinkedIn Jobs' },
        ],
      });
    } else {
      await prisma.marketSignal.createMany({
        data: [
          { companyId: comp.id, type: 'HIRING', title: `Aggressive hiring in engineering`, details: compData.hiringSignals, confidence: 92, source: 'LinkedIn Jobs' },
        ],
      });
    }
  }

  // 5. Create Campaigns
  const campaignNames = [
    'Enterprise SharePoint & M365 Migration',
    'SOC2 & FedRAMP Cloud Compliance',
    'Healthcare FHIR Interoperability Q3',
    'FinTech Low-Latency Settlement Brokers',
    'IoT Cold-Chain Telemetry Rollout',
  ];

  const createdCampaigns: any[] = [];
  for (let i = 0; i < campaignNames.length; i++) {
    const camp = await prisma.campaign.create({
      data: {
        workspaceId: workspace.id,
        name: campaignNames[i],
        targetAudience: `CTOs & VP Engineering in ${SEED_COMPANIES[i % SEED_COMPANIES.length].industry}`,
        status: i < 3 ? 'ACTIVE' : 'COMPLETED',
        objective: `Qualify and book executive discovery meetings.`,
        channels: 'Voice AI, Targeted Email, LinkedIn',
      },
    });
    createdCampaigns.push(camp);
  }

  // 6. Create Hero Opportunity
  // 6. Create Hero Opportunity
  const heroCompany = companyMap.get('TechNova Solutions')!;
  const linkedinSource = createdSources['LINKEDIN'];

  const heroLead = await prisma.lead.create({
    data: {
      workspaceId: workspace.id,
      name: HERO_REQUIREMENT.contactName,
      title: HERO_REQUIREMENT.contactTitle,
      email: 'john.doe@technova.com',
      phone: '+919925276760',
      linkedinUrl: 'https://linkedin.com/in/johndoe-technova',
      companyId: heroCompany.id,
      sourceId: linkedinSource.id,
      campaignId: createdCampaigns[0].id,
      status: HERO_REQUIREMENT.status,
      intentScore: HERO_REQUIREMENT.intentScore,
      urgency: HERO_REQUIREMENT.urgency,
      qualificationScore: HERO_REQUIREMENT.qualificationScore,
      pipelineValue: HERO_REQUIREMENT.pipelineValue,
      salesBrief: HERO_REQUIREMENT.salesBrief,
      discoveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.requirement.create({
    data: {
      leadId: heroLead.id,
      sourceId: linkedinSource.id,
      title: HERO_REQUIREMENT.requirementTitle,
      description: HERO_REQUIREMENT.description,
      category: HERO_REQUIREMENT.category,
      tags: JSON.stringify(HERO_REQUIREMENT.tags),
      budgetEstimate: HERO_REQUIREMENT.budgetEstimate,
      timeframe: HERO_REQUIREMENT.timeframe,
      rawEvidence: HERO_REQUIREMENT.rawEvidence,
      confidenceScore: 96,
    },
  });

  await prisma.qualification.create({
    data: {
      leadId: heroLead.id,
      budgetFit: HERO_REQUIREMENT.budgetFit,
      authorityFit: HERO_REQUIREMENT.authorityFit,
      needFit: HERO_REQUIREMENT.needFit,
      timingFit: HERO_REQUIREMENT.timingFit,
      overallScore: HERO_REQUIREMENT.qualificationScore,
      status: 'QUALIFIED',
    },
  });

  await prisma.recommendation.create({
    data: {
      leadId: heroLead.id,
      actionType: HERO_REQUIREMENT.recommendationAction,
      title: HERO_REQUIREMENT.recommendationTitle,
      rationale: HERO_REQUIREMENT.recommendationRationale,
      priority: 'HIGH',
      suggestedChannel: 'Voice AI',
      suggestedMessage: 'Hi John, following up on your search for a certified partner.',
    },
  });

  // 6b. Seed All Additional Demo Leads & Requirements
  console.log('Seeding additional enterprise opportunities and leads...');
  const allCreatedLeads = [heroLead];

  for (let i = 0; i < RAW_SAMPLE_REQUIREMENTS.length; i++) {
    const rawReq = RAW_SAMPLE_REQUIREMENTS[i];
    const company = companyMap.get(rawReq.companyName) || heroCompany;
    const source = createdSources[rawReq.platform] || linkedinSource;
    const campaign = createdCampaigns[i % createdCampaigns.length];

    const leadEmail = `${rawReq.contactName.toLowerCase().replace(/[^a-z]/g, '.') || 'contact'}@${company.domain}`;
    const leadPhone = `+1 (555) ${100 + i * 17}-${1000 + i * 37}`;

    const lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        name: rawReq.contactName,
        title: rawReq.contactTitle,
        email: leadEmail,
        phone: leadPhone,
        linkedinUrl: `https://linkedin.com/in/${rawReq.contactName.toLowerCase().replace(/\s+/g, '-')}`,
        companyId: company.id,
        sourceId: source.id,
        campaignId: campaign.id,
        status: rawReq.status || 'QUALIFIED',
        intentScore: rawReq.intentScore || 85,
        urgency: rawReq.urgency || 'MEDIUM',
        qualificationScore: rawReq.qualificationScore || 80,
        pipelineValue: rawReq.pipelineValue || 45000,
        salesBrief: rawReq.salesBrief || 'Qualified enterprise requirement discovered autonomously.',
        discoveredAt: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000),
      },
    });
    allCreatedLeads.push(lead);

    await prisma.requirement.create({
      data: {
        leadId: lead.id,
        sourceId: source.id,
        title: rawReq.requirementTitle,
        description: rawReq.description,
        category: rawReq.category,
        tags: JSON.stringify(rawReq.tags || []),
        budgetEstimate: rawReq.budgetEstimate || '$30,000 - $80,000',
        timeframe: rawReq.timeframe || 'Next 60 Days',
        rawEvidence: rawReq.rawEvidence || rawReq.description,
        confidenceScore: 88 + (i % 10),
      },
    });

    await prisma.qualification.create({
      data: {
        leadId: lead.id,
        budgetFit: rawReq.budgetFit || 85,
        authorityFit: rawReq.authorityFit || 88,
        needFit: rawReq.needFit || 90,
        timingFit: rawReq.timingFit || 82,
        overallScore: rawReq.qualificationScore || 85,
        status: 'QUALIFIED',
      },
    });

    await prisma.recommendation.create({
      data: {
        leadId: lead.id,
        actionType: rawReq.recommendationAction || 'CALL_NOW',
        title: rawReq.recommendationTitle || `Engage ${rawReq.contactName}`,
        rationale: rawReq.recommendationRationale || 'High-intent buying signal detected from public sources.',
        priority: i % 2 === 0 ? 'HIGH' : 'MEDIUM',
        suggestedChannel: 'Voice AI',
        suggestedMessage: `Hi ${rawReq.contactName.split(' ')[0]}, let's discuss your ${rawReq.category} roadmap.`,
      },
    });
  }

  // 7. Generate Full AI Voice Calls History
  console.log('Generating realistic AI voice calls and meeting handoffs...');
  const CALL_DISPOSITIONS = [
    { sentiment: 'POSITIVE', interest: 'HIGH', summary: 'Executive validated modernization project timeline and agreed to next steps.' },
    { sentiment: 'POSITIVE', interest: 'HIGH', summary: 'Confirmed budget allocation and requested technical security whitepaper.' },
    { sentiment: 'NEUTRAL', interest: 'MEDIUM', summary: 'Gathered initial infrastructure scope, follow-up scheduled for next quarter.' },
    { sentiment: 'POSITIVE', interest: 'HIGH', summary: 'Direct meeting scheduled with VP of Engineering for platform demo.' },
    { sentiment: 'POSITIVE', interest: 'HIGH', summary: 'Addressed multi-cloud migration doubts; prospect expressed strong interest.' },
  ];

  for (let idx = 0; idx < Math.min(allCreatedLeads.length, 12); idx++) {
    const lead = allCreatedLeads[idx];
    const callInfo = CALL_DISPOSITIONS[idx % CALL_DISPOSITIONS.length];
    const durationSec = 90 + (idx * 23) % 180;
    const isHero = idx === 0;

    const callRecord = await prisma.call.create({
      data: {
        workspaceId: workspace.id,
        leadId: lead.id,
        campaignId: lead.campaignId,
        userId: voiceAgentUser.id,
        status: isHero ? 'COMPLETED' : (idx % 4 === 0 ? 'IN_PROGRESS' : 'COMPLETED'),
        scheduledAt: new Date(Date.now() - (idx * 6 + 2) * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - (idx * 6 + 2) * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - (idx * 6 + 2) * 60 * 60 * 1000 + durationSec * 1000),
        durationSeconds: durationSec,
        summary: isHero 
          ? 'CTO confirmed SharePoint migration timeline and requested SPFx custom component case studies.'
          : `${lead.name} (${lead.title}) — ${callInfo.summary}`,
        sentiment: callInfo.sentiment,
        interestLevel: callInfo.interest,
        nextStep: isHero
          ? 'Send custom SPFx case study & schedule technical architect meeting.'
          : 'Sync qualified notes to CRM and trigger Calendly discovery invitation.',
        recordingUrl: `https://storage.intentos.ai/recordings/call_session_${idx + 1}.mp3`,
      },
    });

    await prisma.transcript.create({
      data: {
        callId: callRecord.id,
        dialogue: JSON.stringify([
          { speaker: 'AI', text: `Hello ${lead.name}, this is Nova from IntentOS following up on your recent project requirement.` },
          { speaker: 'PROSPECT', text: `Hi Nova, yes we are actively evaluating partners for our cloud infrastructure.` },
          { speaker: 'AI', text: 'Excellent! We specialize in sub-second migration with zero downtime. Does a 30-day timeline match your target?' },
          { speaker: 'PROSPECT', text: 'That aligns perfectly. Please send over your technical deck and scheduling link.' }
        ]),
        rawText: `Call with ${lead.name} (${lead.title}). Validated technical scope and confirmed decision authority.`,
        speakerTimeline: JSON.stringify({ aiDurationSeconds: Math.floor(durationSec * 0.4), leadDurationSeconds: Math.floor(durationSec * 0.6) }),
        sentimentCurve: JSON.stringify([{ time: '00:00', score: 0.6 }, { time: '01:00', score: 0.88 }, { time: '02:00', score: 0.94 }]),
      },
    });

    if (idx < 6) {
      await prisma.meetingBooking.create({
        data: {
          workspaceId: workspace.id,
          leadId: lead.id,
          callId: callRecord.id,
          campaignId: lead.campaignId,
          status: idx % 2 === 0 ? 'BOOKED' : 'AWAITING_BOOKING',
          recipientPhone: lead.phone,
          recipientName: lead.name,
          twilioMessageSid: `SM${100000000000 + idx * 987654321}`,
          smsStatus: 'delivered',
          smsSentAt: new Date(Date.now() - (idx + 1) * 3 * 60 * 60 * 1000),
          smsDeliveredAt: new Date(Date.now() - (idx + 1) * 3 * 60 * 60 * 1000 + 4000),
          nextCheckAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          bookingUrl: `https://calendly.com/intentos-solutions/discovery?name=${encodeURIComponent(lead.name)}`
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        leadId: lead.id,
        action: 'AI_CALL_COMPLETED',
        details: `Autonomous AI Call completed with ${lead.name} at ${companyMap.get(lead.companyId)?.name || 'Account'}.`,
        createdAt: new Date(Date.now() - (idx * 6 + 1) * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✅ Seed finished successfully with ${allCreatedLeads.length} leads and comprehensive call history!`);
}

if (process.argv[1]?.includes('seed')) {
  runSeed()
    .catch((e) => {
      console.error('Error during seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
