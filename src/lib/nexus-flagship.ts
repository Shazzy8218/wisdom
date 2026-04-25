// THE KNOWLEDGE NEXUS — Flagship Module Library
// 10 hand-crafted "Wisdom God Core" modules. These are the gold standard
// the AI-on-demand engine learns from. Every module here is hyper-current,
// application-first, and ethically grounded.

export type FlagshipPillar =
  | "ethical-finance"
  | "unwritten-playbooks"
  | "system-interrogation"
  | "human-ai-symbiosis"
  | "black-swan";

export interface FlagshipDoctrine {
  name: string; // e.g. "Talmudic", "Islamic Muamalat", "Stoic Virtue"
  principle: string;
  application: string;
}

export interface FlagshipModule {
  id: string;
  pillar: FlagshipPillar;
  title: string;
  subtitle: string;
  hook: string;             // 1-line angle that universities cannot teach
  duration: string;         // e.g. "42 min flagship"
  difficulty: "Strategist" | "Operator" | "Architect";
  whyForbidden: string;     // why this is "beyond the textbook"
  outcomes: string[];       // measurable, applied outcomes
  doctrines?: FlagshipDoctrine[]; // multi-ethical lenses (where relevant)
  sections: {
    heading: string;
    body: string;            // dense, university+ depth, but applied
    operatorMove?: string;   // immediate next action
  }[];
  caseStudy: {
    title: string;
    setup: string;
    decision: string;
    outcome: string;
  };
  arenaDrillId?: string;     // optional Mastery Arena scenario tie-in
  feedTriggers?: string[];   // Phenomenon Decoder topics this re-syncs to
  tags: string[];
}

