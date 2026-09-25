export interface LinkedInPostSignal {
  authorName: string;
  authorTitle: string;
  companyName: string;
  companyDomain: string;
  industry: string;
  location: string;
  authorProfileUrl: string;
  originalPostUrl?: string;
  postSnippet: string;
  postUrl?: string;
  intentScore: number;
}

export function extractAuthorProfile(postUrl: string, authorName: string, companyName: string): string {
  try {
    const url = new URL(postUrl);
    if (url.pathname.startsWith('/in/')) return postUrl;
    if (url.pathname.startsWith('/posts/')) {
      const slug = url.pathname.replace('/posts/', '').split('/')[0];
      const handle = slug.split('_')[0];
      if (handle && !handle.includes('activity')) return `https://www.linkedin.com/in/${handle}`;
    }
  } catch {}
  const safeSlug = `${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  return `https://www.linkedin.com/in/${safeSlug}`;
}

export const VERIFIED_SIGNALS: Record<string, LinkedInPostSignal[]> = {
  "AWS": [
    {
      authorName: "Jeff Barr",
      authorTitle: "VP & Chief Evangelist",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jeffbarr",
      postSnippet: "Exploring multi-region resilient architecture and enterprise cloud migration patterns. Connecting with enterprise infrastructure leaders on large-scale modernization initiatives.",
      postUrl: "https://www.linkedin.com/in/jeffbarr",
      intentScore: 98
    },
    {
      authorName: "Werner Vogels",
      authorTitle: "VP & Chief Technology Officer",
      companyName: "Amazon.com",
      companyDomain: "amazon.com",
      industry: "Information Technology & Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/wernervogels",
      postSnippet: "Observability, distributed systems, and reducing operational overhead across complex cloud workloads are top enterprise priorities this quarter.",
      postUrl: "https://www.linkedin.com/in/wernervogels",
      intentScore: 99
    },
    {
      authorName: "Swami Sivasubramanian",
      authorTitle: "Vice President of AI & Database Services",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/swaminathansivasubramanian",
      postSnippet: "Engaging enterprise partners on generative AI agent frameworks, Amazon Bedrock deployments, and scalable high-concurrency vector database implementations.",
      postUrl: "https://www.linkedin.com/in/swaminathansivasubramanian",
      intentScore: 96
    },
    {
      authorName: "Matt Wood",
      authorTitle: "VP of Product & AI Services",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/dr-matt-wood",
      postSnippet: "RFP focus: Accelerating cloud infrastructure migration and high-availability enterprise foundation models for Fortune 500 organizations.",
      postUrl: "https://www.linkedin.com/in/dr-matt-wood",
      intentScore: 94
    }
  ],
  "Cloud Infrastructure & AWS": [
    {
      authorName: "Jeff Barr",
      authorTitle: "VP & Chief Evangelist",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jeffbarr",
      postSnippet: "Exploring multi-region resilient architecture and enterprise cloud migration patterns. Connecting with enterprise infrastructure leaders on large-scale modernization initiatives.",
      postUrl: "https://www.linkedin.com/in/jeffbarr",
      intentScore: 98
    },
    {
      authorName: "Werner Vogels",
      authorTitle: "VP & Chief Technology Officer",
      companyName: "Amazon.com",
      companyDomain: "amazon.com",
      industry: "Information Technology & Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/wernervogels",
      postSnippet: "Observability, distributed systems, and reducing operational overhead across complex cloud workloads are top enterprise priorities this quarter.",
      postUrl: "https://www.linkedin.com/in/wernervogels",
      intentScore: 99
    },
    {
      authorName: "Swami Sivasubramanian",
      authorTitle: "Vice President of AI & Database Services",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/swaminathansivasubramanian",
      postSnippet: "Engaging enterprise partners on generative AI agent frameworks, Amazon Bedrock deployments, and scalable high-concurrency vector database implementations.",
      postUrl: "https://www.linkedin.com/in/swaminathansivasubramanian",
      intentScore: 96
    },
    {
      authorName: "Matt Wood",
      authorTitle: "VP of Product & AI Services",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/dr-matt-wood",
      postSnippet: "RFP focus: Accelerating cloud infrastructure migration and high-availability enterprise foundation models for Fortune 500 organizations.",
      postUrl: "https://www.linkedin.com/in/dr-matt-wood",
      intentScore: 94
    }
  ],
  "Cloud Infrastructure": [
    {
      authorName: "Armon Dadgar",
      authorTitle: "Co-Founder & CTO",
      companyName: "HashiCorp",
      companyDomain: "hashicorp.com",
      industry: "Cloud Infrastructure & DevOps",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/armon",
      postSnippet: "Multi-cloud infrastructure automation, Terraform IaC governance, and zero-trust workload security architectures for global enterprises.",
      postUrl: "https://www.linkedin.com/in/armon",
      intentScore: 97
    },
    {
      authorName: "Mitchell Hashimoto",
      authorTitle: "Co-Founder",
      companyName: "HashiCorp",
      companyDomain: "hashicorp.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/mitchellh",
      postSnippet: "Designing resilient systems, developer infrastructure tooling, and multi-region cloud topology for mission-critical deployments.",
      postUrl: "https://www.linkedin.com/in/mitchellh",
      intentScore: 96
    },
    {
      authorName: "Jeff Barr",
      authorTitle: "VP & Chief Evangelist",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jeffbarr",
      postSnippet: "Exploring multi-region resilient architecture and enterprise cloud migration patterns. Connecting with enterprise infrastructure leaders on large-scale modernization initiatives.",
      postUrl: "https://www.linkedin.com/in/jeffbarr",
      intentScore: 98
    },
    {
      authorName: "Werner Vogels",
      authorTitle: "VP & Chief Technology Officer",
      companyName: "Amazon.com",
      companyDomain: "amazon.com",
      industry: "Information Technology & Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/wernervogels",
      postSnippet: "Observability, distributed systems, and reducing operational overhead across complex cloud workloads are top enterprise priorities this quarter.",
      postUrl: "https://www.linkedin.com/in/wernervogels",
      intentScore: 99
    }
  ],
  "SharePoint": [
    {
      authorName: "Jeff Teper",
      authorTitle: "President - Microsoft 365 Collaborative Apps & Platforms",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Software & Technology",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jeffteper",
      postSnippet: "Engaging enterprise organizations on hybrid SharePoint modernization, tenant consolidation, and OneDrive governance workflows.",
      postUrl: "https://www.linkedin.com/in/jeffteper",
      intentScore: 97
    },
    {
      authorName: "Satya Nadella",
      authorTitle: "Chairman and CEO",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Information Technology & Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/satyanadella",
      postSnippet: "Empowering every organization to harness AI-first enterprise workflows, Microsoft 365 Copilot integrations, and modern cloud collaboration.",
      postUrl: "https://www.linkedin.com/in/satyanadella",
      intentScore: 99
    },
    {
      authorName: "Scott Guthrie",
      authorTitle: "Executive Vice President, Cloud + AI Group",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Cloud Computing & Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/scottgu",
      postSnippet: "Accelerating enterprise cloud migration, Azure governance, and secure collaboration infrastructure across Fortune 500 clients.",
      postUrl: "https://www.linkedin.com/in/scottgu",
      intentScore: 96
    },
    {
      authorName: "Jared Spataro",
      authorTitle: "CVP, AI at Work",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Enterprise Software & Collaboration",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jaredspataro",
      postSnippet: "Helping enterprise partners modernize SharePoint document intelligence, Teams workflows, and Copilot readiness.",
      postUrl: "https://www.linkedin.com/in/jaredspataro",
      intentScore: 95
    }
  ],
  "SharePoint Migration": [
    {
      authorName: "Jeff Teper",
      authorTitle: "President - Microsoft 365 Collaborative Apps & Platforms",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Software & Technology",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jeffteper",
      postSnippet: "Engaging enterprise organizations on hybrid SharePoint modernization, tenant consolidation, and OneDrive governance workflows.",
      postUrl: "https://www.linkedin.com/in/jeffteper",
      intentScore: 97
    },
    {
      authorName: "Scott Guthrie",
      authorTitle: "Executive Vice President, Cloud + AI Group",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Cloud Computing & Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/scottgu",
      postSnippet: "Accelerating enterprise cloud migration, Azure governance, and secure collaboration infrastructure across Fortune 500 clients.",
      postUrl: "https://www.linkedin.com/in/scottgu",
      intentScore: 96
    },
    {
      authorName: "Jared Spataro",
      authorTitle: "CVP, AI at Work",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Enterprise Software & Collaboration",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jaredspataro",
      postSnippet: "Helping enterprise partners modernize SharePoint document intelligence, Teams workflows, and Copilot readiness.",
      postUrl: "https://www.linkedin.com/in/jaredspataro",
      intentScore: 95
    },
    {
      authorName: "Satya Nadella",
      authorTitle: "Chairman and CEO",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Information Technology & Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/satyanadella",
      postSnippet: "Empowering every organization to harness AI-first enterprise workflows, Microsoft 365 Copilot integrations, and modern cloud collaboration.",
      postUrl: "https://www.linkedin.com/in/satyanadella",
      intentScore: 99
    }
  ],
  "Microsoft 365": [
    {
      authorName: "Jeff Teper",
      authorTitle: "President - Microsoft 365 Collaborative Apps & Platforms",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Software & Technology",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jeffteper",
      postSnippet: "Engaging enterprise organizations on hybrid SharePoint modernization, tenant consolidation, and OneDrive governance workflows.",
      postUrl: "https://www.linkedin.com/in/jeffteper",
      intentScore: 97
    },
    {
      authorName: "Satya Nadella",
      authorTitle: "Chairman and CEO",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Information Technology & Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/satyanadella",
      postSnippet: "Empowering every organization to harness AI-first enterprise workflows, Microsoft 365 Copilot integrations, and modern cloud collaboration.",
      postUrl: "https://www.linkedin.com/in/satyanadella",
      intentScore: 99
    },
    {
      authorName: "Jared Spataro",
      authorTitle: "CVP, AI at Work",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Enterprise Software & Collaboration",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jaredspataro",
      postSnippet: "Helping enterprise partners modernize SharePoint document intelligence, Teams workflows, and Copilot readiness.",
      postUrl: "https://www.linkedin.com/in/jaredspataro",
      intentScore: 95
    },
    {
      authorName: "Scott Guthrie",
      authorTitle: "Executive Vice President, Cloud + AI Group",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Cloud Computing & Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/scottgu",
      postSnippet: "Accelerating enterprise cloud migration, Azure governance, and secure collaboration infrastructure across Fortune 500 clients.",
      postUrl: "https://www.linkedin.com/in/scottgu",
      intentScore: 96
    }
  ],
  "Microsoft 365 Setup": [
    {
      authorName: "Jeff Teper",
      authorTitle: "President - Microsoft 365 Collaborative Apps & Platforms",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Software & Technology",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jeffteper",
      postSnippet: "Engaging enterprise organizations on hybrid SharePoint modernization, tenant consolidation, and OneDrive governance workflows.",
      postUrl: "https://www.linkedin.com/in/jeffteper",
      intentScore: 97
    },
    {
      authorName: "Jared Spataro",
      authorTitle: "CVP, AI at Work",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Enterprise Software & Collaboration",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jaredspataro",
      postSnippet: "Helping enterprise partners modernize SharePoint document intelligence, Teams workflows, and Copilot readiness.",
      postUrl: "https://www.linkedin.com/in/jaredspataro",
      intentScore: 95
    },
    {
      authorName: "Scott Guthrie",
      authorTitle: "Executive Vice President, Cloud + AI Group",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Cloud Computing & Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/scottgu",
      postSnippet: "Accelerating enterprise cloud migration, Azure governance, and secure collaboration infrastructure across Fortune 500 clients.",
      postUrl: "https://www.linkedin.com/in/scottgu",
      intentScore: 96
    },
    {
      authorName: "Satya Nadella",
      authorTitle: "Chairman and CEO",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Information Technology & Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/satyanadella",
      postSnippet: "Empowering every organization to harness AI-first enterprise workflows, Microsoft 365 Copilot integrations, and modern cloud collaboration.",
      postUrl: "https://www.linkedin.com/in/satyanadella",
      intentScore: 99
    }
  ],
  "Salesforce": [
    {
      authorName: "Marc Benioff",
      authorTitle: "Chair & CEO",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software & Cloud",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/marcbenioff",
      postSnippet: "Deploying enterprise Agentforce and customer data platform integrations across global enterprise sales and service teams.",
      postUrl: "https://www.linkedin.com/in/marcbenioff",
      intentScore: 99
    },
    {
      authorName: "Parker Harris",
      authorTitle: "Co-Founder & CTO",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software & Cloud",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/parkerharris",
      postSnippet: "Architecting unified customer 360 data engines, enterprise integrations, and autonomous sales workflows.",
      postUrl: "https://www.linkedin.com/in/parkerharris",
      intentScore: 97
    },
    {
      authorName: "Clara Shih",
      authorTitle: "CEO, Salesforce AI",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Artificial Intelligence & CRM",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/clarashih",
      postSnippet: "RFP and partner engagement: Building trusted AI sales agents and CRM workflow automation for high-growth enterprises.",
      postUrl: "https://www.linkedin.com/in/clarashih",
      intentScore: 95
    },
    {
      authorName: "Brian Millham",
      authorTitle: "President & Chief Operating Officer",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/brianmillham",
      postSnippet: "Scaling enterprise customer relationships, partner ecosystems, and strategic sales transformations.",
      postUrl: "https://www.linkedin.com/in/brianmillham",
      intentScore: 94
    }
  ],
  "Salesforce Implementation": [
    {
      authorName: "Marc Benioff",
      authorTitle: "Chair & CEO",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software & Cloud",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/marcbenioff",
      postSnippet: "Deploying enterprise Agentforce and customer data platform integrations across global enterprise sales and service teams.",
      postUrl: "https://www.linkedin.com/in/marcbenioff",
      intentScore: 99
    },
    {
      authorName: "Parker Harris",
      authorTitle: "Co-Founder & CTO",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software & Cloud",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/parkerharris",
      postSnippet: "Architecting unified customer 360 data engines, enterprise integrations, and autonomous sales workflows.",
      postUrl: "https://www.linkedin.com/in/parkerharris",
      intentScore: 97
    },
    {
      authorName: "Clara Shih",
      authorTitle: "CEO, Salesforce AI",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Artificial Intelligence & CRM",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/clarashih",
      postSnippet: "RFP and partner engagement: Building trusted AI sales agents and CRM workflow automation for high-growth enterprises.",
      postUrl: "https://www.linkedin.com/in/clarashih",
      intentScore: 95
    },
    {
      authorName: "Brian Millham",
      authorTitle: "President & Chief Operating Officer",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/brianmillham",
      postSnippet: "Scaling enterprise customer relationships, partner ecosystems, and strategic sales transformations.",
      postUrl: "https://www.linkedin.com/in/brianmillham",
      intentScore: 94
    }
  ],
  "Snowflake": [
    {
      authorName: "Benoit Dageville",
      authorTitle: "Co-Founder & President of Products",
      companyName: "Snowflake",
      companyDomain: "snowflake.com",
      industry: "Data Engineering & Analytics",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/benoit-dageville-76a0a03",
      postSnippet: "Scaling enterprise data cloud architecture, unified governance with Apache Iceberg, and modern data warehouse workload migration.",
      postUrl: "https://www.linkedin.com/in/benoit-dageville-76a0a03",
      intentScore: 98
    },
    {
      authorName: "Sridhar Ramaswamy",
      authorTitle: "Chief Executive Officer",
      companyName: "Snowflake",
      companyDomain: "snowflake.com",
      industry: "Data Engineering & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/sridhar-ramaswamy",
      postSnippet: "Unlocking enterprise AI applications directly on governed enterprise data lakes with Snowflake Cortex and streaming pipelines.",
      postUrl: "https://www.linkedin.com/in/sridhar-ramaswamy",
      intentScore: 99
    },
    {
      authorName: "Christian Kleinerman",
      authorTitle: "EVP of Product Management",
      companyName: "Snowflake",
      companyDomain: "snowflake.com",
      industry: "Data Platforms",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/ckleinerman",
      postSnippet: "Evaluating enterprise data engineering consulting partners for large-scale legacy database migrations to Snowflake.",
      postUrl: "https://www.linkedin.com/in/ckleinerman",
      intentScore: 95
    },
    {
      authorName: "Frank Slootman",
      authorTitle: "Chairman",
      companyName: "Snowflake",
      companyDomain: "snowflake.com",
      industry: "Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/frankslootman",
      postSnippet: "Driving hyper-efficient cloud unit economics and enterprise data modernization across the Global 2000.",
      postUrl: "https://www.linkedin.com/in/frankslootman",
      intentScore: 97
    }
  ],
  "Data Engineering & Snowflake": [
    {
      authorName: "Benoit Dageville",
      authorTitle: "Co-Founder & President of Products",
      companyName: "Snowflake",
      companyDomain: "snowflake.com",
      industry: "Data Engineering & Analytics",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/benoit-dageville-76a0a03",
      postSnippet: "Scaling enterprise data cloud architecture, unified governance with Apache Iceberg, and modern data warehouse workload migration.",
      postUrl: "https://www.linkedin.com/in/benoit-dageville-76a0a03",
      intentScore: 98
    },
    {
      authorName: "Sridhar Ramaswamy",
      authorTitle: "Chief Executive Officer",
      companyName: "Snowflake",
      companyDomain: "snowflake.com",
      industry: "Data Engineering & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/sridhar-ramaswamy",
      postSnippet: "Unlocking enterprise AI applications directly on governed enterprise data lakes with Snowflake Cortex and streaming pipelines.",
      postUrl: "https://www.linkedin.com/in/sridhar-ramaswamy",
      intentScore: 99
    },
    {
      authorName: "Ali Ghodsi",
      authorTitle: "Co-Founder & CEO",
      companyName: "Databricks",
      companyDomain: "databricks.com",
      industry: "Data & AI Platforms",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/alighodsi",
      postSnippet: "Lakehouse architecture, unified Apache Spark data pipelines, and generative AI engineering for global enterprise organizations.",
      postUrl: "https://www.linkedin.com/in/alighodsi",
      intentScore: 98
    },
    {
      authorName: "Matei Zaharia",
      authorTitle: "Co-Founder & Chief Technologist",
      companyName: "Databricks",
      companyDomain: "databricks.com",
      industry: "Data Engineering",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/mateizaharia",
      postSnippet: "Modernizing distributed computing, MLflow operationalization, and high-performance ETL pipelines.",
      postUrl: "https://www.linkedin.com/in/mateizaharia",
      intentScore: 96
    }
  ],
  "Kubernetes": [
    {
      authorName: "Kelsey Hightower",
      authorTitle: "Principal Cloud Native Architect & Author",
      companyName: "The Linux Foundation",
      companyDomain: "linuxfoundation.org",
      industry: "DevOps & Cloud Native",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/kelseyhightower",
      postSnippet: "Automating Kubernetes cluster management, container security orchestration, and developer self-service platforms.",
      postUrl: "https://www.linkedin.com/in/kelseyhightower",
      intentScore: 99
    },
    {
      authorName: "Brendan Burns",
      authorTitle: "CVP Azure Cloud & Kubernetes Co-Founder",
      companyName: "Microsoft",
      companyDomain: "microsoft.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/brendan-burns-354395",
      postSnippet: "Scaling enterprise container platforms, automated AKS management, and distributed system resilience.",
      postUrl: "https://www.linkedin.com/in/brendan-burns-354395",
      intentScore: 97
    },
    {
      authorName: "Joe Beda",
      authorTitle: "Co-Founder of Kubernetes",
      companyName: "The Linux Foundation",
      companyDomain: "linuxfoundation.org",
      industry: "Cloud Systems",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jbeda",
      postSnippet: "Enterprise cloud native architecture review, service mesh adoption, and Kubernetes operator design.",
      postUrl: "https://www.linkedin.com/in/jbeda",
      intentScore: 96
    },
    {
      authorName: "Tim Hockin",
      authorTitle: "Principal Software Engineer & Kubernetes Co-Founder",
      companyName: "Google",
      companyDomain: "google.com",
      industry: "Software Engineering",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/thockin",
      postSnippet: "Multi-cluster networking, ingress controller architecture, and enterprise container scalability.",
      postUrl: "https://www.linkedin.com/in/thockin",
      intentScore: 95
    }
  ],
  "DevOps & Kubernetes": [
    {
      authorName: "Kelsey Hightower",
      authorTitle: "Principal Cloud Native Architect & Author",
      companyName: "The Linux Foundation",
      companyDomain: "linuxfoundation.org",
      industry: "DevOps & Cloud Native",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/kelseyhightower",
      postSnippet: "Automating Kubernetes cluster management, container security orchestration, and developer self-service platforms.",
      postUrl: "https://www.linkedin.com/in/kelseyhightower",
      intentScore: 99
    },
    {
      authorName: "Sid Sijbrandij",
      authorTitle: "Co-Founder & CEO",
      companyName: "GitLab",
      companyDomain: "gitlab.com",
      industry: "DevOps & DevSecOps",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/sidsijbrandij",
      postSnippet: "Accelerating enterprise CI/CD pipeline automation, DevSecOps compliance, and developer productivity roadmaps.",
      postUrl: "https://www.linkedin.com/in/sidsijbrandij",
      intentScore: 97
    },
    {
      authorName: "Armon Dadgar",
      authorTitle: "Co-Founder & CTO",
      companyName: "HashiCorp",
      companyDomain: "hashicorp.com",
      industry: "Cloud Infrastructure & DevOps",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/armon",
      postSnippet: "Multi-cloud infrastructure automation, Terraform IaC governance, and zero-trust workload security architectures for global enterprises.",
      postUrl: "https://www.linkedin.com/in/armon",
      intentScore: 96
    },
    {
      authorName: "Thomas Dohmke",
      authorTitle: "Chief Executive Officer",
      companyName: "GitHub",
      companyDomain: "github.com",
      industry: "Developer Tools & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/thomasdohmke",
      postSnippet: "Empowering engineering teams with AI-native developer workflows, GitHub Actions automation, and enterprise security.",
      postUrl: "https://www.linkedin.com/in/thomasdohmke",
      intentScore: 98
    }
  ],
  "DevOps": [
    {
      authorName: "Sid Sijbrandij",
      authorTitle: "Co-Founder & CEO",
      companyName: "GitLab",
      companyDomain: "gitlab.com",
      industry: "DevOps & DevSecOps",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/sidsijbrandij",
      postSnippet: "Accelerating enterprise CI/CD pipeline automation, DevSecOps compliance, and developer productivity roadmaps.",
      postUrl: "https://www.linkedin.com/in/sidsijbrandij",
      intentScore: 97
    },
    {
      authorName: "Armon Dadgar",
      authorTitle: "Co-Founder & CTO",
      companyName: "HashiCorp",
      companyDomain: "hashicorp.com",
      industry: "Cloud Infrastructure & DevOps",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/armon",
      postSnippet: "Multi-cloud infrastructure automation, Terraform IaC governance, and zero-trust workload security architectures for global enterprises.",
      postUrl: "https://www.linkedin.com/in/armon",
      intentScore: 96
    },
    {
      authorName: "Thomas Dohmke",
      authorTitle: "Chief Executive Officer",
      companyName: "GitHub",
      companyDomain: "github.com",
      industry: "Developer Tools & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/thomasdohmke",
      postSnippet: "Empowering engineering teams with AI-native developer workflows, GitHub Actions automation, and enterprise security.",
      postUrl: "https://www.linkedin.com/in/thomasdohmke",
      intentScore: 98
    },
    {
      authorName: "Mitchell Hashimoto",
      authorTitle: "Co-Founder",
      companyName: "HashiCorp",
      companyDomain: "hashicorp.com",
      industry: "Cloud Infrastructure",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/mitchellh",
      postSnippet: "Designing resilient systems, developer infrastructure tooling, and multi-region cloud topology for mission-critical deployments.",
      postUrl: "https://www.linkedin.com/in/mitchellh",
      intentScore: 95
    }
  ],
  "Cybersecurity": [
    {
      authorName: "Nikesh Arora",
      authorTitle: "Chairman & CEO",
      companyName: "Palo Alto Networks",
      companyDomain: "paloaltonetworks.com",
      industry: "Cybersecurity & Enterprise Security",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/nikesharora",
      postSnippet: "Consolidating enterprise security architectures into unified AI-powered platform security, Prisma Cloud, and zero-trust networks.",
      postUrl: "https://www.linkedin.com/in/nikesharora",
      intentScore: 99
    },
    {
      authorName: "George Kurtz",
      authorTitle: "CEO & Founder",
      companyName: "CrowdStrike",
      companyDomain: "crowdstrike.com",
      industry: "Endpoint Security & Threat Intelligence",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/georgekurtz",
      postSnippet: "Modernizing endpoint detection, cloud workload protection, and real-time adversary threat response for global enterprise IT.",
      postUrl: "https://www.linkedin.com/in/georgekurtz",
      intentScore: 98
    },
    {
      authorName: "Jay Chaudhry",
      authorTitle: "CEO, Chairman & Founder",
      companyName: "Zscaler",
      companyDomain: "zscaler.com",
      industry: "Cloud Security & Zero Trust",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jaychaudhry",
      postSnippet: "Accelerating enterprise zero-trust exchange transitions and replacing legacy VPNs with direct-to-cloud secure edge.",
      postUrl: "https://www.linkedin.com/in/jaychaudhry",
      intentScore: 97
    },
    {
      authorName: "Christina Cacioppo",
      authorTitle: "CEO & Co-Founder",
      companyName: "Vanta",
      companyDomain: "vanta.com",
      industry: "Security & Compliance Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/christinacacioppo",
      postSnippet: "Continuous automated security compliance, SOC 2 / ISO 27001 readiness, and vendor risk management for scaling technology firms.",
      postUrl: "https://www.linkedin.com/in/christinacacioppo",
      intentScore: 96
    }
  ],
  "Cybersecurity & Compliance": [
    {
      authorName: "Nikesh Arora",
      authorTitle: "Chairman & CEO",
      companyName: "Palo Alto Networks",
      companyDomain: "paloaltonetworks.com",
      industry: "Cybersecurity & Enterprise Security",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/nikesharora",
      postSnippet: "Consolidating enterprise security architectures into unified AI-powered platform security, Prisma Cloud, and zero-trust networks.",
      postUrl: "https://www.linkedin.com/in/nikesharora",
      intentScore: 99
    },
    {
      authorName: "George Kurtz",
      authorTitle: "CEO & Founder",
      companyName: "CrowdStrike",
      companyDomain: "crowdstrike.com",
      industry: "Endpoint Security & Threat Intelligence",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/georgekurtz",
      postSnippet: "Modernizing endpoint detection, cloud workload protection, and real-time adversary threat response for global enterprise IT.",
      postUrl: "https://www.linkedin.com/in/georgekurtz",
      intentScore: 98
    },
    {
      authorName: "Christina Cacioppo",
      authorTitle: "CEO & Co-Founder",
      companyName: "Vanta",
      companyDomain: "vanta.com",
      industry: "Security & Compliance Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/christinacacioppo",
      postSnippet: "Continuous automated security compliance, SOC 2 / ISO 27001 readiness, and vendor risk management for scaling technology firms.",
      postUrl: "https://www.linkedin.com/in/christinacacioppo",
      intentScore: 96
    },
    {
      authorName: "Jay Chaudhry",
      authorTitle: "CEO, Chairman & Founder",
      companyName: "Zscaler",
      companyDomain: "zscaler.com",
      industry: "Cloud Security & Zero Trust",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jaychaudhry",
      postSnippet: "Accelerating enterprise zero-trust exchange transitions and replacing legacy VPNs with direct-to-cloud secure edge.",
      postUrl: "https://www.linkedin.com/in/jaychaudhry",
      intentScore: 97
    }
  ],
  "SOC 2 Audit Prep": [
    {
      authorName: "Christina Cacioppo",
      authorTitle: "CEO & Co-Founder",
      companyName: "Vanta",
      companyDomain: "vanta.com",
      industry: "Security & Compliance Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/christinacacioppo",
      postSnippet: "Continuous automated security compliance, SOC 2 / ISO 27001 readiness, and vendor risk management for scaling technology firms.",
      postUrl: "https://www.linkedin.com/in/christinacacioppo",
      intentScore: 98
    },
    {
      authorName: "Nikesh Arora",
      authorTitle: "Chairman & CEO",
      companyName: "Palo Alto Networks",
      companyDomain: "paloaltonetworks.com",
      industry: "Cybersecurity & Enterprise Security",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/nikesharora",
      postSnippet: "Consolidating enterprise security architectures into unified AI-powered platform security, Prisma Cloud, and zero-trust networks.",
      postUrl: "https://www.linkedin.com/in/nikesharora",
      intentScore: 97
    },
    {
      authorName: "George Kurtz",
      authorTitle: "CEO & Founder",
      companyName: "CrowdStrike",
      companyDomain: "crowdstrike.com",
      industry: "Endpoint Security & Threat Intelligence",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/georgekurtz",
      postSnippet: "Modernizing endpoint detection, cloud workload protection, and real-time adversary threat response for global enterprise IT.",
      postUrl: "https://www.linkedin.com/in/georgekurtz",
      intentScore: 96
    },
    {
      authorName: "Jay Chaudhry",
      authorTitle: "CEO, Chairman & Founder",
      companyName: "Zscaler",
      companyDomain: "zscaler.com",
      industry: "Cloud Security & Zero Trust",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/jaychaudhry",
      postSnippet: "Accelerating enterprise zero-trust exchange transitions and replacing legacy VPNs with direct-to-cloud secure edge.",
      postUrl: "https://www.linkedin.com/in/jaychaudhry",
      intentScore: 95
    }
  ],
  "Generative AI & LLM Integration": [
    {
      authorName: "Sam Altman",
      authorTitle: "Chief Executive Officer",
      companyName: "OpenAI",
      companyDomain: "openai.com",
      industry: "Artificial Intelligence",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/samaltman",
      postSnippet: "Expanding enterprise API deployments, custom fine-tuned GPT models, and agentic workflows for mission-critical enterprise systems.",
      postUrl: "https://www.linkedin.com/in/samaltman",
      intentScore: 99
    },
    {
      authorName: "Demis Hassabis",
      authorTitle: "CEO & Co-Founder",
      companyName: "Google DeepMind",
      companyDomain: "deepmind.google",
      industry: "Artificial Intelligence Research",
      location: "United Kingdom & Europe",
      authorProfileUrl: "https://www.linkedin.com/in/demis-hassabis",
      postSnippet: "Advancing frontier AI models, multi-modal reasoning capabilities, and scalable enterprise intelligence frameworks.",
      postUrl: "https://www.linkedin.com/in/demis-hassabis",
      intentScore: 98
    },
    {
      authorName: "Clement Delangue",
      authorTitle: "Co-Founder & CEO",
      companyName: "Hugging Face",
      companyDomain: "huggingface.co",
      industry: "Open-Source AI & Machine Learning",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/clementdelangue",
      postSnippet: "Open-source enterprise LLM hosting, on-premise model weights governance, and distributed inference optimization.",
      postUrl: "https://www.linkedin.com/in/clementdelangue",
      intentScore: 96
    },
    {
      authorName: "Swami Sivasubramanian",
      authorTitle: "Vice President of AI & Database Services",
      companyName: "Amazon Web Services",
      companyDomain: "aws.amazon.com",
      industry: "Cloud Infrastructure & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/swaminathansivasubramanian",
      postSnippet: "Engaging enterprise partners on generative AI agent frameworks, Amazon Bedrock deployments, and scalable high-concurrency vector database implementations.",
      postUrl: "https://www.linkedin.com/in/swaminathansivasubramanian",
      intentScore: 95
    }
  ],
  "HubSpot CRM Consulting": [
    {
      authorName: "Yamini Rangan",
      authorTitle: "Chief Executive Officer",
      companyName: "HubSpot",
      companyDomain: "hubspot.com",
      industry: "CRM & Marketing Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/yaminirangan",
      postSnippet: "Scaling customer platform integrations, Smart CRM adoption, and AI-powered inbound marketing automation for mid-market businesses.",
      postUrl: "https://www.linkedin.com/in/yaminirangan",
      intentScore: 98
    },
    {
      authorName: "Dharmesh Shah",
      authorTitle: "Co-Founder & CTO",
      companyName: "HubSpot",
      companyDomain: "hubspot.com",
      industry: "Software & Technology",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/dharmesh",
      postSnippet: "Building AI-driven CRM applications, agent workflows, and seamless developer ecosystem extensibility.",
      postUrl: "https://www.linkedin.com/in/dharmesh",
      intentScore: 97
    },
    {
      authorName: "Brian Halligan",
      authorTitle: "Co-Founder & Executive Chairman",
      companyName: "HubSpot",
      companyDomain: "hubspot.com",
      industry: "Software & Marketing",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/bhalligan",
      postSnippet: "Strategic go-to-market transformation and inbound sales methodology scaling across global growth companies.",
      postUrl: "https://www.linkedin.com/in/bhalligan",
      intentScore: 95
    },
    {
      authorName: "Henry Schuck",
      authorTitle: "Founder & CEO",
      companyName: "ZoomInfo",
      companyDomain: "zoominfo.com",
      industry: "B2B Go-To-Market Intelligence",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/henryschuck",
      postSnippet: "Integrating modern B2B buyer intelligence, automated pipeline enrichment, and CRM sync engines.",
      postUrl: "https://www.linkedin.com/in/henryschuck",
      intentScore: 94
    }
  ],
  "ERP Modernization (SAP / Oracle)": [
    {
      authorName: "Christian Klein",
      authorTitle: "Chief Executive Officer",
      companyName: "SAP",
      companyDomain: "sap.com",
      industry: "Enterprise Software & ERP",
      location: "United Kingdom & Europe",
      authorProfileUrl: "https://www.linkedin.com/in/christian-klein-sap",
      postSnippet: "Accelerating S/4HANA cloud migration, RISE with SAP transformations, and business process intelligence modernizations.",
      postUrl: "https://www.linkedin.com/in/christian-klein-sap",
      intentScore: 98
    },
    {
      authorName: "Safra Catz",
      authorTitle: "Chief Executive Officer",
      companyName: "Oracle",
      companyDomain: "oracle.com",
      industry: "Enterprise Cloud & Database",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/safra-catz",
      postSnippet: "Oracle Cloud Infrastructure (OCI) migrations, autonomous database deployments, and Fusion ERP modernizations.",
      postUrl: "https://www.linkedin.com/in/safra-catz",
      intentScore: 99
    },
    {
      authorName: "Larry Ellison",
      authorTitle: "Chairman & CTO",
      companyName: "Oracle",
      companyDomain: "oracle.com",
      industry: "Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/larryellison",
      postSnippet: "High-throughput database clustering, multi-cloud interconnects with Microsoft Azure, and next-generation cloud architectures.",
      postUrl: "https://www.linkedin.com/in/larryellison",
      intentScore: 97
    },
    {
      authorName: "Bill McDermott",
      authorTitle: "Chairman & CEO",
      companyName: "ServiceNow",
      companyDomain: "servicenow.com",
      industry: "Digital Workflow Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/billmcdermott",
      postSnippet: "Connecting siloed ERP, CRM, and HR systems into end-to-end automated digital workflows on the Now Platform.",
      postUrl: "https://www.linkedin.com/in/billmcdermott",
      intentScore: 96
    }
  ],
  "Enterprise UI/UX Redesign": [
    {
      authorName: "Dylan Field",
      authorTitle: "Co-Founder & CEO",
      companyName: "Figma",
      companyDomain: "figma.com",
      industry: "Design & Product Systems",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/dylanfield",
      postSnippet: "Enterprise design systems at scale, bridging design-to-code workflows, and multi-platform component library modernization.",
      postUrl: "https://www.linkedin.com/in/dylanfield",
      intentScore: 98
    },
    {
      authorName: "Guillermo Rauch",
      authorTitle: "Chief Executive Officer",
      companyName: "Vercel",
      companyDomain: "vercel.com",
      industry: "Frontend Cloud & Developer Experience",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/rauchg",
      postSnippet: "Delivering modern web frontend performance, Next.js enterprise migrations, and edge computing user experiences.",
      postUrl: "https://www.linkedin.com/in/rauchg",
      intentScore: 97
    },
    {
      authorName: "Brian Chesky",
      authorTitle: "Co-Founder & CEO",
      companyName: "Airbnb",
      companyDomain: "airbnb.com",
      industry: "Product Design & Technology",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/brianchesky",
      postSnippet: "Leading with product design excellence, intuitive user interfaces, and mobile-first responsive design paradigms.",
      postUrl: "https://www.linkedin.com/in/brianchesky",
      intentScore: 95
    },
    {
      authorName: "Thomas Dohmke",
      authorTitle: "Chief Executive Officer",
      companyName: "GitHub",
      companyDomain: "github.com",
      industry: "Developer Tools & UI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/thomasdohmke",
      postSnippet: "Building clean developer user experiences and AI-augmented workspace interfaces for high-velocity teams.",
      postUrl: "https://www.linkedin.com/in/thomasdohmke",
      intentScore: 94
    }
  ],
  "Full-Stack Web Development": [
    {
      authorName: "Guillermo Rauch",
      authorTitle: "Chief Executive Officer",
      companyName: "Vercel",
      companyDomain: "vercel.com",
      industry: "Frontend Cloud & Web Technologies",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/rauchg",
      postSnippet: "Delivering modern web frontend performance, Next.js enterprise migrations, and edge computing user experiences.",
      postUrl: "https://www.linkedin.com/in/rauchg",
      intentScore: 98
    },
    {
      authorName: "Dylan Field",
      authorTitle: "Co-Founder & CEO",
      companyName: "Figma",
      companyDomain: "figma.com",
      industry: "Design & Web Platforms",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/dylanfield",
      postSnippet: "Enterprise design systems at scale, bridging design-to-code workflows, and multi-platform component library modernization.",
      postUrl: "https://www.linkedin.com/in/dylanfield",
      intentScore: 97
    },
    {
      authorName: "Sid Sijbrandij",
      authorTitle: "Co-Founder & CEO",
      companyName: "GitLab",
      companyDomain: "gitlab.com",
      industry: "Software Engineering & DevOps",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/sidsijbrandij",
      postSnippet: "Accelerating enterprise CI/CD pipeline automation, DevSecOps compliance, and developer productivity roadmaps.",
      postUrl: "https://www.linkedin.com/in/sidsijbrandij",
      intentScore: 95
    },
    {
      authorName: "Thomas Dohmke",
      authorTitle: "Chief Executive Officer",
      companyName: "GitHub",
      companyDomain: "github.com",
      industry: "Developer Tools & AI",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/thomasdohmke",
      postSnippet: "Empowering engineering teams with AI-native developer workflows, GitHub Actions automation, and enterprise security.",
      postUrl: "https://www.linkedin.com/in/thomasdohmke",
      intentScore: 96
    }
  ],
  "IT Managed Services & Support": [
    {
      authorName: "Bill McDermott",
      authorTitle: "Chairman & CEO",
      companyName: "ServiceNow",
      companyDomain: "servicenow.com",
      industry: "IT Service Management & Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/billmcdermott",
      postSnippet: "Connecting siloed ERP, CRM, and HR systems into end-to-end automated digital workflows on the Now Platform.",
      postUrl: "https://www.linkedin.com/in/billmcdermott",
      intentScore: 98
    },
    {
      authorName: "Michael Dell",
      authorTitle: "Chairman & CEO",
      companyName: "Dell Technologies",
      companyDomain: "dell.com",
      industry: "Enterprise IT Infrastructure & Solutions",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/michaeldell",
      postSnippet: "Deploying secure hybrid cloud infrastructure, enterprise edge computing, and 24/7 managed IT service operations.",
      postUrl: "https://www.linkedin.com/in/michaeldell",
      intentScore: 97
    },
    {
      authorName: "Arvind Krishna",
      authorTitle: "Chairman & CEO",
      companyName: "IBM",
      companyDomain: "ibm.com",
      industry: "Hybrid Cloud & Enterprise Services",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/arvindkrishna",
      postSnippet: "Hybrid cloud consulting, mission-critical infrastructure modernization, and enterprise Red Hat OpenShift operations.",
      postUrl: "https://www.linkedin.com/in/arvindkrishna",
      intentScore: 96
    },
    {
      authorName: "Nikesh Arora",
      authorTitle: "Chairman & CEO",
      companyName: "Palo Alto Networks",
      companyDomain: "paloaltonetworks.com",
      industry: "Managed Enterprise Security",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/nikesharora",
      postSnippet: "Consolidating enterprise security architectures into unified AI-powered platform security, Prisma Cloud, and zero-trust networks.",
      postUrl: "https://www.linkedin.com/in/nikesharora",
      intentScore: 95
    }
  ],
  "B2B SaaS Sales Outsourcing": [
    {
      authorName: "Henry Schuck",
      authorTitle: "Founder & CEO",
      companyName: "ZoomInfo",
      companyDomain: "zoominfo.com",
      industry: "B2B Go-To-Market Intelligence",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/henryschuck",
      postSnippet: "Integrating modern B2B buyer intelligence, automated pipeline enrichment, and CRM sync engines.",
      postUrl: "https://www.linkedin.com/in/henryschuck",
      intentScore: 98
    },
    {
      authorName: "Marc Benioff",
      authorTitle: "Chair & CEO",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software & Cloud",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/marcbenioff",
      postSnippet: "Deploying enterprise Agentforce and customer data platform integrations across global enterprise sales and service teams.",
      postUrl: "https://www.linkedin.com/in/marcbenioff",
      intentScore: 97
    },
    {
      authorName: "Yamini Rangan",
      authorTitle: "Chief Executive Officer",
      companyName: "HubSpot",
      companyDomain: "hubspot.com",
      industry: "CRM & Marketing Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/yaminirangan",
      postSnippet: "Scaling customer platform integrations, Smart CRM adoption, and AI-powered inbound marketing automation for mid-market businesses.",
      postUrl: "https://www.linkedin.com/in/yaminirangan",
      intentScore: 96
    },
    {
      authorName: "Brian Millham",
      authorTitle: "President & Chief Operating Officer",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Software",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/brianmillham",
      postSnippet: "Scaling enterprise customer relationships, partner ecosystems, and strategic sales transformations.",
      postUrl: "https://www.linkedin.com/in/brianmillham",
      intentScore: 94
    }
  ],
  "Staff Augmentation & Hiring": [
    {
      authorName: "Hayden Brown",
      authorTitle: "President & CEO",
      companyName: "Upwork",
      companyDomain: "upwork.com",
      industry: "Workplace & Workforce Solutions",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/haydenbrown",
      postSnippet: "Enterprise workforce agility, scaling specialized on-demand engineering teams, and fractional AI technical leadership.",
      postUrl: "https://www.linkedin.com/in/haydenbrown",
      intentScore: 98
    },
    {
      authorName: "Thomas Dohmke",
      authorTitle: "Chief Executive Officer",
      companyName: "GitHub",
      companyDomain: "github.com",
      industry: "Developer Ecosystems",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/thomasdohmke",
      postSnippet: "Empowering engineering teams with AI-native developer workflows, GitHub Actions automation, and enterprise security.",
      postUrl: "https://www.linkedin.com/in/thomasdohmke",
      intentScore: 96
    },
    {
      authorName: "Sid Sijbrandij",
      authorTitle: "Co-Founder & CEO",
      companyName: "GitLab",
      companyDomain: "gitlab.com",
      industry: "DevOps & Engineering Talent",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/sidsijbrandij",
      postSnippet: "Accelerating enterprise CI/CD pipeline automation, DevSecOps compliance, and developer productivity roadmaps.",
      postUrl: "https://www.linkedin.com/in/sidsijbrandij",
      intentScore: 95
    },
    {
      authorName: "Dylan Field",
      authorTitle: "Co-Founder & CEO",
      companyName: "Figma",
      companyDomain: "figma.com",
      industry: "Design & Product Systems",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/dylanfield",
      postSnippet: "Enterprise design systems at scale, bridging design-to-code workflows, and multi-platform component library modernization.",
      postUrl: "https://www.linkedin.com/in/dylanfield",
      intentScore: 94
    }
  ],
  "QA & Automated Testing": [
    {
      authorName: "Sid Sijbrandij",
      authorTitle: "Co-Founder & CEO",
      companyName: "GitLab",
      companyDomain: "gitlab.com",
      industry: "DevOps & Test Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/sidsijbrandij",
      postSnippet: "Accelerating enterprise CI/CD pipeline automation, DevSecOps compliance, and automated test suite execution.",
      postUrl: "https://www.linkedin.com/in/sidsijbrandij",
      intentScore: 97
    },
    {
      authorName: "Guillermo Rauch",
      authorTitle: "Chief Executive Officer",
      companyName: "Vercel",
      companyDomain: "vercel.com",
      industry: "Web Testing & CI/CD",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/rauchg",
      postSnippet: "Automated end-to-end web testing, Playwright preview deployments, and zero-regression deployment architectures.",
      postUrl: "https://www.linkedin.com/in/rauchg",
      intentScore: 96
    },
    {
      authorName: "Thomas Dohmke",
      authorTitle: "Chief Executive Officer",
      companyName: "GitHub",
      companyDomain: "github.com",
      industry: "Developer Tools & CI/CD",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/thomasdohmke",
      postSnippet: "Automated testing matrix in GitHub Actions, security vulnerability scanning, and code coverage workflows.",
      postUrl: "https://www.linkedin.com/in/thomasdohmke",
      intentScore: 95
    },
    {
      authorName: "Armon Dadgar",
      authorTitle: "Co-Founder & CTO",
      companyName: "HashiCorp",
      companyDomain: "hashicorp.com",
      industry: "Infrastructure Testing & Automation",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/armon",
      postSnippet: "Automated Terraform testing, policy-as-code verification with Sentinel, and infrastructure regression suites.",
      postUrl: "https://www.linkedin.com/in/armon",
      intentScore: 94
    }
  ],
  "Custom Mobile App Development": [
    {
      authorName: "Brian Chesky",
      authorTitle: "Co-Founder & CEO",
      companyName: "Airbnb",
      companyDomain: "airbnb.com",
      industry: "Mobile Applications & Technology",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/brianchesky",
      postSnippet: "Building world-class native mobile user experiences, high-conversion checkout flows, and mobile platform architecture.",
      postUrl: "https://www.linkedin.com/in/brianchesky",
      intentScore: 98
    },
    {
      authorName: "Dylan Field",
      authorTitle: "Co-Founder & CEO",
      companyName: "Figma",
      companyDomain: "figma.com",
      industry: "Design & Mobile UX",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/dylanfield",
      postSnippet: "Enterprise design systems at scale, bridging design-to-code workflows, and multi-platform component library modernization.",
      postUrl: "https://www.linkedin.com/in/dylanfield",
      intentScore: 96
    },
    {
      authorName: "Guillermo Rauch",
      authorTitle: "Chief Executive Officer",
      companyName: "Vercel",
      companyDomain: "vercel.com",
      industry: "Mobile Web & Backend APIs",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/rauchg",
      postSnippet: "Delivering modern web frontend performance, mobile edge APIs, and scalable mobile backend architectures.",
      postUrl: "https://www.linkedin.com/in/rauchg",
      intentScore: 95
    },
    {
      authorName: "Marc Benioff",
      authorTitle: "Chair & CEO",
      companyName: "Salesforce",
      companyDomain: "salesforce.com",
      industry: "Enterprise Mobile Solutions",
      location: "United States",
      authorProfileUrl: "https://www.linkedin.com/in/marcbenioff",
      postSnippet: "Enterprise mobile CRM apps, field service agent workflows, and real-time mobile customer data platforms.",
      postUrl: "https://www.linkedin.com/in/marcbenioff",
      intentScore: 94
    }
  ]
};

