// Mastery Track lesson structure — generates lesson stubs for each pillar
// Each pillar has 5 lessons that can be AI-generated on demand

export interface MasteryLesson {
  id: string;
  pillarIndex: number;
  lessonIndex: number;
  title: string;
  objective: string;
  trackId: string;
}

// Pre-defined lesson titles for each pillar across all tracks
const PILLAR_LESSONS: Record<string, string[][]> = {
  "revenue-machine": [
    [
      "Mapping High-Margin Offers & Pricing Psychology",
      "Multi-Channel Acquisition Funnel Design",
      "Cold Traffic Conversion Architecture",
      "Revenue Model Stress Testing with AI",
      "Launch Your First Revenue Funnel",
    ],
    [
      "AI Outreach Sequencing & Personalization",
      "Objection Handling Scripts with AI",
      "Follow-Up Automation & Timing Logic",
      "Lead Scoring & Qualification Systems",
      "Build Your Complete Sales Pipeline",
    ],
    [
      "Client Onboarding Automation Blueprint",
      "AI-Powered Service Delivery Workflows",
      "Quality Assurance at Scale",
      "Client Communication Templates",
      "Deploy Your Fulfillment System",
    ],
    [
      "Revenue Analytics & Leak Detection",
      "LTV:CAC Optimization Framework",
      "Channel Performance Scoring",
      "Scaling Playbook: $1k to $100k/month",
      "Your Revenue Optimization Dashboard",
    ],
  ],
  "ai-strategist": [
    [
      "AI Readiness Audit Framework",
      "ROI-Based Opportunity Identification",
      "Executive Transformation Proposal Writing",
      "Data Infrastructure Assessment",
      "Delivering Your First AI Audit",
    ],
    [
      "Phased Deployment Strategy Design",
      "Risk Mitigation & Change Management",
      "Success Metrics & Milestone Planning",
      "Vendor & Tool Selection Framework",
      "Build a Complete Implementation Roadmap",
    ],
    [
      "Translating Tech to Business Value",
      "C-Suite Presentation Frameworks",
      "Board-Ready AI Strategy Decks",
      "Stakeholder Buy-In Sequences",
      "Present Your First AI Strategy",
    ],
    [
      "Competitive AI Intelligence Gathering",
      "Proprietary Data Advantage Building",
      "Workflow IP & Process Innovation",
      "Defensible Moat Architecture",
      "Design Your Client's Competitive Moat",
    ],
  ],
  "content-empire": [
    [
      "Niche Authority Positioning",
      "Audience Persona Engineering",
      "Content Moat & Editorial Voice",
      "Competitor Content Gap Analysis",
      "Lock In Your Content Strategy",
    ],
    [
      "Core Idea to 15+ Pieces Workflow",
      "AI Voice Calibration & Authenticity",
      "Blog to Social Repurposing Pipeline",
      "Video & Podcast Script Generation",
      "Launch Your Production Pipeline",
    ],
    [
      "AI-Optimized Distribution Playbook",
      "Engagement Loop Architecture",
      "Sponsorship & Affiliate Systems",
      "Product Launch from Content",
      "Activate Your First Revenue Stream",
    ],
    [
      "Framework & IP Packaging",
      "Course Creation from Content Library",
      "Passive Revenue Architecture",
      "Brand Licensing & Partnerships",
      "Build Your Brand IP Portfolio",
    ],
  ],
  "deal-architect": [
    [
      "Counterparty Research with AI",
      "Deal Scenario Modeling",
      "Leverage Point Identification",
      "Objection Anticipation Framework",
      "Prepare Your First Deal Brief",
    ],
    [
      "Value-Anchored Proposal Design",
      "ROI Quantification with AI",
      "Irresistible Offer Structuring",
      "Pitch Deck Engineering",
      "Build Your Signature Proposal",
    ],
    [
      "AI Negotiation Scripts & Frameworks",
      "Concession Strategy & BATNA Analysis",
      "Real-Time Conversation Analysis",
      "Closing Techniques & Confidence Building",
      "Execute Your First AI-Powered Negotiation",
    ],
    [
      "CRM Workflow Automation",
      "Relationship Nurturing at Scale",
      "Recurring Revenue Partnership Design",
      "Pipeline Architecture & Forecasting",
      "Launch Your Deal Pipeline System",
    ],
  ],
  "automation-ops": [
    [
      "Process Mapping & Automation Scoring",
      "ROI Prioritization Matrix",
      "Strategic Impact Assessment",
      "Automation Readiness Checklist",
      "Complete Your Operations Audit",
    ],
    [
      "Document Processing Automation",
      "Communication & Scheduling Workflows",
      "Decision Support System Design",
      "Quality Control Automation",
      "Deploy Your First Workflow",
    ],
    [
      "AI Quality Gates & Anomaly Detection",
      "Compliance Monitoring Systems",
      "Error Prevention Frameworks",
      "Automated Reporting & Alerts",
      "Build Your Quality System",
    ],
    [
      "Throughput Measurement & Analytics",
      "Bottleneck Identification with AI",
      "Continuous Improvement Frameworks",
      "Scaling Automation Across Teams",
      "Optimize Your Operations at Scale",
    ],
  ],
  "personal-brand-ceo": [
    [
      "Niche Identification with AI Research",
      "Origin Story Engineering",
      "Positioning Strategy & Market Gap",
      "Authority Signal Building",
      "Lock Your Positioning Strategy",
    ],
    [
      "Tiered Offer Stack Design",
      "Lead Magnet to Premium Pipeline",
      "Pricing Psychology & Value Ladders",
      "Lifetime Customer Value Optimization",
      "Launch Your Product Suite",
    ],
    [
      "Platform-Specific Growth Playbooks",
      "Community Architecture & Engagement",
      "Social Proof & Testimonial Systems",
      "Word-of-Mouth Amplification",
      "Activate Your Growth Engine",
    ],
    [
      "Operations Automation for Solopreneurs",
      "Strategic Hiring & AI Team Building",
      "Systems That Run Without You",
      "Scaling Beyond the Founder",
      "Build Your Brand Operating System",
    ],
  ],
  "data-decision": [
    [
      "Asking the Right Questions of Data",
      "AI Pattern Extraction Techniques",
      "Business Intelligence Translation",
      "No-Code Data Analysis Workflows",
      "Deliver Your First Data Insight",
    ],
    [
      "Decision Science Frameworks",
      "AI Scenario Modeling & Monte Carlo",
      "Probabilistic Thinking for Leaders",
      "Risk-Reward Analysis Automation",
      "Build Your Decision Framework",
    ],
    [
      "Data Storytelling Fundamentals",
      "AI-Generated Dashboards & Reports",
      "Executive Presentation from Data",
      "Influence Through Visualization",
      "Create Your Stakeholder Dashboard",
    ],
    [
      "Trend Detection & Early Signals",
      "Future Scenario Modeling",
      "Early Warning System Design",
      "Strategic Foresight Frameworks",
      "Deploy Your Predictive Intelligence",
    ],
  ],
};