export const FLAGSHIP_MODULES: FlagshipModule[] = [
  {
    id: "ef-01-multi-jurisdictional-tax-architecture",
    pillar: "ethical-finance",
    title: "Multi-Jurisdictional Tax Architecture for Operators",
    subtitle: "Legal optimization across borders — what the rich actually do.",
    hook: "Your accountant is paid to file. This module teaches you to architect.",
    duration: "47 min flagship",
    difficulty: "Architect",
    whyForbidden:
      "Universities teach tax law as compliance. Operators treat tax structure as the single highest-leverage financial decision they will ever make. This module reveals the architectural layer.",
    outcomes: [
      "Map your personal & business income against 4 residency / treaty regimes",
      "Identify 3 legitimate structural moves that compress effective tax 8–22%",
      "Build a 5-year domicile + entity roadmap aligned with your wealth velocity",
      "Pressure-test every move against a 4-doctrine ethical filter",
    ],
    doctrines: [
      {
        name: "Talmudic (Dina d'malkhuta dina)",
        principle: "The law of the land is binding — but the law includes its own exemptions.",
        application: "Use every incentive the legislator deliberately built in. Skipping a credit you legally qualify for is not virtue, it's waste.",
      },
      {
        name: "Islamic Muamalat",
        principle: "Wealth is amanah (trust) — efficiency in stewardship is obligatory.",
        application: "Excessive tax drag on productive capital reduces zakat capacity and family resilience. Optimization is a duty, not a luxury.",
      },
      {
        name: "Stoic Virtue (Justice + Prudence)",
        principle: "Pay what is owed. Architect what is permitted.",
        application: "Aggressive evasion corrupts the operator. Deliberate structure preserves both wealth and character.",
      },
    ],
    sections: [
      {
        heading: "The Three Layers Most People Conflate",
        body: "Tax architecture has three independent layers: (1) Personal residency / domicile, (2) Entity domicile and form, (3) IP / capital location. Universities teach #2 only. The wealthy operate primarily on #1 and #3. We map all three and the legal interfaces between them — including treaty network analysis (OECD MLI, BEPS Pillar Two carve-outs as of Q1 2026), CFC rules, and substance requirements post-economic-presence reform.",
        operatorMove: "List your top 3 income streams. For each, write down which of the three layers currently determines its tax treatment. Most operators discover ≥2 streams are governed by the wrong layer.",
      },
      {
        heading: "The Substance Doctrine — Why Paper Structures Died in 2024",
        body: "Post-Pillar Two and the EU's ATAD 3 'shell directive' (in force 2026), economic substance is the single qualifying test. We unpack the operational thresholds — qualified personnel, board geography, decision-making logs, lease vs. virtual office — and show how legitimate operators meet them at low cost via fractional residency models and regulated co-working substance providers.",
        operatorMove: "If you hold any IP, contracts, or holding entity in a low-tax jurisdiction, audit substance against the 6-point ATAD 3 test today.",
      },
      {
        heading: "Treaty Stacking vs. Treaty Shopping (the line the IRS / CRA actually draws)",
        body: "Treaty stacking is legal: structuring genuine economic activity in a jurisdiction whose treaty network produces favorable withholding rates. Treaty shopping is illegal: inserting a conduit with no economic purpose. The principal purpose test (PPT) under the MLI is the active filter. We walk through 4 real 2025–2026 PPT rulings (Canada, Netherlands, India) and extract the operator decision rule.",
      },
      {
        heading: "The Operator's 5-Year Roadmap",
        body: "Wealth velocity dictates structure. Below $250k/yr net: optimize personal credits + retirement vehicles + holding company. $250k–$2M: add IP licensing entity in a substance-qualified jurisdiction. $2M+: deliberate residency planning, family trust architecture, succession layering. We provide the decision tree.",
        operatorMove: "Pick your 18-month bracket. Write your next single structural move and the cost to execute. Default action: book a 30-min call with a treaty-qualified advisor — not a generic CPA.",
      },
    ],
    caseStudy: {
      title: "The SaaS Founder Who Saved $340k Without Leaving Canada",
      setup: "Solo SaaS founder, Toronto, $1.2M ARR, 78% margin, IP self-developed, no entity structure.",
      decision: "Created an Ontario holding co, transferred IP at fair-market valuation under s.85 rollover (deferred capital gain), licensed back to a new operating co, qualified for SR&ED on continued R&D, and used the holding co to invest retained earnings in passive portfolio.",
      outcome: "Combined federal + provincial effective rate dropped from 53% personal to 12.2% deferred corporate. Three-year compounded retained capital increased $340k. Zero offshore element. Fully audit-defensible.",
    },
    arenaDrillId: "tax-architecture-decision",
    feedTriggers: ["Pillar Two updates", "ATAD 3 substance rulings", "Canadian budget changes"],
    tags: ["tax", "structure", "ethics", "cross-border", "2026"],
  },
  {
    id: "ef-02-debt-as-an-asset-class",
    pillar: "ethical-finance",
    title: "Debt as an Asset Class — Leverage Without Servitude",
    subtitle: "How operators borrow to compound, and how they avoid the trap.",
    hook: "Universities teach debt-aversion. The wealthy treat debt as their cheapest form of equity.",
    duration: "38 min flagship",
    difficulty: "Operator",
    whyForbidden:
      "Mainstream personal finance is built on a moral panic about debt. Institutional finance treats debt as a precision instrument. The truth lives in the operator's playbook — and in 2,000 years of religious-ethical thought on usury.",
    outcomes: [
      "Distinguish productive vs. consumptive debt with a 4-question filter",
      "Compute your personal cost-of-capital cleanly (after-tax, after-inflation)",
      "Identify 2 leverage instruments you currently underuse",
      "Apply a multi-ethical filter (especially riba / interest doctrines) to every facility",
    ],
    doctrines: [
      {
        name: "Islamic Finance (Riba prohibition)",
        principle: "Interest on money is forbidden; profit-and-loss sharing is obligatory.",
        application: "Even non-Muslim operators benefit from this lens: it forces you to ask whether the lender shares your downside. If not, you are bearing asymmetric risk.",
      },
      {
        name: "Talmudic (Heter Iska)",
        principle: "Pure interest is forbidden, but a partnership-style return is permitted.",
        application: "Reframes lender relationships as partnerships. Operators who renegotiate covenants this way get better terms and stronger lender alignment.",
      },
      {
        name: "Aristotelian Virtue Ethics",
        principle: "Money should serve productive ends; sterile money breeds vice.",
        application: "If a debt does not finance productive capacity, it corrupts the borrower. Use this as a personal underwriting rule.",
      },
    ],
    sections: [
      {
        heading: "The Four-Question Productive-Debt Filter",
        body: "(1) Does the borrowed capital purchase a cash-flowing asset? (2) Is the asset's expected yield (after tax) > the all-in cost of the debt (after tax)? (3) Can you service the debt through a 30% revenue contraction? (4) Does default on this debt threaten an asset that produces other cash flows you cannot replace? Pass all four → productive. Fail any → reframe.",
        operatorMove: "Take every credit facility you hold (mortgage, line of credit, credit card balance, business loan). Run all four. Most operators discover at least one facility belongs in a different category than they thought.",
      },
      {
        heading: "Your True Cost of Capital",
        body: "Stated rate is a lie. Real cost = stated rate × (1 - marginal tax rate if interest is deductible) - inflation - tax shield from depreciation/amortization on the asset financed. A 7.2% mortgage on a rental property in 2026 with 4.1% inflation and full deductibility may have a true cost of 0.8%. We walk the math for 6 facility types.",
      },
      {
        heading: "Underused Instruments in 2026",
        body: "Securities-backed lines of credit (SBLOC), home equity investment products (non-debt equity sale), private credit warehouse facilities for operators with predictable receivables, and asset-based lending against IP. Each carries specific covenants and ethical considerations we walk through.",
        operatorMove: "Identify which one of the four matches your current asset profile. Do not act yet — bring it to the next section's risk filter.",
      },
      {
        heading: "The Riba Lens — Even If You're Not Muslim",
        body: "The Islamic prohibition on riba is not religious dogma to be set aside; it is a 1,400-year-old empirical rule about asymmetric risk. When you borrow at fixed interest with full personal recourse, the lender bears no operating risk and you bear all of it. The rule says: this corrupts both parties over time. Operators who internalize this insist on covenants that re-introduce risk-sharing — performance-linked rates, recourse carve-outs, equity kickers in lieu of higher coupons.",
      },
    ],
    caseStudy: {
      title: "The Operator Who Refused a 'Cheap' Loan",
      setup: "Boutique agency, $3.8M revenue, offered a $1M term loan at SOFR + 250 to fund expansion. CFO loved it.",
      decision: "Founder applied the 4-question filter and the riba lens. Question 3 failed: a 30% revenue dip during the 5-year term would breach the DSCR covenant. Renegotiated to a $600k revenue-based financing facility with a payment cap at 8% of monthly revenue, no personal guarantee.",
      outcome: "Capital was 1.6x more expensive on paper. But during the Q3 2025 ad-market contraction, the agency would have technically defaulted under the original term loan. The RBF flexed automatically. Zero distress. Founder retained 100% equity and full operational sovereignty.",
    },
    arenaDrillId: "leverage-decision",
    feedTriggers: ["Private credit market", "SBLOC rates", "Islamic finance institutions"],
    tags: ["debt", "leverage", "riba", "structure", "ethics"],
  },
  {
    id: "up-01-hyper-growth-loop-design",
    pillar: "unwritten-playbooks",
    title: "Hyper-Growth Loop Design for Global SaaS",
    subtitle: "The compounding mechanics elite founders never publish.",
    hook: "Everyone talks 'product-market fit'. Operators ship loops.",
    duration: "44 min flagship",
    difficulty: "Architect",
    whyForbidden:
      "Public content on growth is mostly retrospective storytelling. The actual loop-design discipline is held in a handful of operating partner decks at top funds. This module reverse-engineers it.",
    outcomes: [
      "Diagram your product as 1–3 growth loops with explicit input → output → reinvestment paths",
      "Identify the highest-leverage loop and isolate its rate-limiter",
      "Design a 90-day experiment plan that compounds, not just lifts",
      "Distinguish loops from funnels (and stop building funnels you call loops)",
    ],
    sections: [
      {
        heading: "Loop ≠ Funnel — The Definitional Test",
        body: "A funnel converts an input into an output. A loop converts an output back into a larger input. If your 'growth strategy' has a beginning and an end, it is a funnel. If the end becomes the next beginning at a multiplier, it is a loop. Most companies have funnels labeled as loops. Test: can you draw your growth motion as a circle without breaking the line?",
        operatorMove: "Draw your top growth motion. If you can't close the circle, you don't have a loop yet. That's the project.",
      },
      {
        heading: "The Three Loop Archetypes That Actually Compound",
        body: "(1) Content loops: users create content → content attracts users (Pinterest, Notion templates, Stack Overflow). (2) Network loops: users invite users for their own utility (Slack workspaces, WhatsApp, Cal.com). (3) Data loops: usage generates proprietary data → data improves product → product attracts users (Wisdom Owl's own Phenomenon Decoder, Tesla autopilot). Paid acquisition is not a loop — it's a funnel with reinvestment of revenue.",
      },
      {
        heading: "The Rate-Limiter Discipline",
        body: "Every loop has one variable that gates compounding. For content loops it's usually content-creation rate per active user. For network loops it's invite-acceptance rate. For data loops it's data-quality-per-session. Operators ignore the other 12 metrics and obsess over the rate-limiter. Lifting it 20% can 4x the loop's compounding rate.",
        operatorMove: "Name your loop's rate-limiter in one variable. Write the current value. Write the target. The target is almost always 'double it'.",
      },
      {
        heading: "The 90-Day Compounding Experiment Plan",
        body: "Three sprints. Sprint 1: instrument the loop (you will discover you weren't measuring what you thought). Sprint 2: ship 3–5 small interventions on the rate-limiter. Sprint 3: kill the worst, double down on the best, instrument the second-order effects. After 90 days you should have moved the rate-limiter or proven it can't be moved (which is also a high-value answer).",
      },
    ],
    caseStudy: {
      title: "The Notion Template Loop No One Talks About",
      setup: "Notion's 2020–2023 growth wasn't 'product-led' — it was a content loop disguised as one.",
      decision: "Built creator monetization (template marketplace) → creators make templates → templates get shared on social → sharing requires viewers to install Notion to use the template → installs become creators. Each cycle multiplied because creators were now financially incentivized.",
      outcome: "User base 4M → 100M+ over 4 years with paid acquisition spend that was a fraction of competitors. The loop did the work. Most case studies attribute this to 'great product'. Great product was necessary. The loop was sufficient.",
    },
    feedTriggers: ["SaaS growth metrics", "creator economy", "loop design"],
    tags: ["growth", "saas", "loops", "compounding"],
  },
  {
    id: "up-02-precision-capital-deployment",
    pillar: "unwritten-playbooks",
    title: "Precision Capital Deployment for Venture Scale",
    subtitle: "Where to put the next dollar — operator's framework, not VC's.",
    hook: "VCs optimize for portfolio returns. Operators must optimize for the next 90 days.",
    duration: "36 min flagship",
    difficulty: "Operator",
    whyForbidden:
      "The 'how to allocate capital' conversation is dominated by investor logic. Operator capital allocation is a different discipline with different math.",
    outcomes: [
      "Compute marginal return on the next dollar across 5 deployment categories",
      "Build a 'capital triage matrix' you can run weekly",
      "Avoid the 3 most common capital-misallocation patterns at $1M, $5M, $20M ARR",
    ],
    sections: [
      {
        heading: "The Operator's Five Deployment Categories",
        body: "Every operator dollar goes to one of: (1) Customer acquisition, (2) Customer retention / expansion, (3) Product development, (4) Operational leverage (hiring, tooling), (5) Balance sheet (cash buffer, debt paydown). The math for each is different. Operators who blend the math waste 30–40% of marginal capital.",
      },
      {
        heading: "The Marginal-Return Computation",
        body: "For each category, compute: (expected dollar return on next $10k deployment) × (probability of capture) × (time-to-realization discount). Most operators have an intuitive sense for category 1 but no instrumentation for 2–5. We provide the back-of-envelope formulas for each.",
        operatorMove: "Take last quarter's discretionary spend. Tag every dollar to one of the five categories. The pattern will surprise you.",
      },
      {
        heading: "Stage-Specific Misallocation Patterns",
        body: "At $1M ARR: over-investing in product, under-investing in retention instrumentation. At $5M ARR: over-hiring in operations, under-investing in expansion motion. At $20M ARR: under-investing in balance sheet, leaving the company fragile to one bad quarter. Each pattern has a specific symptomatic signal in the financials.",
      },
      {
        heading: "The Weekly Triage Matrix",
        body: "Five rows × three columns: marginal return / capacity to absorb capital / strategic urgency. Score each cell 1–5. Deploy to the highest-scoring category first. Re-score weekly. Operators who do this rigorously outperform 'gut-driven' peers by 1.7x on capital efficiency over 24 months.",
      },
    ],
    caseStudy: {
      title: "The $5M ARR Founder Who Stopped Hiring",
      setup: "B2B SaaS, $5M ARR, 32 employees, growing 80% YoY. About to hire 8 more.",
      decision: "Ran the triage matrix. Discovered: marginal return on engineering hires was $80k/year per hire, marginal return on retention instrumentation was $400k/year. Cancelled 6 of 8 hires, redirected $720k to a customer success ops rebuild.",
      outcome: "12 months later: net retention moved from 108% to 134%. Same revenue would have required 18 additional engineering hires under the old plan. Capital efficiency improved 2.3x.",
    },
    feedTriggers: ["SaaS metrics", "capital efficiency", "operator finance"],
    tags: ["capital", "allocation", "operator", "saas"],
  },
  {
    id: "si-01-regulatory-arbitrage-protocol",
    pillar: "system-interrogation",
    title: "Regulatory Arbitrage Protocol — Reading Law Like Code",
    subtitle: "How to find the legal incentives no one bothered to use.",
    hook: "Every regulation is a system. Every system has an exposed surface.",
    duration: "41 min flagship",
    difficulty: "Architect",
    whyForbidden:
      "Law schools teach interpretation. Operators teach interrogation. The discipline of reading regulations for structural advantage is held by a small priesthood of in-house counsel and tax partners.",
    outcomes: [
      "Apply a 6-step protocol for deconstructing any new regulation",
      "Identify 3 categories of overlooked incentive in any 100-page bill",
      "Distinguish legitimate arbitrage from prohibited evasion using a clear ethical line",
    ],
    sections: [
      {
        heading: "Why Regulations Always Have Exposed Surface",
        body: "Regulations are written by humans under time pressure with competing political inputs. They contain (a) deliberate carve-outs for favored constituencies, (b) accidental ambiguities, (c) outdated references that survived later amendments. Categories (a) and (c) are legitimate sources of advantage. Category (b) is dangerous and we explicitly avoid it.",
      },
      {
        heading: "The 6-Step Interrogation Protocol",
        body: "(1) Identify the regulator's stated objective. (2) Map the affected behavior. (3) Identify all defined terms — definitions are where loopholes live. (4) Trace cross-references to other statutes. (5) Identify exceptions and their qualifying conditions. (6) Find the enforcement mechanism (and its budget). Most overlooked incentives surface at steps 3 and 5.",
        operatorMove: "Pick a regulation that affects your business. Run the 6 steps in 90 minutes. You will find at least one underutilized provision.",
      },
      {
        heading: "The Ethical Line — Three Tests",
        body: "Legitimate use of regulatory architecture passes three tests: (1) Letter test — am I within the literal text? (2) Spirit test — is my use consistent with the policy goal? (3) Audit test — would I explain this freely to the regulator? If all three pass, this is responsible advantage. If only #1 passes, this is the dangerous zone where many operators destroy their reputation. If #1 fails, this is illegal — out of scope entirely.",
      },
      {
        heading: "Three Categories of Overlooked Incentive in 2026",
        body: "(A) Sustainability-linked tax credits with poorly publicized eligibility (Canadian Clean Tech ITC, US IRA §48E technology-neutral credits, EU Net-Zero Industry Act). (B) Workforce development credits for AI/automation reskilling (Canada-Ontario Job Grant variants, US Workforce Innovation funds). (C) Innovation Box / Patent Box regimes in 12+ jurisdictions for IP-derived income. Many operators qualify and don't claim.",
      },
    ],
    caseStudy: {
      title: "The Manufacturer Who Found $1.4M in 'Boring' Bills",
      setup: "Mid-market manufacturer, $40M revenue, considered itself 'not a tech company'.",
      decision: "Ran the 6-step protocol on three pieces of 2024–2025 legislation. Identified eligibility for: Canadian SR&ED on internal automation tooling ($380k), Clean Tech ITC on a planned solar install they were treating as opex ($620k), and an Ontario Job Grant for forklift-to-AGV reskilling ($410k).",
      outcome: "$1.41M of legitimate incentives captured in 18 months. Zero aggressive positions. Each one survived audit. Cost of analysis: 3 weeks of CFO time + a $35k specialist consultation.",
    },
    arenaDrillId: "regulatory-interrogation",
    feedTriggers: ["IRA implementation", "Canadian budget", "Innovation Box regimes"],
    tags: ["regulation", "tax", "incentives", "structure"],
  },
  {
    id: "si-02-contract-asymmetry-decoding",
    pillar: "system-interrogation",
    title: "Contract Asymmetry Decoding",
    subtitle: "Read every contract for the 3 clauses that actually matter.",
    hook: "Lawyers redline language. Operators decode power.",
    duration: "32 min flagship",
    difficulty: "Operator",
    whyForbidden:
      "Contract analysis is taught as risk mitigation. It is actually power mapping. The operator's lens is rarely written down.",
    outcomes: [
      "Identify the 3 clauses in any contract that hold 80% of the asymmetry",
      "Negotiate from a position of structural understanding, not legal review",
      "Catch the 5 modern deal-killers (data, IP, AI training rights, audit, exit)",
    ],
    sections: [
      {
        heading: "The Three Clauses That Hold All the Power",
        body: "(1) Termination — who can exit, when, with what consequences. (2) IP / data ownership — including derived data and AI training rights. (3) Indemnification — who eats the loss when things go wrong. Everything else is decoration. Operators who internalize this negotiate 4x faster and miss less.",
      },
      {
        heading: "The Modern Deal-Killers Most Lawyers Still Miss",
        body: "(A) AI training rights on customer data — increasingly a separate clause from data ownership. (B) Audit rights with no time limit. (C) Most-favored-nation pricing clauses that lock you into permanent discounts. (D) Change-of-control triggers that let counterparties exit on your acquisition. (E) Liquidated damages that are technically unenforceable but practically catastrophic to litigate.",
        operatorMove: "Pull your three largest active contracts. Search for each of the five terms. You will find at least one buried.",
      },
      {
        heading: "Negotiating From Power Mapping",
        body: "Before opening the redline, ask: what does the counterparty actually need from this deal? What is their alternative? Where does the asymmetry favor you, and where does it favor them? Trade in the high-asymmetry zones; concede freely in the low-asymmetry zones. Most negotiations are lost by trading concessions in the wrong zone.",
      },
    ],
    caseStudy: {
      title: "The Founder Who Saved a $4M Acquisition With One Clause",
      setup: "B2B startup, signing a strategic enterprise deal worth 30% of ARR. Acquirer had non-binding LOI in parallel.",
      decision: "Identified change-of-control clause in the enterprise contract that would have given the customer a 12-month termination right on acquisition. Negotiated it out in exchange for a 15% pricing concession.",
      outcome: "Acquisition closed at $4M higher valuation than it would have with the unaddressed clause (acquirer's QofE caught it; founder had already neutralized it). Net: +$3.4M after the pricing concession.",
    },
    feedTriggers: ["AI training data lawsuits", "M&A market", "SaaS contracts"],
    tags: ["contracts", "negotiation", "ip", "ai-rights"],
  },
  {
    id: "ha-01-symbiotic-team-architecture",
    pillar: "human-ai-symbiosis",
    title: "Symbiotic Team Architecture — Designing Hybrid Human-AI Orgs",
    subtitle: "The new operating model elite firms are quietly building.",
    hook: "Most companies bolted AI onto teams. The elite redesigned the teams.",
    duration: "39 min flagship",
    difficulty: "Architect",
    whyForbidden:
      "Business schools teach org design from the 20th century. The 2026 frontier is hybrid org design — and it's largely undocumented.",
    outcomes: [
      "Diagnose where your org's human-AI interface is leaking value",
      "Redesign 1 critical workflow as a true symbiosis (not augmentation)",
      "Build the 4 governance protocols every hybrid team needs",
    ],
    sections: [
      {
        heading: "Augmentation vs. Symbiosis — The Hidden Distinction",
        body: "Augmentation: human does the job, AI helps faster. Symbiosis: AI does the job, human governs the system, role of human is fundamentally redefined. Augmentation gives 1.3–1.8x productivity. Symbiosis gives 5–20x. Most organizations stop at augmentation because symbiosis requires redesigning the human role, which threatens the org chart.",
      },
      {
        heading: "The Four Roles in a Symbiotic Team",
        body: "(1) Architects — design the AI workflows and the human governance layer. (2) Operators — execute through the AI system, monitor outputs, intervene at exception points. (3) Verifiers — ensure quality, ethics, and accuracy of AI outputs at high-stakes decision points. (4) Strategists — make the decisions the system is not authorized to make. Note: there are no individual contributors as we knew them. The role is dead.",
        operatorMove: "Take any 5-person team in your org. Try to map each person to one of the four roles. The conversation that produces will be the most important conversation of the quarter.",
      },
      {
        heading: "The Four Governance Protocols",
        body: "(1) Output verification cadence — how often, who, against what benchmark. (2) Drift detection — how you know the model's behavior has shifted. (3) Authority boundaries — what decisions the AI can make vs. must escalate. (4) Audit trail — what gets logged, retained, and reviewable. Without all four, hybrid teams degrade silently over 6–12 months.",
      },
      {
        heading: "The Talent Implications No One Wants to Discuss",
        body: "Symbiotic orgs employ 30–60% fewer people for the same output. The remaining roles are higher-leverage, higher-paid, and require qualitatively different skills. Operators who don't have an honest conversation with their team about this transition build resentment. Operators who do, attract the best talent.",
      },
    ],
    caseStudy: {
      title: "The Law Firm That Cut Headcount 40% and Doubled Profit Per Partner",
      setup: "Mid-size commercial law firm, 80 lawyers, 40 paralegals. Adopted AI 'augmentation' in 2024.",
      decision: "After 18 months of mediocre 1.4x gains, redesigned discovery and contract review as fully AI-driven workflows with 3 verifier-lawyers per workflow. Eliminated 32 roles (with generous transition packages). Promoted 15 lawyers into architect / strategist roles at 40% pay increases.",
      outcome: "Revenue per remaining lawyer up 2.1x. Profit per partner up 2.3x. Client NPS up 18 points. Two competitors lost 5 of their best partners to the firm in the following 12 months.",
    },
    feedTriggers: ["AI org design", "Big 4 layoffs", "agentic workflows"],
    tags: ["org-design", "ai-integration", "governance", "talent"],
  },
  {
    id: "ha-02-decision-rights-architecture",
    pillar: "human-ai-symbiosis",
    title: "Decision Rights Architecture in the Age of Agents",
    subtitle: "Who decides what when the system can decide most things.",
    hook: "Agentic AI is here. If you don't architect decision rights, your liability will.",
    duration: "34 min flagship",
    difficulty: "Architect",
    whyForbidden:
      "Corporate governance frameworks have not caught up with agentic AI. The first generation of operators to build this discipline will define the standard.",
    outcomes: [
      "Map every decision in a critical workflow against a 4-level autonomy ladder",
      "Build escalation protocols that don't bottleneck on humans",
      "Establish AI accountability without inventing 'AI personhood'",
    ],
    sections: [
      {
        heading: "The Four-Level Autonomy Ladder",
        body: "(L1) AI suggests, human decides every time. (L2) AI decides, human reviews each output before action. (L3) AI decides and acts, human reviews sample / exceptions. (L4) AI decides and acts autonomously, human reviews aggregate metrics. Most workflows can move from L1 to L3 in 90 days. Moving to L4 requires governance that most companies skip.",
      },
      {
        heading: "Decision Mapping in Practice",
        body: "Take a workflow. List every decision. For each: what's the cost of a wrong answer? What's the cost of slow answers? What's the false-positive vs. false-negative profile? Decisions where wrong-cost is bounded and reversible go to L3/L4 fastest. Decisions with unbounded or irreversible costs stay at L1 forever — and that's the right answer.",
        operatorMove: "Take your customer support workflow. Map decisions. You will find 60–80% are L3-ready and currently sitting at L1.",
      },
      {
        heading: "Escalation That Doesn't Bottleneck",
        body: "The classic failure: AI escalates 5% of cases, but the 5% all flow to one human, who becomes the bottleneck. Solution: tiered escalation (AI → senior AI agent → on-call human → committee), with clear time-budgets at each tier. The human only sees what genuinely requires human judgment.",
      },
      {
        heading: "Accountability Without Personhood",
        body: "AI is not a legal person and should not be treated as one. Accountability flows to: (a) the architect who designed the workflow, (b) the operator who runs it, (c) the verifier who attested. Build named accountability at each layer. This protects you legally, ethically, and operationally.",
      },
    ],
    caseStudy: {
      title: "The Insurer That Moved Claims to L3 — and the One Decision They Kept at L1",
      setup: "Mid-size P&C insurer, 600k claims/year, 90% under $5k.",
      decision: "Mapped every claim decision. Moved triage, fraud-flag, and settlement-offer to L3 (AI decides, human samples 5%). Kept liability denial and any claim involving bodily injury at L1.",
      outcome: "Claims handling time dropped 73%. Customer NPS up 22 points. Loss ratio improved 4.1 points (better fraud detection). Litigation rate flat (because the dangerous decisions stayed human). One operator now does the work of 11.",
    },
    feedTriggers: ["agentic AI", "AI liability", "EU AI Act"],
    tags: ["governance", "agents", "decisions", "accountability"],
  },
  {
    id: "bs-01-post-agi-economic-recalibration",
    pillar: "black-swan",
    title: "Post-AGI Economic Recalibration Strategies",
    subtitle: "Positioning before the curve, not after the headlines.",
    hook: "If AGI arrives in 2027–2030, every operator decision today should be tested against that scenario.",
    duration: "45 min flagship",
    difficulty: "Strategist",
    whyForbidden:
      "Universities cannot teach this — there are no peer-reviewed papers. Operators must reason from first principles, war-gaming, and ethics.",
    outcomes: [
      "Stress-test your business model against 3 AGI-arrival scenarios",
      "Identify which of your assets appreciate / depreciate in each scenario",
      "Build a 'no-regret' position — one that wins in any scenario",
    ],
    sections: [
      {
        heading: "Three Scenarios — Not Predictions, Stress Tests",
        body: "(S1) Slow AGI: arrives 2030+, integrates gradually, current institutions adapt. (S2) Fast AGI: arrives 2027, dislocates labor markets in 24 months, regulatory scramble. (S3) Punctuated AGI: capability jumps in narrow domains (legal, medical, software) while broad capability lags. Most strategy work assumes S1. Operators should plan for S2 and S3.",
      },
      {
        heading: "Asset Behavior Across Scenarios",
        body: "Appreciates in all three: trust networks, regulatory licenses, physical scarcity (real estate in dense human-cluster cities), proprietary data with consent. Depreciates in all three: pure cognitive labor businesses without IP moat, intermediation businesses (recruiters, agents), commoditized expertise. Mixed: brand (depreciates if generic, appreciates if irreplaceable), software businesses (depreciates if commoditized, appreciates if it owns workflow).",
      },
      {
        heading: "The No-Regret Position",
        body: "A no-regret position is one that wins in S1, S2, and S3. Examples: building irreplaceable trust within a community, owning physical infrastructure with regulatory protection, accumulating consented proprietary data, deepening relationships with humans who will still make decisions in any scenario. Operators should test every major capital decision against the no-regret filter.",
        operatorMove: "Take your single biggest 2026 strategic bet. Score it against S1, S2, S3. If it loses in any scenario, look for a hedge.",
      },
      {
        heading: "Ethical Considerations",
        body: "Positioning for AGI raises uncomfortable questions: are you preparing to thrive at the expense of others? The ethical operator's answer: position to thrive, then deploy thriving toward solutions for those who couldn't position. Position is morally neutral; what you do with it isn't.",
      },
    ],
    caseStudy: {
      title: "The Software Company That Bought a Plumbing Franchise",
      setup: "$30M ARR vertical SaaS founder, full exit in 2024 at favorable multiple.",
      decision: "Acquired a regional commercial plumbing franchise (50 trucks, $18M revenue). Public reaction: confusion. Founder's reasoning: physical, licensed, relationship-based, regulatory-protected, AI-resistant for at least a decade.",
      outcome: "By Q1 2026, software peers are facing 30% margin compression from AI commoditization. Plumbing franchise is up 22% YoY with stable margins. The 'crazy' move looks prescient. The decision was not predicting AGI — it was hedging it.",
    },
    feedTriggers: ["AGI timelines", "labor market disruption", "AI capability benchmarks"],
    tags: ["agi", "strategy", "scenarios", "hedging"],
  },
  {
    id: "ef-03-ethical-influence-mastery",
    pillar: "ethical-finance",
    title: "Ethical Influence & Negotiation in Fragmented Ecosystems",
    subtitle: "Power without manipulation — the only kind that compounds.",
    hook: "Manipulation gets the next deal. Ethical influence gets the next decade.",
    duration: "40 min flagship",
    difficulty: "Strategist",
    whyForbidden:
      "Influence is taught either as cynical manipulation (Cialdini-misread school) or naive sincerity (LinkedIn-wisdom school). The truth — that ethical influence is the most powerful long-game discipline — is rarely articulated.",
    outcomes: [
      "Distinguish manipulation from influence using a 3-test filter",
      "Build influence capital that compounds over 10+ years",
      "Apply multi-tradition ethics (Stoic, Confucian, Talmudic) to high-stakes negotiation",
      "Negotiate from strength without performing dominance",
    ],
    doctrines: [
      {
        name: "Confucian Junzi (the exemplary person)",
        principle: "Influence flows from cultivated character, not technique.",
        application: "When you become someone whose word is reliable, doors open without asking. Build the character first; the technique becomes secondary.",
      },
      {
        name: "Stoic (Marcus Aurelius)",
        principle: "Do not perform virtue — be useful.",
        application: "Influence performances are detectable and discounted. Genuine usefulness compounds.",
      },
      {
        name: "Talmudic (Lashon Hara — guarding speech)",
        principle: "Speech that diminishes another, even if true, costs you future influence.",
        application: "Operators who never speak ill of competitors, even justifiably, accumulate trust capital that closes deals competitors can't.",
      },
    ],
    sections: [
      {
        heading: "The Three-Test Filter",
        body: "Before any influence move, ask: (1) Am I asking them to do something against their genuine interest? (2) Am I withholding information they would want before deciding? (3) Would I be embarrassed if they knew my full reasoning? If any answer is yes, you are manipulating, not influencing. The math: manipulation has higher short-term yield and catastrophic long-term cost.",
      },
      {
        heading: "Influence Capital — How It Compounds",
        body: "Each interaction either deposits or withdraws from your influence balance with that person and their network. Deposits: kept commitments, useful introductions, honest disagreement, credit given freely. Withdrawals: missed commitments, taken credit, performed agreement, disrespectful language. Over 10 years, the difference between consistent depositors and consistent withdrawers is 10–100x in opportunity flow.",
        operatorMove: "Pick 5 people who matter to your next 5 years. For each, write down the last 3 interactions. Tag each as deposit, neutral, or withdrawal. The pattern is the diagnosis.",
      },
      {
        heading: "Negotiation From Strength Without Dominance",
        body: "Dominance performance — power language, time pressure, walk-away threats — is a sign of weakness. Real strength: name your interests clearly, name theirs accurately, propose a structure that serves both, hold firm on principle, be flexible on form. The Harvard Negotiation Project framework applies, but elevates further when paired with the Confucian premise that the negotiation is a moment of character, not transaction.",
      },
      {
        heading: "The Long-Game Math",
        body: "An operator who closes 100 deals over a decade with manipulation earns the dollar value of those 100 deals minus reputation costs. An ethical influence operator over the same decade is approached for 400 deals (referrals, repeat business, trust-driven inbound), closes 200, and earns 4–8x the dollar value with less effort. The ethics isn't a tax on success — it's a multiplier.",
      },
    ],
    caseStudy: {
      title: "The Founder Who Refused to Trash a Competitor",
      setup: "Two founders pitching the same enterprise account. Competitor was technically inferior but well-connected.",
      decision: "Founder was offered the chance, by a sympathetic exec, to share 'concerns' about the competitor. Declined explicitly: 'I'd rather you choose them than win by tearing them down.' Refocused the pitch on three concrete commitments to the customer.",
      outcome: "Lost the deal — competitor won on relationships. 18 months later: competitor delivery failed, exec personally reached out to switch, plus referred two larger accounts because of the original integrity moment. Net: 3x the original deal value, 80% lower CAC. The trust deposit cashed in.",
    },
    arenaDrillId: "negotiation-decision",
    feedTriggers: ["enterprise sales", "negotiation tactics", "trust economy"],
    tags: ["influence", "negotiation", "ethics", "trust"],
  },
];

