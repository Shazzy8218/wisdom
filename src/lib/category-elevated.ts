// Elevated value propositions and outcomes for all 22 categories

export interface CategoryElevatedMeta {
  valueProp: string;
  outcomes: string[];
  advancedExamples: string[];
}

export const CATEGORY_ELEVATED: Record<string, CategoryElevatedMeta> = {
  management: {
    valueProp: "Transform from a task-manager into an AI-augmented strategic leader — making faster decisions, running leaner teams, and delivering executive-level output at every organizational level.",
    outcomes: [
      "Produce executive-ready strategic documents and performance reviews in minutes",
      "Deploy AI-powered decision matrices that eliminate analysis paralysis",
      "Build team capacity models that prevent burnout and optimize throughput",
      "Run meetings that produce actionable outcomes in half the time",
    ],
    advancedExamples: [
      "A mid-level manager used AI-driven OKR and capacity planning to optimize their 15-person team, reducing project delivery time by 40% and earning a promotion to VP within 8 months",
      "A startup CTO deployed AI meeting automation and delegation frameworks to scale from 5 to 25 employees without adding management overhead — saving $180k/year in hiring",
    ],
  },
  "business-finance": {
    valueProp: "Gain CFO-level financial intelligence using AI — from cash flow forecasting to investment analysis — making every financial decision with data-backed confidence.",
    outcomes: [
      "Build 90-day cash flow forecasts that predict financial gaps before they become crises",
      "Create financial models and business valuations that rival boutique consulting output",
      "Automate invoicing, tax planning, and expense categorization end-to-end",
      "Analyze investment opportunities with institutional-grade due diligence frameworks",
    ],
    advancedExamples: [
      "A small business owner used AI financial modeling to identify $120k in hidden costs, restructured operations, and doubled net profit within one fiscal year",
      "A freelancer deployed AI-powered invoicing and cash flow systems to eliminate late payments entirely, improving cash position by $25k annually",
    ],
  },
  "computer-math": {
    valueProp: "Become dangerous with code and data — even without a CS degree — using AI to debug, analyze, automate, and build technical solutions that non-technical people can't.",
    outcomes: [
      "Debug and understand code in any language using AI-assisted analysis",
      "Build automated data pipelines and analysis workflows without formal training",
      "Create spreadsheet systems that handle complex business logic automatically",
      "Prototype functional software tools that solve real business problems",
    ],
    advancedExamples: [
      "A marketing analyst used AI coding skills to build an automated reporting dashboard, eliminating 20 hours/week of manual Excel work and securing a $30k raise",
      "A non-technical founder prototyped their SaaS MVP using AI-assisted development, launching to $5k MRR before hiring their first developer",
    ],
  },
  architecture: {
    valueProp: "Accelerate every phase of design and engineering — from concept to compliance — using AI as your research assistant, code checker, and documentation engine.",
    outcomes: [
      "Generate comprehensive design briefs and project documentation in minutes",
      "Automate code compliance research and material specification lookups",
      "Create client presentations and site analyses with professional-grade output",
      "Streamline project coordination across multidisciplinary engineering teams",
    ],
    advancedExamples: [
      "An architectural firm used AI documentation automation to reduce proposal creation time by 70%, winning 3x more competitive bids per quarter",
      "A civil engineer deployed AI compliance checking to catch a $500k design error before construction, saving the project from costly remediation",
    ],
  },
  "life-sciences": {
    valueProp: "Supercharge your research productivity — from literature review to data analysis to publication — making AI your most valuable lab partner.",
    outcomes: [
      "Conduct comprehensive literature reviews across thousands of papers in hours",
      "Design research methodologies with AI-assisted statistical power analysis",
      "Transform raw data into publication-ready analyses and visualizations",
      "Write grant proposals and research papers at 3x the speed with higher quality",
    ],
    advancedExamples: [
      "A PhD candidate used AI literature review tools to identify a gap in existing research, leading to a Nature-published paper and a fully funded postdoc position",
      "A biotech startup used AI-assisted data analysis to compress 18 months of research into 6, securing $5M in Series A funding based on accelerated results",
    ],
  },
  "social-services": {
    valueProp: "Maximize your impact per hour — using AI to handle documentation overhead so you can spend more time with the people who need you most.",
    outcomes: [
      "Reduce case documentation time by 60% with AI-assisted note templates",
      "Build comprehensive community resource directories that update dynamically",
      "Create grant proposals and program evaluations that secure funding",
      "Design client intake and assessment workflows that capture critical information efficiently",
    ],
    advancedExamples: [
      "A social worker used AI documentation tools to reclaim 10 hours per week, increasing their caseload capacity by 40% and serving 15 additional families",
      "A nonprofit director deployed AI grant writing assistance to submit 3x more proposals, securing $250k in new program funding within one year",
    ],
  },
  legal: {
    valueProp: "Deploy AI as your tireless legal research associate — accelerating contract review, compliance checks, and document preparation while maintaining the precision the profession demands.",
    outcomes: [
      "Review and analyze contracts 5x faster with AI-assisted clause identification",
      "Conduct comprehensive legal research across jurisdictions in minutes",
      "Generate first drafts of legal documents, briefs, and correspondence at professional quality",
      "Build compliance checklists and regulatory tracking systems that prevent costly oversights",
    ],
    advancedExamples: [
      "A solo practitioner used AI contract review to handle the workload of a 3-person team, growing their practice revenue by $180k without adding staff",
      "A compliance officer deployed AI regulatory tracking to identify a reporting gap before an audit, preventing a potential $2M fine",
    ],
  },
  education: {
    valueProp: "Transform your teaching practice with AI-powered lesson design, differentiation, and assessment — delivering personalized education at a scale previously impossible for individual educators.",
    outcomes: [
      "Create differentiated lesson plans for multiple ability levels in minutes",
      "Build assessment rubrics and quizzes aligned to standards automatically",
      "Generate IEP goals and parent communications with professional precision",
      "Design professional development pathways that accelerate career advancement",
    ],
    advancedExamples: [
      "A high school teacher used AI differentiation tools to personalize instruction for 150 students, improving standardized test scores by 22% across all classes",
      "An instructional designer built AI-powered curriculum packages and sold them as a side business, generating $4k/month in passive income",
    ],
  },
  "arts-media": {
    valueProp: "Build a content production engine that outpaces agencies — creating scroll-stopping content, building brands, and running campaigns with the output velocity of a 10-person creative team.",
    outcomes: [
      "Produce 30 days of multi-platform content in a single afternoon session",
      "Write headlines, scripts, and copy that convert using psychological trigger frameworks",
      "Build complete brand identity systems from name to visual language",
      "Run SEO-optimized content strategies that drive organic traffic at scale",
    ],
    advancedExamples: [
      "A solopreneur replaced a $6k/month agency by building an AI content pipeline, producing higher-quality output while keeping all revenue in-house",
      "A podcast host used AI production workflows to launch and grow to 50k downloads/month within 6 months — monetizing at $3k/month through sponsorships",
    ],
  },
  "healthcare-pract": {
    valueProp: "Reclaim clinical time stolen by paperwork — using AI to streamline documentation, patient education, and continuing education while maintaining the highest standards of care.",
    outcomes: [
      "Reduce clinical documentation time by 50% with AI-assisted note formatting",
      "Create patient education materials at any reading level instantly",
      "Summarize research articles into clinical takeaways in under 2 minutes",
      "Build continuing education plans and quality improvement projects efficiently",
    ],
    advancedExamples: [
      "A physician used AI documentation tools to see 4 additional patients per day without extending hours — generating $200k in additional annual revenue for their practice",
      "A nursing department deployed AI patient education materials, reducing readmission rates by 18% and earning a quality improvement award",
    ],
  },
  "healthcare-support": {
    valueProp: "Elevate every patient interaction with AI-powered protocols, documentation, and coordination systems that improve care quality while reducing administrative burden.",
    outcomes: [
      "Standardize patient intake and vital signs documentation for consistency",
      "Build scheduling systems that optimize provider utilization and patient wait times",
      "Create infection control and compliance training materials efficiently",
      "Coordinate multi-provider care with AI-generated handoff documents",
    ],
    advancedExamples: [
      "A clinic manager used AI scheduling optimization to reduce patient wait times by 35%, improving satisfaction scores and increasing daily patient volume by 12%",
      "A healthcare support team deployed AI compliance checklists that achieved a perfect score on their next regulatory inspection",
    ],
  },
  protective: {
    valueProp: "Deploy AI as your force multiplier for safety — from incident reporting to crisis management — making every protective service operation faster, more thorough, and more effective.",
    outcomes: [
      "Write professional incident reports and safety documentation in half the time",
      "Build risk assessment frameworks that identify threats before they escalate",
      "Design training programs and emergency response plans with comprehensive coverage",
      "Create community relations strategies that build trust and cooperation",
    ],
    advancedExamples: [
      "A security director used AI risk assessment to redesign facility protocols, reducing incidents by 60% and cutting insurance premiums by $40k annually",
      "A fire department used AI training program design to compress 40 hours of instruction into 20 hours with improved knowledge retention scores",
    ],
  },
  "food-serving": {
    valueProp: "Run a tighter, more profitable food operation — using AI for menu engineering, cost control, staff training, and reputation management that drives repeat business.",
    outcomes: [
      "Engineer menus with AI-optimized pricing and food cost analysis",
      "Build staff training systems that ensure consistency across all service touchpoints",
      "Automate review responses and social media presence to build your brand",
      "Create health inspection prep checklists that guarantee compliance",
    ],
    advancedExamples: [
      "A restaurant owner used AI menu engineering to redesign their offerings, increasing average ticket size by 28% and adding $8k/month in revenue",
      "A catering company deployed AI proposal and follow-up systems to win 45% more corporate contracts, growing revenue by $120k annually",
    ],
  },
  grounds: {
    valueProp: "Scale your landscaping or grounds operation with AI-powered planning, estimating, and client management — turning seasonal work into year-round profitable systems.",
    outcomes: [
      "Create accurate project estimates and client proposals in minutes",
      "Build seasonal maintenance schedules optimized for efficiency and coverage",
      "Design landscape plans with AI-assisted plant selection and layout",
      "Automate client communication and follow-up systems for retention",
    ],
    advancedExamples: [
      "A landscaping company used AI estimating and scheduling to take on 30% more clients with the same crew, adding $60k in annual revenue",
      "A grounds maintenance manager deployed AI seasonal planning to reduce material waste by 25%, saving $15k per year across 3 properties",
    ],
  },
  "personal-care": {
    valueProp: "Elevate your salon, spa, or personal care business with AI-powered client management, marketing, and service innovation that builds a loyal, high-spending clientele.",
    outcomes: [
      "Build client consultation systems that recommend services based on history and preferences",
      "Create social media content and marketing campaigns that attract ideal clients",
      "Design retention strategies using AI-analyzed client behavior patterns",
      "Develop service menus and pricing strategies optimized for maximum revenue per visit",
    ],
    advancedExamples: [
      "A salon owner used AI client analysis to identify their highest-value services, restructuring their menu to increase average ticket by 40% and monthly revenue by $6k",
      "A mobile aesthetician built an AI-powered booking and follow-up system, growing from 8 to 25 weekly clients in 3 months without advertising spend",
    ],
  },
  sales: {
    valueProp: "Sell more, faster, with less effort — using AI to prospect, pitch, handle objections, and close deals with a precision that turns average salespeople into top performers.",
    outcomes: [
      "Generate hyper-personalized outreach at scale that cuts through inbox noise",
      "Build objection-handling scripts optimized for every common sales scenario",
      "Create proposals and presentations that close deals on the first presentation",
      "Design pipeline management systems that predict and prevent deal stalls",
    ],
    advancedExamples: [
      "A B2B sales rep used AI prospecting and personalization to increase their pipeline by 400%, hitting President's Club for the first time with $2.1M in closed revenue",
      "A sales team deployed AI objection handling and proposal automation, shortening their average sales cycle from 45 to 18 days",
    ],
  },
  "office-admin": {
    valueProp: "Become the most valuable person in any office — using AI to automate workflows, organize systems, and produce executive-quality output that makes you indispensable.",
    outcomes: [
      "Automate email management, document creation, and scheduling systems",
      "Build process documentation that makes every workflow repeatable and trainable",
      "Create professional reports, presentations, and communications in minutes",
      "Design vendor management and budget tracking systems with AI assistance",
    ],
    advancedExamples: [
      "An executive assistant used AI automation to manage 3 executives' schedules simultaneously, earning a $15k raise and a new title of Chief of Staff",
      "An office manager deployed AI process documentation to onboard new hires in 3 days instead of 3 weeks, reducing training costs by $40k annually",
    ],
  },
  agriculture: {
    valueProp: "Farm smarter with AI-powered planning, market analysis, and record-keeping that turns agricultural operations into data-driven businesses with higher yields and better margins.",
    outcomes: [
      "Build crop planning calendars optimized for weather patterns and market timing",
      "Create financial models for farm operations that improve profitability",
      "Design pest and disease management protocols with AI-assisted identification",
      "Track regulatory compliance and certifications with automated checklists",
    ],
    advancedExamples: [
      "A family farm used AI market analysis to time their crop sales, increasing annual revenue by $45k through better pricing and distribution decisions",
      "An organic producer deployed AI compliance tracking to achieve certification 6 months faster, accessing premium markets worth $80k in first-year revenue",
    ],
  },
  construction: {
    valueProp: "Win more bids, deliver on time, and protect your margins — using AI for estimation, project management, and safety documentation that separates professional operators from everyone else.",
    outcomes: [
      "Create accurate cost estimates and material takeoffs in a fraction of the time",
      "Build project schedules with critical path analysis and risk contingencies",
      "Generate professional proposals and change order documentation that protect margins",
      "Design safety programs and daily reports that ensure compliance and reduce incidents",
    ],
    advancedExamples: [
      "A general contractor used AI estimation to bid 40% more projects with the same team, winning $500k in additional contracts annually",
      "A construction company deployed AI safety documentation, reducing incident rates by 50% and cutting workers' comp premiums by $30k/year",
    ],
  },
  installation: {
    valueProp: "Build a service business that runs like a machine — using AI for diagnostics, customer communication, and business growth that turns technicians into business owners.",
    outcomes: [
      "Create diagnostic flowcharts and troubleshooting guides for any system",
      "Build preventive maintenance programs that generate recurring revenue",
      "Automate service reports and customer follow-up for professional delivery",
      "Design pricing strategies and service menus that maximize revenue per call",
    ],
    advancedExamples: [
      "An HVAC technician used AI business systems to launch a preventive maintenance program, creating $8k/month in recurring revenue within the first year",
      "A repair service deployed AI diagnostic guides to reduce callback rates by 70%, improving customer satisfaction and reducing costs by $25k annually",
    ],
  },
  production: {
    valueProp: "Achieve manufacturing excellence — using AI for quality control, process optimization, and continuous improvement that drives output up and defects down.",
    outcomes: [
      "Build statistical quality control systems with AI-assisted analysis",
      "Design lean manufacturing workflows that eliminate waste systematically",
      "Create production capacity models that optimize scheduling and throughput",
      "Develop standard work instructions and training programs for consistency",
    ],
    advancedExamples: [
      "A production manager used AI quality analysis to identify a recurring defect pattern, implementing a fix that reduced scrap by 35% and saved $200k annually",
      "A manufacturing plant deployed AI capacity planning to increase throughput by 22% without capital investment, generating $1.2M in additional annual revenue",
    ],
  },
  transportation: {
    valueProp: "Optimize every mile and every minute — using AI for route planning, fleet management, and compliance tracking that cuts costs and improves delivery performance.",
    outcomes: [
      "Design route optimization strategies that reduce fuel costs and delivery times",
      "Build fleet management systems with preventive maintenance scheduling",
      "Automate compliance documentation for hours of service and regulatory requirements",
      "Create driver training programs that improve safety and efficiency metrics",
    ],
    advancedExamples: [
      "A logistics company used AI route optimization to reduce fuel costs by 18% across their fleet, saving $90k annually while improving on-time delivery rates to 98%",
      "A trucking operation deployed AI compliance tracking to eliminate DOT violations entirely, avoiding $50k in potential fines and insurance surcharges",
    ],
  },
};

export function getCategoryElevated(id: string): CategoryElevatedMeta | undefined {
  return CATEGORY_ELEVATED[id];
}