export function getMasteryLessonsForTrack(trackId: string): MasteryLesson[][] {
  const trackLessons = PILLAR_LESSONS[trackId];
  if (!trackLessons) return [];
  
  return trackLessons.map((pillarLessons, pi) =>
    pillarLessons.map((title, li) => ({
      id: `mastery-${trackId}-p${pi}-l${li}`,
      pillarIndex: pi,
      lessonIndex: li,
      title,
      objective: `Master ${title.toLowerCase()} within the mastery track framework`,
      trackId,
    }))
  );
}

export function getMasteryLessonId(trackId: string, pillarIndex: number, lessonIndex: number): string {
  return `mastery-${trackId}-p${pillarIndex}-l${lessonIndex}`;
}

export function getPillarProgress(trackId: string, pillarIndex: number, completedLessons: string[]): { done: number; total: number } {
  const lessons = PILLAR_LESSONS[trackId]?.[pillarIndex];
  if (!lessons) return { done: 0, total: 0 };
  const done = lessons.filter((_, li) =>
    completedLessons.includes(getMasteryLessonId(trackId, pillarIndex, li))
  ).length;
  return { done, total: lessons.length };
}

export function getTrackProgress(trackId: string, completedLessons: string[]): { done: number; total: number; percent: number } {
  const trackLessons = PILLAR_LESSONS[trackId];
  if (!trackLessons) return { done: 0, total: 0, percent: 0 };
  let done = 0;
  let total = 0;
  for (let pi = 0; pi < trackLessons.length; pi++) {
    const p = getPillarProgress(trackId, pi, completedLessons);
    done += p.done;
    total += p.total;
  }
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function getNextIncompleteLesson(trackId: string, completedLessons: string[]): { pillarIndex: number; lessonIndex: number } | null {
  const trackLessons = PILLAR_LESSONS[trackId];
  if (!trackLessons) return null;
  for (let pi = 0; pi < trackLessons.length; pi++) {
    for (let li = 0; li < trackLessons[pi].length; li++) {
      if (!completedLessons.includes(getMasteryLessonId(trackId, pi, li))) {
        return { pillarIndex: pi, lessonIndex: li };
      }
    }
  }
  return null;
}