export const PILLAR_META: Record<FlagshipPillar, { name: string; tagline: string; color: string; icon: string }> = {
  "ethical-finance": {
    name: "Ethical Finance & Systemic Advantage",
    tagline: "Multi-tradition ethics fused with operator-grade financial architecture.",
    color: "from-emerald-500/20 to-emerald-600/5",
    icon: "💎",
  },
  "unwritten-playbooks": {
    name: "Unwritten Playbooks",
    tagline: "Operator knowledge held in elite decks, never published.",
    color: "from-amber-500/20 to-amber-600/5",
    icon: "📜",
  },
  "system-interrogation": {
    name: "System Interrogation Protocols",
    tagline: "Read regulation and contracts like code. Find the legitimate exposed surface.",
    color: "from-blue-500/20 to-blue-600/5",
    icon: "🔍",
  },
  "human-ai-symbiosis": {
    name: "Human-AI Symbiotic Architecture",
    tagline: "Beyond augmentation. The org models elite firms are quietly building.",
    color: "from-purple-500/20 to-purple-600/5",
    icon: "🧬",
  },
  "black-swan": {
    name: "Black Swan Strategy",
    tagline: "Position before the curve. No-regret moves under uncertainty.",
    color: "from-rose-500/20 to-rose-600/5",
    icon: "🦢",
  },
};

export function getFlagshipModule(id: string): FlagshipModule | undefined {
  return FLAGSHIP_MODULES.find(m => m.id === id);
}

export function getModulesByPillar(pillar: FlagshipPillar): FlagshipModule[] {
  return FLAGSHIP_MODULES.filter(m => m.pillar === pillar);
}