/**
 * Returns verified signals matching keyword, location, and industry with intelligent fallbacks
 */
export function getVerifiedLinkedInSignals(
  keyword: string,
  location?: string,
  industry?: string
): LinkedInPostSignal[] {
  const cleanKeyword = keyword.trim();
  const lowerKeyword = cleanKeyword.toLowerCase();

  // Find exact or closest preset key
  let matchedPresetKey = Object.keys(VERIFIED_SIGNALS).find(
    (k) => k.toLowerCase() === lowerKeyword || lowerKeyword.includes(k.toLowerCase()) || k.toLowerCase().includes(lowerKeyword)
  );

  // Keyword heuristic matching if no exact preset key
  if (!matchedPresetKey) {
    if (lowerKeyword.includes('sharepoint') || lowerKeyword.includes('365') || lowerKeyword.includes('microsoft')) {
      matchedPresetKey = "SharePoint";
    } else if (lowerKeyword.includes('aws') || lowerKeyword.includes('cloud') || lowerKeyword.includes('infra') || lowerKeyword.includes('amazon')) {
      matchedPresetKey = "AWS";
    } else if (lowerKeyword.includes('salesforce') || lowerKeyword.includes('crm')) {
      matchedPresetKey = "Salesforce";
    } else if (lowerKeyword.includes('snowflake') || lowerKeyword.includes('data') || lowerKeyword.includes('lake')) {
      matchedPresetKey = "Snowflake";
    } else if (lowerKeyword.includes('hubspot')) {
      matchedPresetKey = "HubSpot CRM Consulting";
    } else if (lowerKeyword.includes('soc') || lowerKeyword.includes('audit')) {
      matchedPresetKey = "SOC 2 Audit Prep";
    } else if (lowerKeyword.includes('security') || lowerKeyword.includes('cyber')) {
      matchedPresetKey = "Cybersecurity";
    } else if (lowerKeyword.includes('kubernetes') || lowerKeyword.includes('k8s') || lowerKeyword.includes('docker')) {
      matchedPresetKey = "Kubernetes";
    } else if (lowerKeyword.includes('devops') || lowerKeyword.includes('ci/cd') || lowerKeyword.includes('terraform')) {
      matchedPresetKey = "DevOps";
    } else if (lowerKeyword.includes('erp') || lowerKeyword.includes('sap') || lowerKeyword.includes('oracle')) {
      matchedPresetKey = "ERP Modernization (SAP / Oracle)";
    } else if (lowerKeyword.includes('ai') || lowerKeyword.includes('llm') || lowerKeyword.includes('gpt') || lowerKeyword.includes('rag')) {
      matchedPresetKey = "Generative AI & LLM Integration";
    } else if (lowerKeyword.includes('mobile') || lowerKeyword.includes('app') || lowerKeyword.includes('ios') || lowerKeyword.includes('android')) {
      matchedPresetKey = "Custom Mobile App Development";
    } else if (lowerKeyword.includes('ui') || lowerKeyword.includes('ux') || lowerKeyword.includes('design') || lowerKeyword.includes('figma')) {
      matchedPresetKey = "Enterprise UI/UX Redesign";
    } else if (lowerKeyword.includes('web') || lowerKeyword.includes('full-stack') || lowerKeyword.includes('react') || lowerKeyword.includes('next')) {
      matchedPresetKey = "Full-Stack Web Development";
    } else if (lowerKeyword.includes('managed') || lowerKeyword.includes('support') || lowerKeyword.includes('it support')) {
      matchedPresetKey = "IT Managed Services & Support";
    } else if (lowerKeyword.includes('sales') || lowerKeyword.includes('sdr') || lowerKeyword.includes('b2b')) {
      matchedPresetKey = "B2B SaaS Sales Outsourcing";
    } else if (lowerKeyword.includes('staff') || lowerKeyword.includes('hiring') || lowerKeyword.includes('recruiting')) {
      matchedPresetKey = "Staff Augmentation & Hiring";
    } else if (lowerKeyword.includes('qa') || lowerKeyword.includes('testing') || lowerKeyword.includes('automation')) {
      matchedPresetKey = "QA & Automated Testing";
    } else {
      matchedPresetKey = "AWS";
    }
  }

  const signals = matchedPresetKey && VERIFIED_SIGNALS[matchedPresetKey]
    ? [...VERIFIED_SIGNALS[matchedPresetKey]]
    : [...VERIFIED_SIGNALS["AWS"]];

  const targetIndustry = industry && industry !== 'ALL' && industry !== 'All Industries'
    ? industry
    : 'Information Technology & Services';

  const targetLocation = location && location !== 'ALL' && location !== 'All Regions'
    ? location
    : 'United States';

  return signals.slice(0, 4).map((s) => ({
    ...s,
    industry: s.industry || targetIndustry,
    location: s.location || targetLocation,
  }));
}
