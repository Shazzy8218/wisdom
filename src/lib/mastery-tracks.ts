// Mastery Tier — Advanced certification-level tracks for elite practitioners

export interface MasteryTrackMeta {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  valueProp: string;
  pillars: { title: string; description: string }[];
  whyCollegeLevel: string;
  color: string;
}

export const MASTERY_TRACKS: MasteryTrackMeta[] = [
  {
    id: "revenue-machine",
    name: "Autonomous Revenue Machine Blueprint",
    icon: "🏗️",
    tagline: "Build self-running revenue systems powered by AI.",
    valueProp: "Design, deploy, and scale autonomous income engines — from lead generation to fulfillment — that operate 24/7 with minimal human intervention, targeting $10k–$100k/month in recurring revenue.",
    pillars: [
      { title: "Revenue Architecture Design", description: "Map high-margin offers, pricing psychology, and multi-channel acquisition funnels that convert cold traffic into paying customers at scale." },
      { title: "AI-Driven Sales Automation", description: "Build end-to-end sales pipelines with AI-powered outreach, objection handling, follow-up sequences, and qualification scoring — eliminating manual prospecting entirely." },
      { title: "Fulfillment & Delivery Systems", description: "Automate client onboarding, service delivery, and quality assurance using AI workflows that maintain white-glove service at 10x volume." },
      { title: "Revenue Optimization & Scaling", description: "Deploy AI analytics to identify revenue leaks, optimize LTV:CAC ratios, and systematically scale winning channels from $1k to $100k/month." },
    ],
    whyCollegeLevel: "This track teaches systems thinking and financial engineering typically found in MBA programs, combined with hands-on AI automation that most business schools haven't caught up to. Graduates build real revenue infrastructure, not theoretical frameworks.",
    color: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    id: "ai-strategist",
    name: "AI Strategic Advantage Architect",
    icon: "🎯",
    tagline: "Become the person organizations hire to transform their AI strategy.",
    valueProp: "Master the rare skill of translating business objectives into AI implementation roadmaps — the highest-paid consulting skill in the market, commanding $200–$500/hour.",
    pillars: [
      { title: "Enterprise AI Assessment", description: "Conduct comprehensive AI readiness audits across operations, identifying high-ROI automation opportunities and building executive-ready transformation proposals." },
      { title: "Implementation Roadmapping", description: "Design phased AI deployment strategies with clear milestones, risk mitigation, change management protocols, and measurable success criteria." },
      { title: "Stakeholder Alignment & Communication", description: "Master the art of translating technical AI capabilities into business value language that C-suite executives and board members act on." },
      { title: "Competitive Intelligence & Moat Building", description: "Use AI to build proprietary data advantages, workflow IP, and process innovations that create defensible competitive positions for clients." },
    ],
    whyCollegeLevel: "Strategic AI consulting combines skills from management consulting, technology architecture, and organizational psychology — disciplines requiring years of graduate study. This track compresses that knowledge into actionable frameworks with direct client application.",
    color: "from-blue-500/20 to-blue-600/5",
  },
  {
    id: "content-empire",
    name: "Content Empire Engine",
    icon: "📡",
    tagline: "Build a media brand that generates authority and income at scale.",
    valueProp: "Create a multi-platform content operation that produces 100x more output than competitors, builds category authority, and generates $5k–$50k/month through monetization — all powered by AI-amplified creativity.",
    pillars: [
      { title: "Content Strategy & Positioning", description: "Define a unique editorial angle, audience persona, and content moat that makes you the go-to voice in your niche — impossible to replicate." },
      { title: "AI-Powered Production Pipeline", description: "Build workflows that transform one core idea into 15+ pieces across blog, video, podcast, social, and email — maintaining authentic voice at industrial scale." },
      { title: "Audience Growth & Monetization", description: "Deploy AI-optimized distribution, engagement loops, and revenue models (sponsorships, products, services, affiliates) that turn attention into income." },
      { title: "Brand IP & Long-Term Value", description: "Package your content into proprietary frameworks, courses, and intellectual property that compound in value and create passive revenue streams." },
    ],
    whyCollegeLevel: "This track combines journalism, marketing science, and media economics — skills traditionally requiring a communications degree plus years of industry experience. Graduates build real media businesses, not social media hobbies.",
    color: "from-purple-500/20 to-purple-600/5",
  },
  {
    id: "deal-architect",
    name: "AI Deal Architect & Negotiation Mastery",
    icon: "🤝",
    tagline: "Close bigger deals faster with AI-powered negotiation intelligence.",
    valueProp: "Master AI-enhanced negotiation, deal structuring, and relationship management to consistently close deals 2–5x larger than your current average — whether selling services, products, or partnerships.",
    pillars: [
      { title: "Pre-Deal Intelligence", description: "Use AI to research counterparties, model deal scenarios, identify leverage points, and prepare negotiation strategies that anticipate every objection." },
      { title: "Value Framing & Proposal Engineering", description: "Build proposals and pitch decks that anchor on value, not price — using AI to quantify ROI and create irresistible offer structures." },
      { title: "Negotiation Execution", description: "Deploy AI-generated scripts, concession strategies, and real-time analysis frameworks to control conversations and close with confidence." },
      { title: "Relationship Capital & Pipeline Architecture", description: "Build AI-powered CRM workflows that nurture relationships at scale, turning one-time deals into recurring revenue partnerships." },
    ],
    whyCollegeLevel: "Negotiation science is a graduate-level discipline combining behavioral economics, game theory, and persuasion psychology. This track delivers those frameworks with AI-powered tools that give practitioners an unfair advantage in any deal room.",
    color: "from-amber-500/20 to-amber-600/5",
  },
  {
    id: "automation-ops",
    name: "AI Operations & Automation Commander",
    icon: "⚙️",
    tagline: "Eliminate 80% of operational overhead with intelligent automation.",
    valueProp: "Design and deploy AI-powered operational systems that cut costs by 40–60%, eliminate human error in critical workflows, and free leadership to focus exclusively on growth and strategy.",
    pillars: [
      { title: "Operations Audit & Automation Mapping", description: "Systematically identify every automatable process across an organization, prioritized by ROI, complexity, and strategic impact." },
      { title: "Workflow Design & AI Integration", description: "Build production-grade automated workflows using AI for document processing, communication, scheduling, quality control, and decision support." },
      { title: "Error Reduction & Quality Systems", description: "Deploy AI-powered quality gates, anomaly detection, and compliance monitoring that catch mistakes before they become costly problems." },
      { title: "Scale & Optimization", description: "Continuously improve automated systems with AI analytics — measuring throughput, identifying bottlenecks, and optimizing for maximum efficiency at scale." },
    ],
    whyCollegeLevel: "Operations management and industrial engineering are rigorous academic disciplines. This track delivers their core principles with modern AI tools, creating practitioners who can transform any organization's efficiency — a skill set worth $150k+ in annual salary.",
    color: "from-cyan-500/20 to-cyan-600/5",
  },
  {
    id: "personal-brand-ceo",
    name: "Personal Brand CEO",
    icon: "👑",
    tagline: "Turn your expertise into a 7-figure personal brand.",
    valueProp: "Build a personal brand ecosystem — from thought leadership to product suite — that positions you as the undisputed authority in your niche, generating $10k–$100k/month through multiple revenue streams.",
    pillars: [
      { title: "Authority Positioning & Niche Domination", description: "Use AI to identify underserved niches, craft a compelling origin story, and build a positioning strategy that makes you the obvious choice in your market." },
      { title: "Product Suite Architecture", description: "Design a tiered offer stack — from free lead magnets to premium programs — that captures value at every price point and maximizes lifetime customer value." },
      { title: "Audience Acquisition & Community Building", description: "Deploy AI-optimized growth strategies across platforms, building a loyal community that sells for you through word-of-mouth and social proof." },
      { title: "Systems & Team Building", description: "Automate operations, hire strategically, and build a lean team (human + AI) that runs your brand as a business, not a one-person show." },
    ],
    whyCollegeLevel: "Building a personal brand at scale requires skills from entrepreneurship, marketing, psychology, and media production — a multidisciplinary combination rarely taught in any single program. This track delivers the complete playbook with AI acceleration.",
    color: "from-rose-500/20 to-rose-600/5",
  },
  {
    id: "data-decision",
    name: "Data-Driven Decision Dominance",
    icon: "📊",
    tagline: "Make every decision backed by data — instantly.",
    valueProp: "Master AI-powered data analysis, visualization, and decision frameworks that transform raw information into strategic advantage — making you the most data-literate person in any room.",
    pillars: [
      { title: "Data Literacy & AI Analysis", description: "Learn to ask the right questions of any dataset, use AI to extract patterns, and translate findings into actionable business intelligence — no coding required." },
      { title: "Decision Frameworks & Risk Modeling", description: "Deploy proven decision science frameworks enhanced with AI scenario modeling, Monte Carlo simulations, and probabilistic thinking." },
      { title: "Visual Storytelling & Stakeholder Influence", description: "Transform data into compelling narratives with AI-generated visualizations, dashboards, and presentations that drive executive action." },
      { title: "Predictive Intelligence & Strategic Foresight", description: "Use AI to identify trends before competitors, model future scenarios, and build early-warning systems that give organizations months of strategic lead time." },
    ],
    whyCollegeLevel: "Data science and decision theory are graduate-level disciplines requiring statistics, probability, and domain expertise. This track makes those capabilities accessible through AI tools, creating data-empowered leaders who command premium compensation.",
    color: "from-indigo-500/20 to-indigo-600/5",
  },
];

export function getMasteryTrack(id: string): MasteryTrackMeta | undefined {
  return MASTERY_TRACKS.find(t => t.id === id);
}
