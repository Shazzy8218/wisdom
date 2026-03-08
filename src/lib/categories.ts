// Full 22-category course catalog with detailed content for all tracks
import { CORE_TRACKS, type CoreTrackMeta } from "@/lib/core-tracks";

export interface StarterLesson {
  title: string;
  hook: string;
  difficulty: string;
  content?: string;
  mentalModel?: string;
  commonMistakes?: string;
  upgrade?: string;
  bragLine?: string;
  interaction?: "tap-reveal" | "choice";
  options?: string[];
  correctAnswer?: number;
  tryPrompt?: string;
  xp?: number;
  tokens?: number;
}

export interface CategoryTrack {
  id: string;
  name: string;
  icon: string;
  description: string;
  levels: { level: string; modules: string[] }[];
  starterLessons: StarterLesson[];
  workflows: { title: string; steps: string[] }[];
  prompts: { label: string; prompt: string; level: "beginner" | "pro" }[];
  scenario: { title: string; description: string };
}

function createTrack(t: Omit<CategoryTrack, 'starterLessons' | 'workflows' | 'prompts' | 'scenario'> & Partial<CategoryTrack>): CategoryTrack {
  return {
    ...t,
    starterLessons: t.starterLessons || [],
    workflows: t.workflows || [],
    prompts: t.prompts || [],
    scenario: t.scenario || { title: `A Day in ${t.name}`, description: `Simulate a full day in ${t.name.toLowerCase()} using AI tools.` },
  };
}

export const CATEGORY_TRACKS: CategoryTrack[] = [
  // ======== 1. MANAGEMENT ========
  {
    id: "management", name: "Management", icon: "👔", description: "Lead teams, delegate tasks, and make decisions with AI assistance.",
    levels: [
      { level: "Beginner", modules: ["What AI Can Do for Managers", "Meeting Automation", "Team Communication", "Decision Frameworks", "Delegation Basics"] },
      { level: "Intermediate", modules: ["Performance Reviews with AI", "Strategic Planning", "Conflict Resolution", "Change Management", "Stakeholder Communication"] },
      { level: "Advanced", modules: ["AI-Driven Leadership", "Organizational Design", "Executive Communication", "Crisis Management", "Culture Engineering"] },
    ],
    starterLessons: [
      { title: "AI Meeting Summarizer", hook: "Turn 1-hour meetings into 2-minute summaries.", difficulty: "beginner", content: "Paste your meeting notes into AI with this prompt: 'Summarize into: Key Decisions, Action Items (with owners), Open Questions, Next Steps.' The AI organizes chaos into clarity. Works for any meeting length.", mentalModel: "Input → Structure → Output: Raw notes go in, organized summary comes out. The AI acts as a filter that separates signal from noise.", commonMistakes: "Saying 'summarize this' without specifying the format. You get a wall of text instead of actionable bullets. Always tell AI the exact output structure you want.", upgrade: "Smart managers add 'Who owns each action item? What's the deadline? What's blocked?' to their summary prompt. This turns a summary into a project tracker.", bragLine: "I turn 1-hour meetings into 2-minute action plans using AI.", interaction: "choice", options: ["Key Decisions + Action Items + Next Steps", "Just write 'summarize this'", "Copy the whole transcript", "Only list attendees"], correctAnswer: 0, tryPrompt: "Summarize your last meeting using this format.", xp: 50, tokens: 10 },
      { title: "Decision Matrix with AI", hook: "Make better decisions in 60 seconds.", difficulty: "beginner", content: "Ask AI: 'Create a weighted decision matrix comparing [Option A] vs [Option B]. Criteria: cost, risk, time, impact. Score 1-10 each.' This removes gut-feeling bias and gives you a defensible choice.", mentalModel: "Weighted Score = Sum(Weight × Score). Instead of deciding with your gut, you assign weights to what matters most, then score each option. The math decides.", commonMistakes: "Giving every criterion equal weight. In reality, some factors matter 3x more than others. Always rank your criteria by importance first.", upgrade: "Add a 'regret factor': for each option, ask 'What's the worst case if I pick this and it fails?' Options with low downside + high upside should get bonus points.", bragLine: "I never make gut-feeling decisions anymore — I use weighted matrices.", interaction: "choice", options: ["Weighted matrix with scored criteria", "Flip a coin", "Ask your boss", "Go with the cheapest option"], correctAnswer: 0, tryPrompt: "Use a decision matrix for a choice you're facing this week.", xp: 55, tokens: 10 },
      { title: "Performance Review Generator", hook: "Write fair, specific reviews 5x faster.", difficulty: "intermediate", content: "Use SBI framework with AI: 'Write performance feedback for [employee] using Situation-Behavior-Impact. Situation: [context]. Behavior: [what they did]. Impact: [result].' This produces specific, actionable feedback instead of vague comments.", mentalModel: "SBI Triangle: Situation (when/where) → Behavior (what they did, observable) → Impact (the measurable result). Never describe personality — describe actions and outcomes.", commonMistakes: "Writing feedback like 'You need to be more proactive.' That's vague and feels like an attack. Instead: 'In Tuesday's client call (S), you stayed silent when asked about timelines (B), which made the client doubt our commitment (I).'", upgrade: "After SBI, add a Forward-Looking Question: 'What support do you need to handle this differently next time?' This turns feedback into coaching.", bragLine: "I write reviews that people actually thank me for — specific, fair, and growth-focused.", interaction: "tap-reveal", tryPrompt: "Draft feedback for a team member using SBI.", xp: 65, tokens: 12 },
      { title: "Team Capacity Planner", hook: "Balance workloads using AI analysis.", difficulty: "intermediate", content: "List your team members and their current tasks. Ask AI: 'Analyze this workload distribution. Flag anyone over capacity, suggest redistributions, and identify tasks that can be automated or deferred.'", mentalModel: "Capacity = Available Hours − Allocated Hours. When capacity goes negative, quality drops. Map every person's load visually: green (under 80%), yellow (80-100%), red (over 100%).", commonMistakes: "Assuming everyone has the same capacity. A senior dev and a junior dev can't handle the same workload. Always factor in skill level and task complexity.", upgrade: "Add 'buffer time' to each person (20% for unexpected work). If someone's at 80%+ without buffer, they're actually at risk of burnout.", bragLine: "My team never burns out because I capacity-plan every sprint with AI.", interaction: "choice", options: ["Analyze distribution + flag overload + suggest changes", "Give everyone equal tasks", "Hire more people", "Ignore capacity issues"], correctAnswer: 0, tryPrompt: "Map your team's current workload and run capacity analysis.", xp: 60, tokens: 12 },
      { title: "Delegation Framework", hook: "Know what to delegate and how to brief it.", difficulty: "beginner", content: "The RACI matrix + AI: 'For this project, create a RACI matrix (Responsible, Accountable, Consulted, Informed). Tasks: [list]. Team: [names].' Then for each delegated task, generate a brief: context, expected output, deadline, checkpoints.", mentalModel: "The 70% Rule: If someone can do a task at 70% of your quality, delegate it. You free up time for the 30% only you can do. RACI ensures nothing falls through cracks.", commonMistakes: "Delegating without context. Saying 'handle this' is not delegation — it's abdication. Every delegated task needs: WHY (context), WHAT (deliverable), WHEN (deadline), HOW (checkpoints).", upgrade: "Add 'decision authority' to each delegation: 'You can decide X independently, but check with me on Y.' This prevents bottlenecks and builds trust.", bragLine: "I delegate like a CEO — clear briefs, right people, zero micromanagement.", interaction: "choice", options: ["RACI matrix + task briefs", "Do everything yourself", "Delegate without instructions", "Only delegate to the best performer"], correctAnswer: 0, tryPrompt: "Create a RACI matrix for your current project.", xp: 45, tokens: 8 },
      { title: "1-on-1 Meeting Prep", hook: "AI-generated talking points for every report.", difficulty: "beginner", content: "Before any 1-on-1, prompt: 'Generate talking points for a 1-on-1 with [role]. Cover: wins to acknowledge, growth areas, career development, blockers to address, and one open question.' Takes 30 seconds, makes you a better manager.", mentalModel: "The WGBO Framework: Wins (celebrate), Growth (develop), Blockers (remove), Open (listen). Hit all four in every 1-on-1 and you'll never have a pointless meeting.", commonMistakes: "Using 1-on-1s for status updates. That's what Slack is for. 1-on-1s are for the human stuff: career growth, frustrations, ideas, and trust-building.", upgrade: "End every 1-on-1 by asking: 'What's one thing I could do differently to support you better?' This question alone makes you a top-10% manager.", bragLine: "My team says our 1-on-1s are the most productive meetings they have.", interaction: "tap-reveal", tryPrompt: "Generate talking points for your next 1-on-1.", xp: 50, tokens: 10 },
      { title: "Strategic OKR Builder", hook: "Create aligned objectives in minutes.", difficulty: "intermediate", content: "Prompt: 'Create OKRs for [team/quarter]. Company mission: [X]. Include 3 Objectives, each with 3 Key Results. Key Results must be measurable with specific targets. Add initiatives (tasks) for each KR.'", mentalModel: "Objectives = Direction (qualitative, inspiring). Key Results = Proof (quantitative, measurable). If you can't put a number on it, it's not a Key Result — it's a wish.", commonMistakes: "Making Key Results that are just tasks ('Launch feature X'). A real KR measures outcome: 'Increase user activation from 30% to 50%.' Tasks are the HOW; KRs are the WHAT.", upgrade: "Add leading indicators alongside lagging KRs. Example: 'Increase revenue by 20% (lagging)' + 'Increase demos booked by 40% (leading).' Leading indicators let you course-correct early.", bragLine: "My OKRs are so clear that anyone in the company can explain what my team does.", interaction: "choice", options: ["3 Objectives with measurable Key Results", "Vague goals like 'do better'", "Copy last quarter's OKRs", "Set only one objective"], correctAnswer: 0, tryPrompt: "Build OKRs for your team's next quarter.", xp: 70, tokens: 14 },
      { title: "Conflict Script Generator", hook: "Navigate tough conversations with a script.", difficulty: "advanced", content: "For difficult conversations, use: 'I need to address [issue] with [person]. Their perspective: [guess]. Generate a script using: 1) Empathetic opening, 2) Objective observation (no judgment), 3) Impact statement, 4) Collaborative solution request. Tone: firm but caring.'", mentalModel: "The EOIC Pattern: Empathy (I understand your perspective) → Observation (Here's what I noticed) → Impact (Here's how it affected X) → Collaboration (How can we solve this together?). Never start with blame.", commonMistakes: "Starting with 'You always...' or 'You never...' — absolute words trigger defensiveness. Use 'I noticed that...' and 'The impact was...' instead. Focus on behavior, not character.", upgrade: "Before the conversation, write down 3 possible reasons WHY they did what they did. This pre-empathy exercise prevents you from going in with assumptions and makes you a better listener.", bragLine: "I handle difficult conversations so well that people feel respected even when hearing hard truths.", interaction: "tap-reveal", tryPrompt: "Draft a script for a difficult conversation you've been avoiding.", xp: 75, tokens: 15 },
      { title: "Change Communication Plan", hook: "Roll out changes with clear messaging.", difficulty: "advanced", content: "When announcing changes: 'Create a change communication plan for [change]. Audiences: [list]. For each: key message, channel, timing, expected concerns, FAQ responses. Include a 30-day rollout timeline.'", mentalModel: "The ADKAR Model: Awareness (why change?) → Desire (what's in it for me?) → Knowledge (how do I change?) → Ability (can I do it?) → Reinforcement (will it stick?). Address each stage in your comms.", commonMistakes: "Announcing a change once and expecting adoption. People need to hear a message 7+ times through different channels before it sticks. Plan for repetition.", upgrade: "Create 'change champions' — one person per team who gets early access, understands the WHY deeply, and answers peer questions. Peer influence is 4x more effective than top-down announcements.", bragLine: "When I roll out changes, people say 'finally!' instead of 'why wasn't I told?'", interaction: "choice", options: ["Audience-specific messaging + FAQ + timeline", "Send one email to everyone", "Announce in a meeting with no prep", "Let people find out gradually"], correctAnswer: 0, tryPrompt: "Plan communications for an upcoming team change.", xp: 80, tokens: 16 },
      { title: "Leadership Style Analyzer", hook: "Understand and adapt your management approach.", difficulty: "intermediate", content: "Prompt: 'Based on these behaviors: [describe how you manage], identify my leadership style (directive, coaching, supporting, delegating). For my team's current development stage, suggest which style to emphasize more and specific actions to take.'", mentalModel: "Situational Leadership: No single style works for everyone. New employees need Directing. Growing employees need Coaching. Capable employees need Supporting. Experts need Delegating. Match your style to the person.", commonMistakes: "Using the same management style for everyone. Micromanaging a senior expert kills motivation. Being hands-off with a new hire causes confusion. Read the person, adapt the approach.", upgrade: "Create a 'style map' for your team: write each person's name + their current development level + the style they need from you right now. Review it monthly.", bragLine: "I manage each person differently because I know exactly what they need to grow.", interaction: "tap-reveal", tryPrompt: "Describe your management behaviors and discover your style.", xp: 65, tokens: 12 },
    ],
    workflows: [
      { title: "Weekly Team Review", steps: ["Collect status updates", "AI summarize progress", "Identify blockers", "Generate action items", "Send team digest"] },
      { title: "Hiring Decision Framework", steps: ["Define role requirements", "Score candidates with rubric", "AI analyze comparison", "Team discussion points", "Final decision matrix"] },
      { title: "Project Kickoff", steps: ["Define scope with AI", "Generate timeline", "Assign responsibilities", "Create communication plan", "Set milestones"] },
      { title: "Quarterly Planning", steps: ["Review past quarter metrics", "AI identify trends", "Set new objectives", "Resource allocation", "Stakeholder presentation"] },
      { title: "Crisis Response", steps: ["Assess situation", "AI draft communications", "Assign response team", "Monitor progress", "Post-mortem analysis"] },
    ],
    prompts: [
      { label: "Meeting Summary", prompt: "Summarize this meeting transcript into: Key Decisions, Action Items (with owners), Open Questions, Next Steps.", level: "beginner" },
      { label: "Performance Feedback", prompt: "Write constructive feedback for an employee who [situation]. Use the SBI framework (Situation, Behavior, Impact).", level: "beginner" },
      { label: "Strategic Memo", prompt: "Draft a strategic memo proposing [initiative]. Include: problem statement, proposed solution, resource requirements, timeline, risk mitigation, expected ROI.", level: "pro" },
      { label: "Team Restructure Plan", prompt: "Analyze this team structure and suggest optimization for [goal]. Consider: skill gaps, workload balance, career growth, collaboration patterns.", level: "pro" },
      { label: "Stakeholder Update", prompt: "Write a concise executive update on [project]. Format: Status (green/yellow/red), Key Wins, Risks, Asks, Timeline.", level: "beginner" },
      { label: "Interview Questions", prompt: "Generate 10 behavioral interview questions for a [role]. Focus on: problem-solving, collaboration, adaptability.", level: "beginner" },
      { label: "Retention Strategy", prompt: "Analyze potential causes of employee turnover in [department] and suggest 5 actionable retention strategies.", level: "pro" },
      { label: "Budget Justification", prompt: "Write a budget justification for [request]. Include: business case, alternatives considered, ROI timeline.", level: "pro" },
      { label: "Delegation Brief", prompt: "Create a delegation brief for [task]: context, expected output, constraints, checkpoints, success criteria.", level: "beginner" },
      { label: "Vision Statement", prompt: "Craft a compelling team vision statement that aligns with [company mission]. Make it memorable and actionable.", level: "pro" },
    ],
    scenario: { title: "Managing a Remote Team Crisis", description: "Your remote team misses a critical deadline. Use AI to analyze the situation, draft communications to stakeholders, create a recovery plan, and prevent future issues." },
  },

  // ======== 2. BUSINESS & FINANCE ========
  {
    id: "business-finance", name: "Business & Finance", icon: "💰", description: "Financial analysis, budgeting, and business strategy with AI.",
    levels: [
      { level: "Beginner", modules: ["Budget Basics with AI", "Invoice & Payment Templates", "Financial Terminology Decoded", "Cash Flow Tracking", "Basic Tax Knowledge"] },
      { level: "Intermediate", modules: ["Financial Modeling", "Investment Analysis Fundamentals", "Tax Planning Strategies", "Business Valuation Methods", "Revenue Optimization"] },
      { level: "Advanced", modules: ["M&A Due Diligence", "Portfolio Strategy & Risk", "Financial Forecasting Models", "Capital Structure Decisions", "International Finance"] },
    ],
    starterLessons: [
      { title: "Cash Flow Forecaster", hook: "Predict your finances 90 days ahead.", difficulty: "beginner", content: "Prompt: 'Create a 90-day cash flow forecast. Monthly income: $[X]. Fixed expenses: [list]. Variable expenses: [avg]. Include: weekly projections, warning thresholds, and a buffer recommendation.' This gives you financial visibility.", interaction: "choice", options: ["Weekly projections + warnings + buffer", "Just track expenses monthly", "Guess your cash position", "Only look at bank balance"], correctAnswer: 0, tryPrompt: "Create a 90-day forecast with your real numbers.", xp: 55, tokens: 10 },
      { title: "Invoice Template Builder", hook: "Professional invoices in 30 seconds.", difficulty: "beginner", content: "AI generates complete invoices: 'Create an invoice template for [business]. Include: logo placement, payment terms, line items, tax calculation, late payment policy, bank details section.' Export as a reusable template.", interaction: "tap-reveal", tryPrompt: "Generate an invoice template for your business.", xp: 40, tokens: 8 },
      { title: "Expense Category Optimizer", hook: "Find savings you didn't know existed.", difficulty: "beginner", content: "List all your monthly expenses, then: 'Categorize these expenses by necessity (essential/important/nice-to-have). For each category: suggest cheaper alternatives, identify potential negotiation opportunities, and flag subscriptions I might not be using.'", interaction: "choice", options: ["Categorize + find alternatives + flag unused", "Cut everything", "Keep all spending the same", "Only cut the smallest expenses"], correctAnswer: 0, tryPrompt: "List your expenses and run this audit.", xp: 50, tokens: 10 },
      { title: "Break-Even Calculator", hook: "Know exactly when your project pays off.", difficulty: "intermediate", content: "Prompt: 'Calculate break-even point. Fixed costs: $[X]. Variable cost per unit: $[Y]. Price per unit: $[Z]. Show: break-even units, break-even revenue, margin of safety, and a sensitivity analysis (+/-10% price change).'", interaction: "choice", options: ["Break-even units + revenue + sensitivity", "Just divide costs by price", "Skip financial analysis", "Only look at revenue"], correctAnswer: 0, tryPrompt: "Calculate break-even for a product or service you offer.", xp: 65, tokens: 12 },
      { title: "Competitive Pricing Analysis", hook: "Price products using market data.", difficulty: "intermediate", content: "Research competitors then: 'Analyze pricing for [product/service]. Competitors: [list with prices]. My costs: [X]. My differentiators: [list]. Suggest: penetration price, value price, premium price. Recommend a strategy with justification.'", interaction: "tap-reveal", tryPrompt: "Run pricing analysis for your main product.", xp: 70, tokens: 14 },
      { title: "Financial KPI Dashboard", hook: "Track the numbers that actually matter.", difficulty: "intermediate", content: "Prompt: 'For a [business type], define the top 10 financial KPIs. For each: formula, target range, measurement frequency, and red/yellow/green thresholds. Organize by: profitability, liquidity, efficiency, growth.'", interaction: "choice", options: ["KPIs organized by profitability, liquidity, efficiency", "Track everything possible", "Only track revenue", "Ignore KPIs"], correctAnswer: 0, tryPrompt: "Define KPIs for your business type.", xp: 60, tokens: 12 },
      { title: "ROI Calculator Template", hook: "Justify any investment with data.", difficulty: "beginner", content: "For any business investment: 'Calculate ROI for [investment]. Cost: $[X]. Expected benefits: [list with values]. Timeline: [months]. Include: simple ROI %, payback period, NPV at 10% discount rate, and a risk-adjusted scenario.'", interaction: "tap-reveal", tryPrompt: "Calculate ROI for an investment you're considering.", xp: 50, tokens: 10 },
      { title: "Subscription Revenue Modeler", hook: "Model MRR growth scenarios.", difficulty: "advanced", content: "Prompt: 'Build a subscription revenue model. Current MRR: $[X]. Monthly growth rate: [Y]%. Churn rate: [Z]%. Model 12 months with 3 scenarios: conservative (half growth), base case, aggressive (2x growth). Show: MRR, ARR, net revenue, cumulative revenue.'", interaction: "choice", options: ["3 scenarios with MRR/ARR projections", "Just multiply by 12", "Assume zero churn", "Only model one scenario"], correctAnswer: 0, tryPrompt: "Model your subscription revenue growth.", xp: 80, tokens: 16 },
      { title: "Tax Deduction Finder", hook: "Identify deductions you might be missing.", difficulty: "beginner", content: "Prompt: 'List common tax deductions for a [business type] in [country]. Categorize: easy to claim (keep receipts), requires documentation (need records), consult accountant (complex). Include estimated value range for each.'", interaction: "tap-reveal", tryPrompt: "Find deductions for your business type.", xp: 45, tokens: 9 },
      { title: "Investor Pitch Financials", hook: "Build financial slides investors want to see.", difficulty: "advanced", content: "For fundraising: 'Create investor-ready financial slides for [company]. Include: revenue model, unit economics (CAC, LTV, payback), 3-year projections, use of funds breakdown, key assumptions. Format for a pitch deck.'", interaction: "choice", options: ["Revenue model + unit economics + projections", "Just show total revenue", "Skip financials in the pitch", "Only show expenses"], correctAnswer: 0, tryPrompt: "Build financial slides for your business.", xp: 85, tokens: 16 },
    ],
    workflows: [
      { title: "Monthly Financial Review", steps: ["Export bank data", "AI categorize expenses", "Compare to budget", "Identify anomalies", "Generate report"] },
      { title: "Pricing Strategy", steps: ["Research competitor pricing", "Calculate costs", "AI analyze price sensitivity", "Set price tiers", "A/B test messaging"] },
      { title: "Business Plan Draft", steps: ["Define value proposition", "Market size analysis", "Financial projections", "Risk assessment", "Executive summary"] },
      { title: "Fundraising Prep", steps: ["Financial model cleanup", "AI generate pitch deck", "Prepare Q&A responses", "Due diligence checklist", "Investor outreach plan"] },
      { title: "Cost Reduction Audit", steps: ["List all expenses", "AI categorize by necessity", "Identify alternatives", "Calculate savings", "Implementation timeline"] },
    ],
    prompts: [
      { label: "Budget Template", prompt: "Create a monthly business budget for a [type] business with $[X] revenue. Categorize: fixed costs, variable costs, discretionary.", level: "beginner" },
      { label: "Financial Report", prompt: "Analyze these financial numbers and generate a report: Revenue, Expenses, Profit margin, YoY growth, Key concerns.", level: "pro" },
      { label: "Cash Flow Projection", prompt: "Create a 12-month cash flow projection for [business]. Include: seasonal adjustments, growth assumptions, buffer recommendations.", level: "pro" },
      { label: "Expense Analysis", prompt: "Categorize these expenses and identify top 3 areas for cost reduction with estimated savings.", level: "beginner" },
      { label: "Investment Comparison", prompt: "Compare these investment options: [list]. Analyze: risk level, expected return, liquidity, time horizon, tax implications.", level: "pro" },
      { label: "Pricing Calculator", prompt: "Calculate optimal pricing for [product/service]. Inputs: cost, market rate, value delivered, competitor prices.", level: "beginner" },
      { label: "Revenue Model", prompt: "Build a revenue model for [business type] with 3 scenarios: conservative, moderate, aggressive.", level: "pro" },
      { label: "Financial Health Check", prompt: "Evaluate this business's financial health using: current ratio, debt-to-equity, profit margin, burn rate.", level: "pro" },
      { label: "Tax Planning", prompt: "List common tax deductions for [business type]. Categorize by: easy to claim, requires documentation, consult accountant.", level: "beginner" },
      { label: "Unit Economics", prompt: "Calculate unit economics for [product]: CAC, LTV, payback period, gross margin per unit.", level: "pro" },
    ],
    scenario: { title: "Launching a Side Business", description: "You're starting a freelance consulting business. Use AI to create a business plan, set pricing, build a budget, forecast 6 months of cash flow, and identify potential risks." },
  },

  // ======== 3. COMPUTER & MATH ========
  {
    id: "computer-math", name: "Computer & Math", icon: "💻", description: "Programming, data analysis, and computational thinking with AI.",
    levels: [
      { level: "Beginner", modules: ["Code Explanation & Reading", "Debugging with AI", "Data Basics & Spreadsheets", "Spreadsheet Formula Mastery", "Internet & Web Basics"] },
      { level: "Intermediate", modules: ["Algorithm Design", "Database & SQL Queries", "API Integration Patterns", "Data Visualization", "Version Control Workflows"] },
      { level: "Advanced", modules: ["System Architecture Design", "Machine Learning Concepts", "Performance Optimization", "Security Best Practices", "Cloud Infrastructure"] },
    ],
    starterLessons: [
      { title: "Debug Like a Pro", hook: "AI finds bugs faster than you think.", difficulty: "beginner", content: "Share your error with AI: 'I'm getting this error: [paste error]. My code: [paste code]. Find the bug, explain why it happens, and show the fixed version.' AI spots patterns humans miss — especially typos, off-by-one errors, and type mismatches.", interaction: "choice", options: ["Share error + code + ask for explanation", "Just say 'fix this'", "Try random changes", "Rewrite from scratch"], correctAnswer: 0, tryPrompt: "Share a recent bug with AI and see how fast it finds the fix.", xp: 50, tokens: 10 },
      { title: "Regex Made Simple", hook: "Pattern matching explained in plain English.", difficulty: "intermediate", content: "Instead of memorizing regex: 'Create a regex to match [description]. Explain each part. Include 5 test cases showing matches and non-matches.' Example: matching email addresses, phone numbers, or URLs becomes trivial.", interaction: "tap-reveal", tryPrompt: "Ask AI to build a regex for something you need to match.", xp: 65, tokens: 12 },
      { title: "SQL Query Builder", hook: "Write database queries without memorizing syntax.", difficulty: "beginner", content: "Describe what you need in plain English: 'I have tables: users (id, name, email, created_at) and orders (id, user_id, amount, date). Write SQL to find: total spent per user in the last 30 days, sorted by highest spender.' AI writes the query AND explains each part.", interaction: "choice", options: ["Describe in English, AI writes SQL", "Memorize all SQL syntax", "Avoid databases entirely", "Use only simple SELECT *"], correctAnswer: 0, tryPrompt: "Describe a data question and let AI write the SQL.", xp: 55, tokens: 10 },
      { title: "API Explained Simply", hook: "APIs are just restaurant waiters for data.", difficulty: "beginner", content: "An API is a waiter: you (the customer) send a request (order) to the kitchen (server) and get back a response (food). Types: REST (menu-based), GraphQL (custom orders), WebSocket (live updates). Prompt: 'Explain how to call [API name] with examples.'", interaction: "choice", options: ["Request → Server → Response pattern", "APIs are programming languages", "You need to build your own API first", "APIs only work with JavaScript"], correctAnswer: 0, tryPrompt: "Ask AI to explain an API you've heard about.", xp: 45, tokens: 8 },
      { title: "Spreadsheet Formula Wizard", hook: "Complex formulas written by AI.", difficulty: "beginner", content: "Stop struggling with VLOOKUP: 'Write an Excel formula to: [description]. My data is in columns A-F, rows 2-100. Explain each function used.' Works for: VLOOKUP, SUMIFS, INDEX/MATCH, pivot calculations, conditional formatting rules.", interaction: "tap-reveal", tryPrompt: "Describe a spreadsheet calculation you need help with.", xp: 50, tokens: 10 },
      { title: "Data Cleaning Pipeline", hook: "Turn messy data into clean datasets.", difficulty: "intermediate", content: "Prompt: 'I have messy data with these issues: [duplicates, missing values, inconsistent formats, outliers]. Write a step-by-step cleaning pipeline. For each step: what to check, how to fix, and validation criteria.'", interaction: "choice", options: ["Step-by-step pipeline with validation", "Delete all messy rows", "Ignore data quality", "Clean manually one by one"], correctAnswer: 0, tryPrompt: "Describe your messy dataset and get a cleaning plan.", xp: 70, tokens: 14 },
      { title: "Code Review Checklist", hook: "AI reviews your code like a senior dev.", difficulty: "intermediate", content: "Submit code for review: 'Review this code for: bugs, security issues, performance problems, readability, and best practices. For each finding: severity (critical/warning/info), location, explanation, and suggested fix.'", interaction: "tap-reveal", tryPrompt: "Submit a piece of your code for AI review.", xp: 65, tokens: 12 },
      { title: "Algorithm Selection Guide", hook: "Pick the right algorithm for any problem.", difficulty: "advanced", content: "Prompt: 'I need to solve [problem]. Suggest the best algorithm. Explain: time complexity, space complexity, when to use vs alternatives, and provide pseudocode. Give a concrete example with sample input/output.'", interaction: "choice", options: ["Problem → algorithm with complexity analysis", "Always use brute force", "Memorize all algorithms", "Use the first algorithm you find"], correctAnswer: 0, tryPrompt: "Describe a problem and let AI recommend the algorithm.", xp: 80, tokens: 16 },
      { title: "Git Workflow for Humans", hook: "Version control without the headaches.", difficulty: "beginner", content: "The essential Git commands in plain English: 'Explain Git to someone who's never used it. Cover: clone, branch, commit, push, pull, merge. Use a real-world analogy. Include the 5 commands I'll use 90% of the time.'", interaction: "tap-reveal", tryPrompt: "Ask AI to explain Git using an analogy from your field.", xp: 45, tokens: 8 },
      { title: "Statistics for Decisions", hook: "Use basic stats to make better choices.", difficulty: "intermediate", content: "You don't need a stats degree: 'Explain [mean/median/standard deviation/correlation/p-value] using a business example. When should I use each? What common mistakes do people make? Give me a decision-making cheat sheet.'", interaction: "choice", options: ["Business examples + cheat sheet", "Memorize formulas", "Skip statistics entirely", "Only use averages"], correctAnswer: 0, tryPrompt: "Ask AI to explain a statistical concept using your industry's data.", xp: 60, tokens: 12 },
    ],
    workflows: [
      { title: "Code Review Pipeline", steps: ["Submit code to AI", "Check for bugs", "Optimize performance", "Review security", "Generate documentation"] },
      { title: "Data Analysis Sprint", steps: ["Define question", "Clean data with AI", "Analyze patterns", "Visualize findings", "Write summary"] },
      { title: "Learning New Language", steps: ["AI compare to known language", "Key syntax differences", "Build small project", "Debug with AI", "Refactor for best practices"] },
      { title: "Spreadsheet Automation", steps: ["Identify repetitive tasks", "AI generate formulas", "Create macros", "Test with sample data", "Document process"] },
      { title: "Bug Investigation", steps: ["Describe symptoms", "AI suggest causes", "Test hypotheses", "Apply fix", "Add regression test"] },
    ],
    prompts: [
      { label: "Code Explainer", prompt: "Explain this code line by line as if I'm a beginner. Highlight key concepts and potential issues.", level: "beginner" },
      { label: "Debug Helper", prompt: "I'm getting this error: [error]. Here's my code: [code]. Find the bug, explain why, and show the fix.", level: "beginner" },
      { label: "SQL Generator", prompt: "Write a SQL query to: [description]. Table structure: [tables]. Include comments explaining each part.", level: "beginner" },
      { label: "Architecture Review", prompt: "Review this system architecture for: scalability, security, maintainability, cost. Suggest improvements.", level: "pro" },
      { label: "Regex Builder", prompt: "Create a regex pattern to match: [description]. Explain each part. Include test cases.", level: "pro" },
      { label: "Excel Formula", prompt: "Write an Excel/Sheets formula to: [task]. Explain the formula components.", level: "beginner" },
      { label: "API Documentation", prompt: "Generate API documentation for this endpoint: [details]. Include: description, parameters, response format, examples.", level: "pro" },
      { label: "Performance Optimizer", prompt: "Analyze this code for performance bottlenecks. Suggest optimizations with expected improvement.", level: "pro" },
      { label: "Data Model Design", prompt: "Design a database schema for [application]. Include: tables, relationships, indexes, constraints.", level: "pro" },
      { label: "Algorithm Picker", prompt: "I need to solve [problem]. Suggest the best algorithm, explain complexity, provide pseudocode.", level: "pro" },
    ],
    scenario: { title: "Building a Data Dashboard", description: "Your boss needs a sales dashboard. Use AI to write SQL queries, create spreadsheet formulas, build data visualizations, and automate weekly reporting." },
  },

  // ======== 4. ARCHITECTURE & ENGINEERING ========
  {
    id: "architecture", name: "Architecture & Engineering", icon: "🏗️", description: "Design, planning, and engineering problem-solving with AI.",
    levels: [
      { level: "Beginner", modules: ["Design Brief Writing", "Material Research with AI", "Code Compliance Basics", "Project Documentation", "Site Analysis Fundamentals"] },
      { level: "Intermediate", modules: ["Structural Calculations Aid", "Energy Modeling Basics", "BIM Workflow Integration", "Cost Estimation Methods", "Specification Writing"] },
      { level: "Advanced", modules: ["Parametric Design Concepts", "Sustainability & LEED", "Complex Systems Integration", "Innovation Research", "Value Engineering"] },
    ],
    starterLessons: [
      { title: "Design Brief Generator", hook: "Create clear project briefs in minutes.", difficulty: "beginner", content: "Prompt: 'Create a design brief for [project type]. Include: objectives, constraints, user needs, budget range, timeline, sustainability goals, key stakeholders, and success criteria.' A good brief prevents 80% of project problems.", interaction: "choice", options: ["Objectives + constraints + user needs + success criteria", "Just describe what you want", "Skip the brief, start designing", "Copy a previous brief"], correctAnswer: 0, tryPrompt: "Generate a design brief for a project you're working on.", xp: 50, tokens: 10 },
      { title: "Material Comparison Matrix", hook: "Compare materials across 10 dimensions.", difficulty: "intermediate", content: "Prompt: 'Compare [material A] vs [material B] for [application]. Evaluate: durability, cost, sustainability, aesthetics, maintenance, availability, fire rating, thermal performance, weight, workability. Format as a comparison table with recommendations.'", interaction: "tap-reveal", tryPrompt: "Compare two materials for your next project.", xp: 65, tokens: 12 },
      { title: "Code Compliance Checker", hook: "Quick-reference building codes with AI.", difficulty: "beginner", content: "Prompt: 'What are the building code requirements for [element] in [jurisdiction]? Cover: dimensions, fire rating, accessibility, egress, structural. Flag any recent code changes. Note: always verify with official sources.'", interaction: "choice", options: ["Check requirements + flag changes + verify", "Assume codes haven't changed", "Skip code review", "Only check fire codes"], correctAnswer: 0, tryPrompt: "Check code requirements for an element in your project.", xp: 55, tokens: 10 },
      { title: "Cost Estimation Template", hook: "Ballpark project costs accurately.", difficulty: "intermediate", content: "Prompt: 'Create a preliminary cost estimate for [project type], [size], [location]. Break down by: site work, structure, envelope, MEP, interior, contingency. Use current cost per SF ranges. Flag items that vary most by region.'", interaction: "tap-reveal", tryPrompt: "Estimate costs for a project you're planning.", xp: 70, tokens: 14 },
      { title: "Site Analysis Report", hook: "AI-assisted site survey documentation.", difficulty: "beginner", content: "Prompt: 'Generate a site analysis report template for [location type]. Include: topography, access routes, utilities, environmental constraints, zoning, sun path, prevailing winds, neighboring context, and opportunities/challenges.'", interaction: "choice", options: ["Full analysis with opportunities + challenges", "Just note the address", "Skip site analysis", "Only check zoning"], correctAnswer: 0, tryPrompt: "Create a site analysis for your project location.", xp: 50, tokens: 10 },
      { title: "Sustainability Scorecard", hook: "Rate designs on environmental impact.", difficulty: "intermediate", content: "Prompt: 'Create a sustainability scorecard for [design]. Rate 1-10 on: energy efficiency, water conservation, material sustainability, indoor air quality, site ecology, waste reduction, transportation access, adaptability. Suggest improvements for lowest scores.'", interaction: "tap-reveal", tryPrompt: "Score your current design on sustainability.", xp: 65, tokens: 12 },
      { title: "RFP Response Writer", hook: "Win more projects with better proposals.", difficulty: "advanced", content: "Prompt: 'Draft an RFP response for [project]. Include: firm qualifications, relevant experience (3 similar projects), design approach, team bios, sustainability commitment, timeline, fee structure. Tone: confident and client-focused.'", interaction: "choice", options: ["Qualifications + approach + experience + timeline", "Just list your past projects", "Submit the minimum required", "Use a generic template"], correctAnswer: 0, tryPrompt: "Draft a response for an RFP you're pursuing.", xp: 80, tokens: 16 },
      { title: "Punch List Generator", hook: "Never miss a detail at handoff.", difficulty: "beginner", content: "Prompt: 'Generate a comprehensive punch list template for [project phase]. Organize by: location (floor/room), trade (structural, MEP, finishes), priority (critical/standard/cosmetic), responsible party. Include sign-off fields.'", interaction: "tap-reveal", tryPrompt: "Generate a punch list for your current project.", xp: 45, tokens: 8 },
      { title: "Specification Writer", hook: "Technical specs without the tedium.", difficulty: "intermediate", content: "Prompt: 'Write a specification section for [element]. Include: scope of work, materials and standards, execution requirements, quality assurance, submittals required, warranties, and related sections. Follow CSI MasterFormat.'", interaction: "choice", options: ["Full spec with standards + QA + submittals", "Just describe the material", "Skip specifications", "Copy from a previous project"], correctAnswer: 0, tryPrompt: "Write a spec section for a building element.", xp: 70, tokens: 14 },
      { title: "Value Engineering Guide", hook: "Cut costs without cutting quality.", difficulty: "advanced", content: "Prompt: 'Perform value engineering analysis on [design element]. Current cost: $[X]. Suggest 5 alternatives that maintain design intent while reducing cost. For each: description, estimated savings, quality impact, and trade-offs.'", interaction: "tap-reveal", tryPrompt: "Run value engineering on your project's most expensive element.", xp: 75, tokens: 15 },
    ],
    workflows: [
      { title: "Project Feasibility Study", steps: ["Define requirements", "AI research regulations", "Cost-benefit analysis", "Risk assessment", "Recommendation report"] },
      { title: "Design Review Process", steps: ["Compile design documents", "AI check compliance", "Identify issues", "Suggest alternatives", "Document decisions"] },
      { title: "Material Selection", steps: ["List requirements", "AI compare options", "Cost analysis", "Sustainability check", "Final specification"] },
      { title: "Construction Documentation", steps: ["Draft specifications", "AI review for gaps", "Cross-reference codes", "Format deliverables", "Quality check"] },
      { title: "Post-Occupancy Evaluation", steps: ["Survey occupants", "AI analyze feedback", "Performance metrics", "Improvement recommendations", "Implementation plan"] },
    ],
    prompts: [
      { label: "Design Brief", prompt: "Create a design brief for [project type]. Include: objectives, constraints, user needs, budget range, timeline.", level: "beginner" },
      { label: "Material Research", prompt: "Compare [material A] vs [material B] for [application]. Evaluate: durability, cost, sustainability, aesthetics.", level: "beginner" },
      { label: "RFP Response", prompt: "Draft an RFP response for [project]. Highlight: experience, approach, team, timeline, value proposition.", level: "pro" },
      { label: "Code Review", prompt: "Check if [design element] meets [building code]. Flag potential issues and suggest compliant alternatives.", level: "pro" },
      { label: "Site Report", prompt: "Generate a site analysis report for [location]. Include: topography, access, utilities, environmental factors.", level: "beginner" },
      { label: "Energy Analysis", prompt: "Estimate energy performance for [building type] with [features]. Suggest improvements.", level: "pro" },
      { label: "Cost Estimate", prompt: "Create a preliminary cost estimate for [project]. Break down by: structure, MEP, finishes, site work.", level: "beginner" },
      { label: "Spec Writer", prompt: "Write a specification section for [element]. Include: scope, materials, execution, quality assurance.", level: "pro" },
      { label: "Sustainability Plan", prompt: "Develop a sustainability strategy for [project]. Cover: energy, water, materials, waste, indoor quality.", level: "pro" },
      { label: "Punch List", prompt: "Generate a punch list template for [project phase]. Organize by: location, trade, priority.", level: "beginner" },
    ],
    scenario: { title: "Renovating a Historic Building", description: "You're tasked with modernizing a 100-year-old building while preserving its character. Use AI to research code requirements, compare materials, estimate costs, and create a phased renovation plan." },
  },

  // ======== 5. LIFE & SOCIAL SCIENCES ========
  {
    id: "life-sciences", name: "Life & Social Sciences", icon: "🔬", description: "Research methods, analysis, and scientific communication with AI.",
    levels: [
      { level: "Beginner", modules: ["Literature Review Basics", "Research Question Framing", "Data Collection Methods", "Report Writing Skills", "Basic Statistics"] },
      { level: "Intermediate", modules: ["Statistical Analysis Methods", "Survey Design & Validation", "Qualitative Data Coding", "Grant Writing Essentials", "Research Ethics"] },
      { level: "Advanced", modules: ["Meta-Analysis Techniques", "Publication Strategy", "Advanced Research Ethics", "Policy Brief Writing", "Mixed Methods Design"] },
    ],
    starterLessons: [
      { title: "Literature Review Helper", hook: "Organize research papers in minutes.", difficulty: "beginner", content: "Prompt: 'Help me organize a literature review on [topic]. Create a table with columns: Author, Year, Key Finding, Methodology, Relevance to my research question: [Q]. Then identify 3 gaps in the existing research.' This structures weeks of reading into actionable themes.", interaction: "choice", options: ["Organize by author, finding, gap", "Read papers randomly", "Only read abstracts", "Skip the literature review"], correctAnswer: 0, tryPrompt: "Organize your current research papers using this method.", xp: 55, tokens: 10 },
      { title: "Research Question Builder", hook: "Frame better research questions.", difficulty: "beginner", content: "Use the PICO framework with AI: 'Refine my research question using PICO — Population, Intervention, Comparison, Outcome. Draft question: [your question]. Suggest 3 refined versions that are specific, measurable, and researchable.'", interaction: "tap-reveal", tryPrompt: "Refine a research question you're working on.", xp: 50, tokens: 10 },
      { title: "Survey Design Checklist", hook: "Avoid the 7 most common survey mistakes.", difficulty: "intermediate", content: "Prompt: 'Review these survey questions for: leading questions, double-barreled questions, ambiguous wording, response bias, missing options, order effects, and length issues. Suggest improvements for each problem found.'", interaction: "choice", options: ["Check for 7 common biases", "Write questions quickly", "Use yes/no for everything", "Make surveys as long as possible"], correctAnswer: 0, tryPrompt: "Have AI review your survey questions.", xp: 65, tokens: 12 },
      { title: "Stats Interpreter", hook: "Understand p-values without a PhD.", difficulty: "beginner", content: "Prompt: 'Explain this statistical result in plain English: [paste result]. What does it mean practically? Is it meaningful? What are the limitations? Should I trust it? Use analogies.' AI translates academic stats into decision-useful insights.", interaction: "tap-reveal", tryPrompt: "Paste a statistical result and get a plain-English explanation.", xp: 55, tokens: 10 },
      { title: "Abstract Writer", hook: "Structured abstracts in 2 minutes.", difficulty: "intermediate", content: "Prompt: 'Write a structured abstract for my study. Background: [1 sentence]. Methods: [describe]. Results: [key findings]. Conclusion: [implications]. Max 250 words. Follow [journal name] format.'", interaction: "choice", options: ["Background + Methods + Results + Conclusion", "Write a long introduction", "Skip the abstract", "Just list findings"], correctAnswer: 0, tryPrompt: "Draft an abstract for your current research.", xp: 60, tokens: 12 },
      { title: "Citation Formatter", hook: "Never format citations manually again.", difficulty: "beginner", content: "Prompt: 'Format these references in [APA/MLA/Chicago] style: [paste references]. Flag any incomplete entries that need more information. Then generate an in-text citation guide for each.'", interaction: "tap-reveal", tryPrompt: "Format your reference list in your required style.", xp: 40, tokens: 8 },
      { title: "Grant Proposal Outline", hook: "Structure winning proposals.", difficulty: "advanced", content: "Prompt: 'Create a grant proposal outline for [funding body]. Research topic: [topic]. Include: significance, innovation, approach, preliminary data, timeline, budget justification, broader impacts. Follow [specific grant] guidelines.'", interaction: "choice", options: ["Full outline following funder guidelines", "Just describe your research", "Submit without a structure", "Copy a template from online"], correctAnswer: 0, tryPrompt: "Outline a grant proposal for funding you're targeting.", xp: 80, tokens: 16 },
      { title: "Data Visualization Picker", hook: "Choose the right chart every time.", difficulty: "beginner", content: "Prompt: 'I have [data type] data showing [relationship]. Suggest the best visualization type. Options to consider: bar, line, scatter, box plot, heat map, pie, sankey. Explain why your choice best communicates the finding.'", interaction: "choice", options: ["Match data type to visualization", "Always use bar charts", "Use pie charts for everything", "Skip visualizations"], correctAnswer: 0, tryPrompt: "Describe your data and get chart recommendations.", xp: 50, tokens: 10 },
      { title: "Interview Guide Builder", hook: "Create semi-structured interview guides.", difficulty: "intermediate", content: "Prompt: 'Create a semi-structured interview guide for [research topic]. Include: 8-10 main questions, 2-3 probes for each, opening script, closing script, and ethical considerations. Target interview length: 45 minutes.'", interaction: "tap-reveal", tryPrompt: "Build an interview guide for your qualitative research.", xp: 65, tokens: 12 },
      { title: "Findings Communicator", hook: "Translate research for non-experts.", difficulty: "intermediate", content: "Prompt: 'Translate this research finding into a plain language summary for [audience: policymakers/public/practitioners]. Max 150 words. Include: what we found, why it matters, what should change. Avoid jargon.'", interaction: "choice", options: ["Plain language with 'so what' framing", "Use technical language", "Include all statistical details", "Write a full paper summary"], correctAnswer: 0, tryPrompt: "Translate your latest finding for a non-expert audience.", xp: 60, tokens: 12 },
    ],
    workflows: [
      { title: "Literature Review Pipeline", steps: ["Define search terms", "AI screen abstracts", "Extract key findings", "Identify gaps", "Write synthesis"] },
      { title: "Survey Research", steps: ["Define objectives", "AI draft questions", "Pilot test", "Analyze responses", "Report findings"] },
      { title: "Data Analysis", steps: ["Clean dataset", "Descriptive statistics", "AI suggest tests", "Run analysis", "Interpret results"] },
      { title: "Grant Application", steps: ["Research funding sources", "Draft proposal", "AI review and refine", "Budget justification", "Submit package"] },
      { title: "Publication Prep", steps: ["Select target journal", "Format per guidelines", "AI review manuscript", "Draft cover letter", "Submit and track"] },
    ],
    prompts: [
      { label: "Research Question", prompt: "Help me refine this research question: [draft]. Make it specific, measurable, and researchable.", level: "beginner" },
      { label: "Literature Summary", prompt: "Summarize this research paper: [abstract]. Extract: main finding, methodology, limitations, implications.", level: "beginner" },
      { label: "Stats Explainer", prompt: "Explain this statistical result in plain English: [result]. What does it mean practically?", level: "beginner" },
      { label: "Grant Narrative", prompt: "Write a grant proposal narrative for: [project]. Include: significance, innovation, approach, timeline.", level: "pro" },
      { label: "Methods Section", prompt: "Draft a methods section for: [study design]. Include: participants, measures, procedure, analysis plan.", level: "pro" },
      { label: "Survey Questions", prompt: "Generate 15 survey questions about [topic]. Include Likert, multiple choice, and open-ended.", level: "beginner" },
      { label: "Data Dictionary", prompt: "Create a data dictionary for [dataset]. Include: variable name, type, description, valid values.", level: "pro" },
      { label: "Abstract Writer", prompt: "Write a structured abstract (Background, Methods, Results, Conclusion) for: [study]. Max 250 words.", level: "pro" },
      { label: "Ethics Application", prompt: "Draft an ethics application for [research]. Cover: consent, risks, benefits, data protection.", level: "pro" },
      { label: "Plain Language Summary", prompt: "Translate this research finding into a plain language summary for the general public. Max 100 words.", level: "beginner" },
    ],
    scenario: { title: "Conducting a Community Survey", description: "You need to survey 500 community members about local services. Use AI to design the survey, plan sampling, analyze mock results, and write a findings report." },
  },

  // ======== 6-22: REMAINING CATEGORIES (all with specific modules) ========

  // 6. SOCIAL SERVICES
  {
    id: "social-services", name: "Social Services", icon: "🤝", description: "Case management, community resources, and client support with AI.",
    levels: [
      { level: "Beginner", modules: ["Client Intake Documentation", "Resource Directory Building", "Case Note Writing", "Community Needs Assessment", "Referral Letter Templates"] },
      { level: "Intermediate", modules: ["Case Management Planning", "Program Evaluation Basics", "Crisis Intervention Protocols", "Grant Writing for Nonprofits", "Data-Driven Advocacy"] },
      { level: "Advanced", modules: ["Policy Analysis & Advocacy", "Program Design & Logic Models", "Community Partnership Strategy", "Impact Measurement", "Systems Change Approaches"] },
    ],
    starterLessons: [
      { title: "Client Intake Streamliner", hook: "Complete intake forms 3x faster with AI templates.", difficulty: "beginner", content: "Prompt: 'Create a client intake template for [service type]. Include: demographics, presenting needs, risk factors, strengths, support network, goals, consent sections. Format for easy digital entry.'", interaction: "choice", options: ["Structured template with all key sections", "Ask random questions", "Skip intake documentation", "Use a generic form"], correctAnswer: 0, tryPrompt: "Create an intake template for your service area.", xp: 50, tokens: 10 },
      { title: "Case Note SOAP Method", hook: "Write case notes that stand up to audit.", difficulty: "beginner", content: "Use SOAP format with AI: 'Write a case note using SOAP — Subjective (client's perspective), Objective (observations/facts), Assessment (professional analysis), Plan (next steps). Client situation: [describe].' Clear, professional, auditable.", interaction: "tap-reveal", tryPrompt: "Write a practice case note using SOAP format.", xp: 55, tokens: 10 },
      { title: "Resource Mapper", hook: "Build a community resource directory in 30 minutes.", difficulty: "beginner", content: "Prompt: 'Create a community resource directory for [area/population]. Categories: housing, food, healthcare, employment, education, legal aid, mental health, transportation. Include: organization name, services, eligibility, contact, hours.'", interaction: "choice", options: ["Categorized directory with eligibility info", "Just list phone numbers", "Only include government resources", "Skip the directory"], correctAnswer: 0, tryPrompt: "Build a resource directory for your service area.", xp: 55, tokens: 10 },
      { title: "Safety Plan Builder", hook: "Create crisis safety plans with proper structure.", difficulty: "intermediate", content: "Prompt: 'Create a safety plan template following best practices. Include: warning signs, coping strategies, social contacts for distraction, professional contacts, making the environment safe, reasons for living. Note: this supports but never replaces professional crisis intervention.'", interaction: "tap-reveal", tryPrompt: "Review a safety plan template for completeness.", xp: 65, tokens: 12 },
      { title: "Program Evaluation Template", hook: "Measure program impact with clear metrics.", difficulty: "intermediate", content: "Prompt: 'Design a program evaluation framework for [program]. Include: logic model (inputs→activities→outputs→outcomes), data collection methods, KPIs, timeline, stakeholder reporting format.' This proves your program works.", interaction: "choice", options: ["Logic model with KPIs and data methods", "Just count participants", "Skip evaluation", "Only use satisfaction surveys"], correctAnswer: 0, tryPrompt: "Create an evaluation framework for your program.", xp: 70, tokens: 14 },
      { title: "Referral Letter Writer", hook: "Professional referral letters in 2 minutes.", difficulty: "beginner", content: "Prompt: 'Write a referral letter for [client situation] to [service type]. Include: reason for referral, relevant background (with consent), specific needs, urgency level, preferred contact method. Tone: professional and advocacy-oriented.'", interaction: "tap-reveal", tryPrompt: "Draft a referral letter for a common scenario.", xp: 45, tokens: 8 },
      { title: "Grant Application Helper", hook: "Write compelling nonprofit grant applications.", difficulty: "advanced", content: "Prompt: 'Write a grant narrative for [program/organization]. Funder: [name]. Include: statement of need (with data), program description, goals and objectives, evaluation plan, sustainability plan, organizational capacity. Max [X] words.'", interaction: "choice", options: ["Need + program + evaluation + sustainability", "Just describe the program", "Submit without a narrative", "Use last year's application unchanged"], correctAnswer: 0, tryPrompt: "Draft a grant narrative for funding you're pursuing.", xp: 80, tokens: 16 },
      { title: "Community Needs Assessment", hook: "Identify community gaps with data.", difficulty: "beginner", content: "Prompt: 'Design a community needs assessment for [community/population]. Include: survey questions, focus group guide, data sources to review, analysis framework, and report outline. Population: [demographics].'", interaction: "tap-reveal", tryPrompt: "Design a needs assessment for your community.", xp: 60, tokens: 12 },
      { title: "Advocacy Brief Writer", hook: "Turn data into compelling policy arguments.", difficulty: "intermediate", content: "Prompt: 'Write a one-page advocacy brief on [issue]. Include: problem statement with statistics, affected population, current policy gap, proposed solution, cost-benefit, call to action. Audience: [policymakers/legislators].'", interaction: "choice", options: ["Data-backed brief with call to action", "Write a long research paper", "Share opinions without data", "Only describe the problem"], correctAnswer: 0, tryPrompt: "Create an advocacy brief for an issue you care about.", xp: 70, tokens: 14 },
      { title: "Client Progress Tracker", hook: "Document and visualize client progress over time.", difficulty: "intermediate", content: "Prompt: 'Create a client progress tracking template for [service type]. Include: baseline measures, SMART goals, milestone checkpoints, progress indicators, barriers log, and a summary report format for supervisors/funders.'", interaction: "tap-reveal", tryPrompt: "Build a progress tracking template for your clients.", xp: 60, tokens: 12 },
    ],
    workflows: [
      { title: "Client Onboarding", steps: ["Intake documentation", "Needs assessment", "AI-assisted service plan", "Resource matching", "Follow-up scheduling"] },
      { title: "Program Reporting", steps: ["Collect outcome data", "AI analyze trends", "Create visualizations", "Write narrative", "Submit to funders"] },
      { title: "Crisis Response", steps: ["Assess safety", "Document with SOAP", "Identify resources", "Create safety plan", "Follow-up protocol"] },
      { title: "Community Outreach", steps: ["Identify target population", "AI draft messaging", "Select channels", "Track engagement", "Evaluate effectiveness"] },
      { title: "Case Conference Prep", steps: ["Summarize case history", "AI identify patterns", "List discussion points", "Prepare recommendations", "Document decisions"] },
    ],
    prompts: [
      { label: "Case Note", prompt: "Write a professional case note using SOAP format for: [client situation].", level: "beginner" },
      { label: "Service Plan", prompt: "Create an individualized service plan for [client]. Include: goals, objectives, interventions, timeline, responsible parties.", level: "beginner" },
      { label: "Resource Guide", prompt: "Create a resource guide for [population] in [area]. Include: service type, provider, eligibility, contact.", level: "beginner" },
      { label: "Program Proposal", prompt: "Write a program proposal for [need]. Include: needs assessment, program design, staffing, budget, evaluation.", level: "pro" },
      { label: "Impact Report", prompt: "Write an impact report for [program]. Include: outcomes achieved, stories, data, lessons learned.", level: "pro" },
      { label: "Advocacy Letter", prompt: "Draft an advocacy letter to [official] about [issue]. Include data, personal stories, and specific asks.", level: "beginner" },
      { label: "Training Curriculum", prompt: "Design a training curriculum for [topic] for [audience]. Include: objectives, activities, materials, assessment.", level: "pro" },
      { label: "Needs Assessment", prompt: "Create a community needs assessment survey for [population]. Include quantitative and qualitative questions.", level: "pro" },
      { label: "Volunteer Handbook", prompt: "Create a volunteer handbook section on [topic]. Include: procedures, expectations, safety, support.", level: "beginner" },
      { label: "Outcome Measurement", prompt: "Define outcome measures for [program]. Include: indicators, data sources, collection methods, targets.", level: "pro" },
    ],
    scenario: { title: "Managing a Complex Case", description: "A family presents with housing instability, food insecurity, and a child with special needs. Use AI to create a comprehensive service plan, identify resources, write referral letters, and track progress." },
  },

  // 7. LEGAL
  {
    id: "legal", name: "Legal", icon: "⚖️", description: "Legal research, document drafting, and compliance with AI.",
    levels: [
      { level: "Beginner", modules: ["Legal Terminology Decoder", "Contract Basics", "Rights & Responsibilities", "Document Organization", "Legal Letter Writing"] },
      { level: "Intermediate", modules: ["Contract Review & Drafting", "Regulatory Compliance", "Legal Research Methods", "Intellectual Property Basics", "Dispute Resolution"] },
      { level: "Advanced", modules: ["Complex Contract Negotiation", "Corporate Governance", "Risk & Liability Analysis", "International Law Basics", "Legal Tech & Automation"] },
    ],
    starterLessons: [
      { title: "Contract Red Flag Spotter", hook: "Find risky clauses in any contract in 60 seconds.", difficulty: "beginner", content: "Prompt: 'Review this contract clause for red flags: [paste]. Check for: one-sided terms, hidden penalties, auto-renewal traps, liability caps, IP assignment, non-compete scope, termination conditions. Flag severity: high/medium/low.' Note: always consult a lawyer for final decisions.", interaction: "choice", options: ["Check for one-sided terms + penalties + traps", "Just sign it quickly", "Only read the first page", "Trust the other party completely"], correctAnswer: 0, tryPrompt: "Paste a contract clause and check for red flags.", xp: 55, tokens: 10 },
      { title: "Legal Jargon Translator", hook: "Understand any legal document in plain English.", difficulty: "beginner", content: "Prompt: 'Translate this legal text into plain English: [paste]. Explain what it means for me practically. Highlight any obligations, deadlines, or rights I should know about. Use a readability level appropriate for a non-lawyer.'", interaction: "tap-reveal", tryPrompt: "Paste a legal paragraph and get a plain-English explanation.", xp: 45, tokens: 8 },
      { title: "NDA Template Builder", hook: "Create basic NDA templates for common situations.", difficulty: "beginner", content: "Prompt: 'Draft a mutual NDA template for [situation]. Include: definition of confidential information, exclusions, term, return of materials, remedies. Note what sections I should customize. Disclaimer: review with counsel before use.'", interaction: "choice", options: ["Template with customizable sections + disclaimer", "Download a random NDA online", "Skip the NDA", "Make it as complex as possible"], correctAnswer: 0, tryPrompt: "Generate an NDA template for your situation.", xp: 55, tokens: 10 },
      { title: "Compliance Checklist Creator", hook: "Never miss a regulatory requirement.", difficulty: "intermediate", content: "Prompt: 'Create a compliance checklist for [industry/regulation]. Include: requirement, applicable section/article, responsible party, deadline, documentation needed, verification method, last reviewed date.'", interaction: "tap-reveal", tryPrompt: "Build a compliance checklist for your industry.", xp: 65, tokens: 12 },
      { title: "Legal Research Starter", hook: "Find relevant legal concepts quickly.", difficulty: "intermediate", content: "Prompt: 'Research the legal framework around [issue] in [jurisdiction]. Summarize: key statutes, recent case developments, compliance requirements, and common pitfalls. Note: this is a starting point — verify all citations with official sources.'", interaction: "choice", options: ["Statutes + cases + requirements + verify", "Only read Wikipedia", "Ask friends for legal advice", "Ignore the law and hope for the best"], correctAnswer: 0, tryPrompt: "Research a legal topic relevant to your work.", xp: 70, tokens: 14 },
      { title: "Demand Letter Drafter", hook: "Professional demand letters with proper structure.", difficulty: "intermediate", content: "Prompt: 'Draft a demand letter for [situation]. Include: factual background, legal basis, specific demand, deadline for response, consequences of non-compliance. Tone: firm but professional. Note: have counsel review before sending.'", interaction: "tap-reveal", tryPrompt: "Draft a demand letter for a dispute you're handling.", xp: 65, tokens: 12 },
      { title: "IP Protection Guide", hook: "Know what to protect and how.", difficulty: "intermediate", content: "Prompt: 'I have [describe creation/invention/brand]. Advise on IP protection: trademark, copyright, patent, or trade secret? For each applicable type: registration process, estimated cost, timeline, and common mistakes. Jurisdiction: [country].'", interaction: "choice", options: ["Match IP type to protection strategy", "Assume everything is automatically protected", "Only consider patents", "Skip IP protection"], correctAnswer: 0, tryPrompt: "Assess IP protection for something you've created.", xp: 70, tokens: 14 },
      { title: "Terms of Service Analyzer", hook: "Know what you're agreeing to online.", difficulty: "beginner", content: "Prompt: 'Analyze these Terms of Service: [paste key sections]. Identify: data usage policies, arbitration clauses, liability limitations, cancellation terms, and anything unusual or potentially concerning. Rate overall fairness.'", interaction: "tap-reveal", tryPrompt: "Analyze the ToS of a service you use daily.", xp: 50, tokens: 10 },
      { title: "Employment Law Quick-Check", hook: "Basic employment rights and obligations.", difficulty: "beginner", content: "Prompt: 'What are the basic employment law requirements for [situation: hiring/firing/leave/overtime] in [jurisdiction]? Include: employer obligations, employee rights, documentation needed, common violations, and penalties.'", interaction: "choice", options: ["Rights + obligations + documentation + penalties", "Assume you can do anything", "Only check federal law", "Ask coworkers instead"], correctAnswer: 0, tryPrompt: "Check employment requirements for a situation you're facing.", xp: 55, tokens: 10 },
      { title: "Privacy Policy Builder", hook: "Create GDPR/CCPA compliant privacy policies.", difficulty: "advanced", content: "Prompt: 'Draft a privacy policy for [business/app]. Data collected: [list]. Include: data use, sharing, retention, user rights, cookies, security measures, contact info. Comply with: [GDPR/CCPA/both]. Note: legal review required.'", interaction: "tap-reveal", tryPrompt: "Draft a privacy policy for your business or project.", xp: 80, tokens: 16 },
    ],
    workflows: [
      { title: "Contract Review", steps: ["Initial AI scan for red flags", "Identify key terms", "Compare to standard terms", "List negotiation points", "Prepare revision request"] },
      { title: "Compliance Audit", steps: ["List applicable regulations", "AI create checklist", "Review current practices", "Identify gaps", "Create remediation plan"] },
      { title: "Legal Research", steps: ["Define legal question", "AI identify relevant areas", "Find key statutes", "Summarize precedents", "Draft analysis memo"] },
      { title: "Document Preparation", steps: ["Identify document type", "AI draft template", "Customize for situation", "Review for completeness", "Professional review"] },
      { title: "Dispute Resolution", steps: ["Document facts", "AI identify legal position", "Draft communications", "Evaluate options", "Prepare for next steps"] },
    ],
    prompts: [
      { label: "Contract Review", prompt: "Review this contract for red flags: one-sided terms, hidden costs, auto-renewal, liability issues.", level: "beginner" },
      { label: "Legal Translation", prompt: "Translate this legal document into plain English. Highlight my obligations and rights.", level: "beginner" },
      { label: "NDA Draft", prompt: "Draft a mutual NDA for [situation]. Include standard protections and customizable sections.", level: "beginner" },
      { label: "Compliance Check", prompt: "List compliance requirements for [industry] in [jurisdiction]. Include: regulation, requirement, deadline.", level: "pro" },
      { label: "Legal Memo", prompt: "Write a legal research memo on [issue]. Include: question presented, brief answer, discussion, conclusion.", level: "pro" },
      { label: "Privacy Policy", prompt: "Draft a privacy policy for [business]. Include data use, sharing, rights, security, GDPR/CCPA compliance.", level: "pro" },
      { label: "Demand Letter", prompt: "Draft a demand letter for [dispute]. Include: facts, legal basis, demand, deadline.", level: "pro" },
      { label: "Terms of Service", prompt: "Create Terms of Service for [product/service]. Include: usage terms, limitations, liability, dispute resolution.", level: "pro" },
      { label: "Legal Glossary", prompt: "Create a glossary of legal terms found in [document type]. Plain English definitions.", level: "beginner" },
      { label: "Risk Assessment", prompt: "Assess legal risks for [business activity]. Include: risk type, probability, impact, mitigation.", level: "pro" },
    ],
    scenario: { title: "Starting a Business — Legal Setup", description: "You're launching a new business. Use AI to understand entity types, draft initial contracts, create terms of service, and build a compliance checklist for your industry." },
  },

  // 8-22: Remaining categories with full detail
  ...createRemainingTracks(),
];

function createRemainingTracks(): CategoryTrack[] {
  const tracks: Array<{id: string; name: string; icon: string; desc: string; levels: {level: string; modules: string[]}[]; lessons: StarterLesson[]}> = [
    {
      id: "education", name: "Education & Library", icon: "📚", desc: "Curriculum design, lesson planning, and information literacy with AI.",
      levels: [
        { level: "Beginner", modules: ["AI-Powered Lesson Planning", "Student Assessment Templates", "Classroom Communication", "Digital Resource Curation", "Assignment Design"] },
        { level: "Intermediate", modules: ["Differentiated Instruction with AI", "Curriculum Mapping", "Student Data Analysis", "Parent Communication Systems", "Assessment Rubric Design"] },
        { level: "Advanced", modules: ["Personalized Learning Paths", "Educational Research Integration", "School-Wide AI Policy", "Professional Development Design", "Innovation in Teaching"] },
      ],
      lessons: [
        { title: "Lesson Plan Generator", hook: "Create engaging lesson plans in 3 minutes.", difficulty: "beginner", content: "Prompt: 'Create a lesson plan for [subject], [grade level], [duration]. Include: learning objectives (Bloom's taxonomy), warm-up activity, instruction, guided practice, independent practice, assessment, differentiation for struggling/advanced learners.'", interaction: "choice", options: ["Full plan with objectives + differentiation", "Just list topics to cover", "Wing it without a plan", "Use last year's plan unchanged"], correctAnswer: 0, tryPrompt: "Generate a lesson plan for your next class.", xp: 55, tokens: 10 },
        { title: "Rubric Builder", hook: "Fair, clear rubrics in 60 seconds.", difficulty: "beginner", content: "Prompt: 'Create a rubric for [assignment]. Criteria: [list]. Levels: Exceeds/Meets/Approaching/Below. Include specific descriptors for each cell. Make it student-friendly.'", interaction: "tap-reveal", tryPrompt: "Build a rubric for your next assignment.", xp: 50, tokens: 10 },
        { title: "Differentiation Helper", hook: "Reach every learner with tailored activities.", difficulty: "intermediate", content: "Prompt: 'For this lesson: [topic], create differentiated activities for 3 levels: below grade level (scaffold), on grade level, above grade level (extend). Include modified materials and assessment adjustments.'", interaction: "choice", options: ["3 levels with scaffolds and extensions", "One-size-fits-all approach", "Only teach to the middle", "Skip struggling students"], correctAnswer: 0, tryPrompt: "Differentiate your next lesson for 3 levels.", xp: 65, tokens: 12 },
        { title: "Parent Email Templates", hook: "Handle any parent communication professionally.", difficulty: "beginner", content: "Prompt: 'Write a parent email about [situation: behavior concern/academic update/event/conference]. Tone: warm but professional. Include: specific observation, positive note, concern if applicable, action plan, invitation to discuss.'", interaction: "tap-reveal", tryPrompt: "Draft an email for a parent communication you need to send.", xp: 45, tokens: 8 },
        { title: "Quiz Question Generator", hook: "Create varied assessments instantly.", difficulty: "beginner", content: "Prompt: 'Generate 15 quiz questions for [topic], [grade level]. Include: 5 multiple choice, 5 short answer, 3 true/false, 2 higher-order thinking. Provide answer key with explanations. Align to [standard].'", interaction: "choice", options: ["Varied question types aligned to standards", "All multiple choice", "Only recall questions", "Make it impossibly hard"], correctAnswer: 0, tryPrompt: "Generate a quiz for your current unit.", xp: 55, tokens: 10 },
        { title: "IEP Goal Writer", hook: "Write measurable IEP goals efficiently.", difficulty: "intermediate", content: "Prompt: 'Write SMART IEP goals for a student with [needs]. Area: [academic/behavioral/functional]. Include: present level description, annual goal, 3 short-term objectives, measurement criteria, and progress monitoring schedule.'", interaction: "tap-reveal", tryPrompt: "Write IEP goals using the SMART framework.", xp: 70, tokens: 14 },
        { title: "Reading List Curator", hook: "Build grade-appropriate reading lists with AI.", difficulty: "beginner", content: "Prompt: 'Create a reading list for [grade level] on [theme/topic]. Include: 10 titles, author, reading level, brief description, diversity representation, discussion questions for each. Mix fiction and nonfiction.'", interaction: "choice", options: ["Leveled list with diversity + discussion Qs", "Assign one book for everyone", "Only use the textbook", "Let students pick randomly"], correctAnswer: 0, tryPrompt: "Curate a reading list for your students.", xp: 50, tokens: 10 },
        { title: "Classroom Management Script", hook: "Consistent responses for common situations.", difficulty: "intermediate", content: "Prompt: 'Create classroom management scripts for: off-task behavior, disrespect, phone use, late work, peer conflict. Include: calm response, consequence, restorative follow-up. Aligned to [positive/restorative] approach.'", interaction: "tap-reveal", tryPrompt: "Create management scripts for your top 3 challenges.", xp: 60, tokens: 12 },
        { title: "Substitute Teacher Guide", hook: "Emergency sub plans that actually work.", difficulty: "beginner", content: "Prompt: 'Create a substitute teacher guide for [grade/subject]. Include: class schedule, seating chart location, emergency procedures, 3 self-contained lesson plans, student helpers list, behavior expectations, and contact info.'", interaction: "choice", options: ["Complete guide with contingency plans", "Just leave the textbook", "Hope you never need a sub", "Write a note: 'show a movie'"], correctAnswer: 0, tryPrompt: "Create a sub guide for your classroom.", xp: 45, tokens: 8 },
        { title: "Professional Development Plan", hook: "Map your teaching growth with AI.", difficulty: "advanced", content: "Prompt: 'Create a professional development plan for a [subject] teacher wanting to grow in [area]. Include: goals, learning resources, peer observation plan, implementation timeline, evidence of growth, reflection prompts.'", interaction: "tap-reveal", tryPrompt: "Build your personal PD plan.", xp: 75, tokens: 15 },
      ],
    },
    {
      id: "arts-media", name: "Arts & Media", icon: "🎨", desc: "Creative production, content strategy, and media management with AI.",
      levels: [
        { level: "Beginner", modules: ["Content Ideation with AI", "Copywriting Fundamentals", "Social Media Strategy", "Visual Design Basics", "Brand Voice Development"] },
        { level: "Intermediate", modules: ["Content Calendar Systems", "SEO Content Strategy", "Video Script Writing", "Podcast Planning", "Campaign Management"] },
        { level: "Advanced", modules: ["Creative Direction with AI", "Multi-Platform Strategy", "Media Analytics & ROI", "Brand Architecture", "Innovation in Media"] },
      ],
      lessons: [
        { title: "Headline Generator", hook: "Write scroll-stopping headlines every time.", difficulty: "beginner", content: "Prompt: 'Generate 10 headline variations for [topic]. Styles: curiosity gap, how-to, number list, question, controversial take. For each: explain the psychological trigger. Best for: [blog/social/email/ad].'", interaction: "choice", options: ["10 variations with psychological triggers", "Use the first title you think of", "Always use clickbait", "Skip headlines entirely"], correctAnswer: 0, tryPrompt: "Generate headlines for your next piece of content.", xp: 50, tokens: 10 },
        { title: "Brand Voice Guide", hook: "Make every piece of content sound like YOU.", difficulty: "beginner", content: "Prompt: 'Create a brand voice guide for [brand/personal brand]. Define: personality traits (3-5), tone spectrum (formal→casual), vocabulary (use/avoid), example phrases, do/don't list. Include sample paragraphs in the voice.'", interaction: "tap-reveal", tryPrompt: "Define your brand voice with this template.", xp: 55, tokens: 10 },
        { title: "Content Calendar Builder", hook: "30 days of content in 5 minutes.", difficulty: "intermediate", content: "Prompt: 'Create a 30-day content calendar for [brand/niche]. Platforms: [list]. Include: date, platform, content type, topic, hook line, hashtags, CTA. Mix: 40% educational, 30% engaging, 20% promotional, 10% personal.'", interaction: "choice", options: ["Balanced mix across platforms", "Post the same thing everywhere", "Only promote products", "Post randomly when inspired"], correctAnswer: 0, tryPrompt: "Generate a content calendar for next month.", xp: 65, tokens: 12 },
        { title: "Video Script Framework", hook: "Write scripts that keep viewers watching.", difficulty: "intermediate", content: "Prompt: 'Write a video script for [topic], [length]. Structure: hook (first 3 seconds), problem, credibility, solution steps, call to action. Include: b-roll suggestions, on-screen text, and pacing notes.'", interaction: "tap-reveal", tryPrompt: "Script your next video using this framework.", xp: 70, tokens: 14 },
        { title: "SEO Content Brief", hook: "Rank higher with AI-optimized content.", difficulty: "intermediate", content: "Prompt: 'Create an SEO content brief for keyword: [keyword]. Include: search intent, suggested title, outline with H2/H3, word count target, related keywords, internal link suggestions, featured snippet opportunity.'", interaction: "choice", options: ["Intent + outline + keywords + structure", "Just stuff keywords everywhere", "Ignore SEO entirely", "Write for search engines only"], correctAnswer: 0, tryPrompt: "Create an SEO brief for content you're planning.", xp: 65, tokens: 12 },
        { title: "Social Media Hook Library", hook: "Never start a post with a boring first line.", difficulty: "beginner", content: "Prompt: 'Generate 20 social media hooks for [industry/topic]. Types: surprising stat, personal story opener, controversial opinion, question, myth-buster, behind-the-scenes, before/after. Mark which work best for each platform.'", interaction: "tap-reveal", tryPrompt: "Build a hook library for your niche.", xp: 50, tokens: 10 },
        { title: "Email Newsletter Template", hook: "Emails people actually open and read.", difficulty: "beginner", content: "Prompt: 'Design an email newsletter template for [brand]. Include: subject line formulas, preview text, greeting, main story, 2-3 supporting sections, CTA, footer. Optimal length: [X] words. Tone: [describe].'", interaction: "choice", options: ["Template with subject line formulas + CTA", "Write a wall of text", "Send emails without a template", "Make every email a sales pitch"], correctAnswer: 0, tryPrompt: "Design your newsletter template.", xp: 55, tokens: 10 },
        { title: "Podcast Episode Planner", hook: "Plan compelling episodes with structure.", difficulty: "intermediate", content: "Prompt: 'Plan a podcast episode on [topic]. Include: episode title, cold open hook, segment breakdown with timing, interview questions (if applicable), key talking points, sponsor integration spots, call to action, show notes outline.'", interaction: "tap-reveal", tryPrompt: "Plan your next podcast episode.", xp: 65, tokens: 12 },
        { title: "Campaign Brief Creator", hook: "Run marketing campaigns that convert.", difficulty: "advanced", content: "Prompt: 'Create a marketing campaign brief for [product/launch]. Include: objectives, target audience persona, key messages, channels, content types per channel, timeline, budget allocation, success metrics, A/B test ideas.'", interaction: "choice", options: ["Full brief with personas + metrics + tests", "Just post on social media", "Run one ad and hope", "Copy competitor campaigns"], correctAnswer: 0, tryPrompt: "Brief a campaign for your next launch.", xp: 80, tokens: 16 },
        { title: "Creative Portfolio Builder", hook: "Present your work to win clients.", difficulty: "beginner", content: "Prompt: 'Help me structure a creative portfolio for [field]. Include: intro/bio, 5-7 project case studies (challenge→approach→result), skills section, testimonials placement, contact CTA. Format for: [website/PDF/presentation].'", interaction: "tap-reveal", tryPrompt: "Structure your portfolio with AI.", xp: 50, tokens: 10 },
      ],
    },
    {
      id: "healthcare-pract", name: "Healthcare Practitioners", icon: "⚕️", desc: "Clinical documentation, research, and patient communication with AI.",
      levels: [
        { level: "Beginner", modules: ["Clinical Documentation Basics", "Patient Communication Templates", "Medical Terminology Helper", "Appointment Scheduling Optimization", "Health Literacy Materials"] },
        { level: "Intermediate", modules: ["Clinical Protocol Documentation", "Patient Education Materials", "Research Literature Review", "Quality Improvement Projects", "Continuing Education Planning"] },
        { level: "Advanced", modules: ["Evidence-Based Practice Integration", "Clinical Research Support", "Healthcare Policy Analysis", "Interprofessional Communication", "Innovation in Care Delivery"] },
      ],
      lessons: [
        { title: "Patient Education Simplifier", hook: "Explain conditions in words patients understand.", difficulty: "beginner", content: "Prompt: 'Explain [condition] to a patient at a 6th-grade reading level. Include: what it is, common symptoms, treatment options, lifestyle changes, when to seek help. Use analogies. Avoid medical jargon. IMPORTANT: This is for educational support only — always verify with clinical guidelines.'", interaction: "choice", options: ["Simple language with analogies + action steps", "Use full medical terminology", "Give a textbook definition", "Just hand them a pamphlet"], correctAnswer: 0, tryPrompt: "Simplify a condition explanation for a patient.", xp: 55, tokens: 10 },
        { title: "Clinical Note Formatter", hook: "Structure clinical notes consistently.", difficulty: "beginner", content: "Prompt: 'Format these clinical observations into a structured note. Format: [SOAP/DAP/narrative]. Include: subjective, objective findings, assessment, plan. Ensure professional language and completeness. Note: review all AI output against clinical reality.'", interaction: "tap-reveal", tryPrompt: "Format your clinical observations into a structured note.", xp: 50, tokens: 10 },
        { title: "Continuing Ed Tracker", hook: "Plan and track your CE requirements.", difficulty: "beginner", content: "Prompt: 'Create a continuing education tracking plan for [profession] in [state/jurisdiction]. Requirements: [hours/type]. Include: required topics, approved providers, timeline, documentation checklist, renewal dates.'", interaction: "choice", options: ["Tracked plan with requirements + deadlines", "Wing it at renewal time", "Only count conference attendance", "Skip CE altogether"], correctAnswer: 0, tryPrompt: "Map your CE requirements and create a plan.", xp: 45, tokens: 8 },
        { title: "Informed Consent Builder", hook: "Clear consent documents patients actually understand.", difficulty: "intermediate", content: "Prompt: 'Draft an informed consent template for [procedure]. Include: procedure description (plain language), risks, benefits, alternatives, right to refuse, questions section. Reading level: 8th grade. Note: must be reviewed by legal/compliance.'", interaction: "tap-reveal", tryPrompt: "Draft a patient-friendly consent document.", xp: 65, tokens: 12 },
        { title: "Quality Improvement Template", hook: "Structure QI projects that get results.", difficulty: "intermediate", content: "Prompt: 'Design a quality improvement project using PDSA methodology for [issue]. Include: aim statement, measures (outcome/process/balance), change ideas, data collection plan, PDSA cycle template, and sustainability plan.'", interaction: "choice", options: ["PDSA with measures + data plan", "Just identify the problem", "Blame staff for quality issues", "Skip measurement"], correctAnswer: 0, tryPrompt: "Plan a QI project for your practice.", xp: 70, tokens: 14 },
        { title: "Medication Guide Creator", hook: "Patient-friendly medication information sheets.", difficulty: "beginner", content: "Prompt: 'Create a patient medication guide for [medication]. Include: what it treats, how to take it, common side effects, serious side effects (seek help), food/drug interactions, storage. Plain language. DISCLAIMER: supplement to pharmacist counseling.'", interaction: "tap-reveal", tryPrompt: "Create a medication guide for a commonly prescribed drug.", xp: 50, tokens: 10 },
        { title: "Research Summary Writer", hook: "Distill journal articles into clinical takeaways.", difficulty: "intermediate", content: "Prompt: 'Summarize this research article for clinical application: [paste abstract]. Include: key finding, study strength/limitations, clinical relevance, whether it changes practice, and how to discuss with patients. Note: verify findings independently.'", interaction: "choice", options: ["Clinical summary with practice implications", "Read the whole 30-page paper", "Only read the conclusion", "Ignore research entirely"], correctAnswer: 0, tryPrompt: "Summarize a recent article relevant to your practice.", xp: 65, tokens: 12 },
        { title: "Referral Communication", hook: "Professional referral letters that get results.", difficulty: "intermediate", content: "Prompt: 'Write a referral letter to [specialist]. Patient: [demographics]. Reason: [concern]. Include: relevant history, current treatment, specific questions for specialist, urgency level, preferred communication method.'", interaction: "tap-reveal", tryPrompt: "Draft a referral letter for a patient.", xp: 60, tokens: 12 },
        { title: "Telehealth Script Guide", hook: "Structure virtual visits for efficiency.", difficulty: "beginner", content: "Prompt: 'Create a telehealth visit guide for [visit type]. Include: tech check script, opening, focused assessment questions, documentation prompts, closing with next steps, and troubleshooting for common tech issues.'", interaction: "choice", options: ["Full guide with tech check + assessment + closing", "Treat it like an in-person visit", "Skip structure for virtual visits", "Only use telehealth for simple issues"], correctAnswer: 0, tryPrompt: "Create a telehealth guide for your practice.", xp: 50, tokens: 10 },
        { title: "Care Coordination Template", hook: "Coordinate multi-provider care efficiently.", difficulty: "advanced", content: "Prompt: 'Create a care coordination template for [condition]. Include: care team members and roles, communication protocol, shared care plan, transition of care checklist, patient self-management goals, follow-up schedule.'", interaction: "tap-reveal", tryPrompt: "Build a care coordination template for a complex patient.", xp: 75, tokens: 15 },
      ],
    },
  ];

  // Build remaining categories with specific modules
  const remaining: Array<{id: string; name: string; icon: string; desc: string; levels: {level: string; modules: string[]}[]}> = [
    { id: "healthcare-support", name: "Healthcare Support", icon: "🏥", desc: "Patient care documentation, scheduling, and protocols with AI.",
      levels: [
        { level: "Beginner", modules: ["Patient Intake Documentation", "Vital Signs Recording", "Scheduling Optimization", "HIPAA Compliance Basics", "Patient Communication Skills"] },
        { level: "Intermediate", modules: ["Care Plan Assistance", "Medical Records Management", "Insurance & Billing Basics", "Infection Control Protocols", "Team Communication"] },
        { level: "Advanced", modules: ["Quality Metrics Tracking", "Staff Training Programs", "Emergency Preparedness", "Technology Integration", "Process Improvement"] },
      ],
    },
    { id: "protective", name: "Protective Service", icon: "🛡️", desc: "Safety protocols, report writing, and risk assessment with AI.",
      levels: [
        { level: "Beginner", modules: ["Incident Report Writing", "Safety Protocol Documentation", "Emergency Response Plans", "Communication Templates", "Equipment Inspection Checklists"] },
        { level: "Intermediate", modules: ["Risk Assessment Methods", "Training Program Design", "Investigation Documentation", "Compliance Auditing", "Community Relations"] },
        { level: "Advanced", modules: ["Crisis Management Strategy", "Intelligence Analysis Basics", "Policy Development", "Leadership in Emergencies", "Technology for Safety"] },
      ],
    },
    { id: "food-serving", name: "Food & Serving", icon: "🍽️", desc: "Menu planning, food safety, and customer service with AI.",
      levels: [
        { level: "Beginner", modules: ["Menu Description Writing", "Food Safety Checklists", "Customer Service Scripts", "Inventory Tracking Basics", "Social Media for Restaurants"] },
        { level: "Intermediate", modules: ["Menu Engineering & Pricing", "Staff Training Manuals", "Vendor Negotiation", "Health Inspection Prep", "Review Response Strategy"] },
        { level: "Advanced", modules: ["Restaurant Financial Management", "Brand & Concept Development", "Multi-Location Operations", "Catering Business Growth", "Innovation in Food Service"] },
      ],
    },
    { id: "grounds", name: "Grounds Maintenance", icon: "🌿", desc: "Landscape planning, scheduling, and equipment management with AI.",
      levels: [
        { level: "Beginner", modules: ["Maintenance Schedule Planning", "Plant Identification Helper", "Equipment Maintenance Logs", "Client Proposal Templates", "Safety Documentation"] },
        { level: "Intermediate", modules: ["Landscape Design Basics", "Irrigation System Planning", "Pest Management Protocols", "Seasonal Planning Calendars", "Cost Estimation"] },
        { level: "Advanced", modules: ["Sustainable Landscaping", "Business Growth Strategy", "Large Project Management", "Environmental Compliance", "Innovation in Groundskeeping"] },
      ],
    },
    { id: "personal-care", name: "Personal Care", icon: "💆", desc: "Client management, scheduling, and service planning with AI.",
      levels: [
        { level: "Beginner", modules: ["Client Consultation Forms", "Appointment Scheduling", "Product Recommendation Scripts", "Social Media for Stylists", "Client Record Keeping"] },
        { level: "Intermediate", modules: ["Service Menu Development", "Client Retention Strategies", "Staff Training Programs", "Inventory Management", "Marketing & Promotions"] },
        { level: "Advanced", modules: ["Business Expansion Planning", "Brand Building", "Advanced Client Analysis", "Trend Forecasting", "Salon/Spa Management"] },
      ],
    },
    { id: "sales", name: "Sales", icon: "📊", desc: "Prospecting, pitching, and closing deals with AI.",
      levels: [
        { level: "Beginner", modules: ["Prospecting Email Templates", "Cold Call Scripts", "Product Knowledge Sheets", "CRM Data Entry Basics", "Follow-Up Sequences"] },
        { level: "Intermediate", modules: ["Objection Handling Scripts", "Sales Presentation Design", "Pipeline Management", "Negotiation Techniques", "Account Management"] },
        { level: "Advanced", modules: ["Enterprise Sales Strategy", "Sales Team Leadership", "Revenue Forecasting", "Channel Partner Programs", "Sales Process Optimization"] },
      ],
    },
    { id: "office-admin", name: "Office & Admin", icon: "📋", desc: "Document management, scheduling, and process automation with AI.",
      levels: [
        { level: "Beginner", modules: ["Email Management Systems", "Document Templates Library", "Meeting Scheduling & Notes", "Filing System Organization", "Basic Data Entry Automation"] },
        { level: "Intermediate", modules: ["Process Documentation (SOPs)", "Spreadsheet Automation", "Vendor & Supply Management", "Event & Travel Coordination", "Report Generation"] },
        { level: "Advanced", modules: ["Office Digital Transformation", "Budget & Expense Management", "HR Support Functions", "Executive Communication", "Workflow Optimization"] },
      ],
    },
    { id: "agriculture", name: "Agriculture", icon: "🌾", desc: "Crop planning, market analysis, and farm management with AI.",
      levels: [
        { level: "Beginner", modules: ["Crop Planning Calendar", "Weather & Soil Analysis", "Record Keeping Systems", "Market Price Tracking", "Equipment Maintenance Logs"] },
        { level: "Intermediate", modules: ["Precision Agriculture Basics", "Pest & Disease Identification", "Financial Planning for Farms", "Supply Chain Management", "Regulatory Compliance"] },
        { level: "Advanced", modules: ["Sustainable Farming Practices", "Agribusiness Strategy", "Technology Integration", "Export & Market Expansion", "Climate Adaptation Planning"] },
      ],
    },
    { id: "construction", name: "Construction", icon: "🔨", desc: "Project management, safety, and estimation with AI.",
      levels: [
        { level: "Beginner", modules: ["Job Site Safety Checklists", "Daily Report Writing", "Material Quantity Takeoffs", "Tool & Equipment Tracking", "Basic Blueprint Reading Aid"] },
        { level: "Intermediate", modules: ["Project Scheduling (Gantt/CPM)", "Cost Estimation Methods", "Subcontractor Management", "Change Order Documentation", "Quality Control Procedures"] },
        { level: "Advanced", modules: ["Multi-Project Management", "Bidding & Proposal Strategy", "Risk Management Planning", "Building Code Navigation", "Business Development"] },
      ],
    },
    { id: "installation", name: "Installation & Repair", icon: "🔧", desc: "Troubleshooting, documentation, and customer service with AI.",
      levels: [
        { level: "Beginner", modules: ["Troubleshooting Decision Trees", "Service Report Writing", "Customer Communication Scripts", "Parts Inventory Systems", "Safety Procedure Documentation"] },
        { level: "Intermediate", modules: ["Diagnostic Flowcharts", "Preventive Maintenance Programs", "Warranty Claim Documentation", "Service Pricing Strategy", "Technical Manual Creation"] },
        { level: "Advanced", modules: ["Fleet/Team Management", "Service Business Growth", "Advanced Diagnostics with AI", "Training Program Development", "Innovation in Service Delivery"] },
      ],
    },
    { id: "production", name: "Production", icon: "🏭", desc: "Quality control, process optimization, and inventory with AI.",
      levels: [
        { level: "Beginner", modules: ["Quality Inspection Checklists", "Production Log Documentation", "Inventory Tracking Basics", "Safety Incident Reporting", "Standard Work Instructions"] },
        { level: "Intermediate", modules: ["Process Flow Optimization", "Statistical Quality Control", "Lean Manufacturing Basics", "Supply Chain Coordination", "Equipment Maintenance Planning"] },
        { level: "Advanced", modules: ["Six Sigma Project Management", "Production Capacity Planning", "Automation Integration", "Continuous Improvement Culture", "Industry 4.0 Readiness"] },
      ],
    },
    { id: "transportation", name: "Transportation", icon: "🚛", desc: "Route optimization, logistics, and compliance with AI.",
      levels: [
        { level: "Beginner", modules: ["Route Planning Basics", "Vehicle Inspection Checklists", "Delivery Documentation", "Customer Communication", "Hours of Service Compliance"] },
        { level: "Intermediate", modules: ["Fleet Management Systems", "Fuel Efficiency Optimization", "Freight & Load Planning", "Regulatory Compliance Tracking", "Driver Training Programs"] },
        { level: "Advanced", modules: ["Logistics Network Design", "Transportation Analytics", "Multi-Modal Strategy", "Sustainability in Transport", "Technology Integration"] },
      ],
    },
  ];

  // Convert remaining categories to full CategoryTrack objects
  return [...tracks.map(t => ({
    id: t.id, name: t.name, icon: t.icon, description: t.desc,
    levels: t.levels,
    starterLessons: t.lessons,
    workflows: generateWorkflows(t.name),
    prompts: generatePrompts(t.name),
    scenario: { title: `A Day in ${t.name}`, description: `Simulate a challenging day in ${t.name.toLowerCase()}. Handle real situations, solve problems, and optimize your workflow using AI at every step.` },
  })), ...remaining.map(cat => ({
    id: cat.id, name: cat.name, icon: cat.icon, description: cat.desc,
    levels: cat.levels,
    starterLessons: generateStarterLessons(cat.name, cat.id),
    workflows: generateWorkflows(cat.name),
    prompts: generatePrompts(cat.name),
    scenario: { title: `A Day in ${cat.name}`, description: `Simulate a challenging day in ${cat.name.toLowerCase()}. Handle real-world situations, solve unexpected problems, and optimize your workflow using AI at every step.` },
  }))];
}

function generateStarterLessons(name: string, id: string): StarterLesson[] {
  return [
    { title: `AI for ${name} Intro`, hook: `Discover how AI transforms ${name.toLowerCase()}.`, difficulty: "beginner", content: `AI is changing ${name.toLowerCase()} in 3 key ways: automation of repetitive documentation, intelligent analysis of data patterns, and enhanced communication. This lesson covers the top 5 AI use cases that save professionals in ${name.toLowerCase()} the most time.`, interaction: "choice", options: [`Automation + analysis + communication`, "AI replaces all jobs", "AI only works for tech people", "AI is too expensive to use"], correctAnswer: 0, tryPrompt: `List 3 tasks in your ${name.toLowerCase()} work that could benefit from AI.`, xp: 50, tokens: 10 },
    { title: "Report Writing with AI", hook: "Professional reports in half the time.", difficulty: "beginner", content: `Prompt: 'Write a professional ${name.toLowerCase()} report. Include: summary, key findings, data/observations, analysis, recommendations, next steps. Tone: clear and factual. Format with headers and bullet points.' AI handles structure; you add expertise.`, interaction: "tap-reveal", tryPrompt: "Draft a report using this structure.", xp: 50, tokens: 10 },
    { title: "Email Templates Library", hook: "Handle any work message in 30 seconds.", difficulty: "beginner", content: `Build a template library: 'Create 5 email templates for common ${name.toLowerCase()} situations: [update to supervisor, client inquiry response, meeting follow-up, request for information, issue escalation]. Each: subject line, body, professional sign-off.'`, interaction: "choice", options: ["5 templates for common scenarios", "Write every email from scratch", "Use one generic template", "Avoid email communication"], correctAnswer: 0, tryPrompt: "Create email templates for your most common messages.", xp: 45, tokens: 8 },
    { title: "Task Prioritization Matrix", hook: "AI helps you focus on what matters.", difficulty: "beginner", content: "Use Eisenhower Matrix with AI: 'Categorize these tasks using Urgent/Important matrix: [list tasks]. Suggest which to: do first, schedule, delegate, or eliminate. Estimate time for each. Create a prioritized daily plan.'", interaction: "choice", options: ["Urgent/Important matrix with delegation", "Do everything in order received", "Only do urgent tasks", "Procrastinate and see what happens"], correctAnswer: 0, tryPrompt: "Prioritize today's tasks using this matrix.", xp: 50, tokens: 10 },
    { title: "Client Communication Guide", hook: "Say the right thing every time.", difficulty: "intermediate", content: `Prompt: 'Create a communication guide for ${name.toLowerCase()} professionals. Cover 5 difficult scenarios: delivering bad news, handling complaints, setting expectations, following up, and saying no professionally. Include: what to say, what to avoid, tone guidance.'`, interaction: "tap-reveal", tryPrompt: "Build a communication guide for your toughest scenarios.", xp: 60, tokens: 12 },
    { title: "Process Documentation", hook: "Turn know-how into repeatable SOPs.", difficulty: "intermediate", content: `Prompt: 'Create a Standard Operating Procedure for [process] in ${name.toLowerCase()}. Include: purpose, scope, responsibilities, step-by-step procedure, quality checks, common errors to avoid, and revision history section.'`, interaction: "choice", options: ["Full SOP with quality checks", "Just describe the process verbally", "Let everyone do it their own way", "Only document when audited"], correctAnswer: 0, tryPrompt: "Document a process you perform regularly.", xp: 65, tokens: 12 },
    { title: "Problem-Solving Framework", hook: "Structured troubleshooting with AI.", difficulty: "intermediate", content: "Prompt: 'I'm facing this problem: [describe]. Help me troubleshoot using: 1) Define the problem clearly, 2) List possible causes (most to least likely), 3) For each cause: diagnostic test, 4) Recommended solution, 5) Prevention plan.' This systematic approach beats random guessing.", interaction: "tap-reveal", tryPrompt: "Apply this framework to a current problem.", xp: 65, tokens: 12 },
    { title: "Industry Trends Scanner", hook: "Stay ahead of changes in your field.", difficulty: "intermediate", content: `Prompt: 'What are the top 5 trends affecting ${name.toLowerCase()} in 2024-2025? For each: what's changing, impact on daily work, skills needed, opportunities to prepare. Include 2 emerging technologies that will matter soon.'`, interaction: "choice", options: ["Trends with impact + skills + preparation", "Ignore industry changes", "Only follow what competitors do", "Wait until trends are obvious"], correctAnswer: 0, tryPrompt: "Scan trends in your specific field.", xp: 60, tokens: 12 },
    { title: "Safety Checklist Builder", hook: "Never miss a safety requirement.", difficulty: "beginner", content: `Prompt: 'Create a safety checklist for [specific activity] in ${name.toLowerCase()}. Include: pre-work checks, required PPE, hazard identification, emergency procedures, incident reporting steps, sign-off fields. Comply with [relevant standards].'`, interaction: "tap-reveal", tryPrompt: "Build a safety checklist for your workplace.", xp: 50, tokens: 10 },
    { title: "Professional Development Plan", hook: "Map your career growth with AI.", difficulty: "advanced", content: `Prompt: 'Create a 12-month professional development plan for a ${name.toLowerCase()} professional. Current role: [X]. Goal: [Y]. Include: skill gaps to address, learning resources, certifications to pursue, networking actions, milestone checkpoints, and a self-assessment rubric.'`, interaction: "choice", options: ["12-month plan with milestones + resources", "Just hope for promotion", "Only do required training", "Stay in current role forever"], correctAnswer: 0, tryPrompt: "Build your professional development plan.", xp: 75, tokens: 15 },
  ];
}

function generateWorkflows(name: string): {title: string; steps: string[]}[] {
  return [
    { title: "Daily Planning", steps: ["Review tasks & priorities", "AI categorize by urgency", "Time-block schedule", "Set 3 key goals", "End-of-day review & prep"] },
    { title: "Documentation System", steps: ["Create standardized templates", "AI fill routine details", "Review & personalize", "Distribute to stakeholders", "Track completion & updates"] },
    { title: "Client/Stakeholder Interaction", steps: ["Prep talking points with AI", "Conduct meeting/call", "AI draft follow-up notes", "Extract action items", "Update records & schedule next"] },
    { title: "Quality Assurance Review", steps: ["Define quality standards", "AI generate checklist", "Perform inspection/review", "Document findings", "Create improvement action plan"] },
    { title: "Staff Training Program", steps: ["Identify skill gaps", "AI create training content", "Design practice exercises", "Deliver & assess", "Gather feedback & iterate"] },
  ];
}

function generatePrompts(name: string): {label: string; prompt: string; level: "beginner" | "pro"}[] {
  return [
    { label: "Daily Report", prompt: `Write a professional daily ${name.toLowerCase()} report. Include: tasks completed, issues encountered, tomorrow's priorities, resource needs.`, level: "beginner" },
    { label: "Professional Email", prompt: `Draft a professional email for a ${name.toLowerCase()} situation: [describe]. Tone: clear and respectful. Include specific next steps.`, level: "beginner" },
    { label: "Process SOP", prompt: `Create a Standard Operating Procedure for [task] in ${name.toLowerCase()}. Include: purpose, steps, safety notes, quality checks.`, level: "beginner" },
    { label: "Problem Analysis", prompt: "Analyze this issue: [description]. Identify: root cause, immediate actions, long-term fix, prevention strategy.", level: "pro" },
    { label: "Training Material", prompt: `Create training material for new ${name.toLowerCase()} staff on [topic]. Include: key concepts, common mistakes, practice exercises.`, level: "beginner" },
    { label: "Cost Estimate", prompt: "Estimate costs for [project/task]. Break down: labor, materials, equipment, overhead, contingency.", level: "pro" },
    { label: "Safety Protocol", prompt: `Write a safety protocol for [activity] in ${name.toLowerCase()}. Include: hazards, PPE, procedures, emergency contacts.`, level: "beginner" },
    { label: "Performance Metrics", prompt: "Define KPIs for [role/process]. Include: metric name, target, measurement method, frequency.", level: "pro" },
    { label: "Improvement Proposal", prompt: "Write a process improvement proposal for [current process]. Include: current state, proposed changes, benefits, implementation plan.", level: "pro" },
    { label: "Industry Update", prompt: `Summarize recent trends in ${name.toLowerCase()} that could affect operations. Include: opportunities, threats, actions.`, level: "pro" },
  ];
}

export function getCategoryTrack(id: string): CategoryTrack | undefined {
  const found = CATEGORY_TRACKS.find(t => t.id === id);
  if (found) return found;
  // Bridge: check core tracks and convert to CategoryTrack format
  return getCoreTrackAsCategoryTrack(id);
}

/** Convert a CoreTrackMeta into a CategoryTrack so the same lesson UI works */
function getCoreTrackAsCategoryTrack(id: string): CategoryTrack | undefined {
  const track = CORE_TRACKS.find(t => t.id === id);
  if (!track) return undefined;

  // Create starter lessons for ALL 3 difficulty levels
  const starterLessons: StarterLesson[] = [];
  
  track.modules.forEach((mod, i) => {
    // Beginner lesson
    starterLessons.push({
      title: mod,
      hook: `Master the fundamentals of ${mod.toLowerCase()} — the foundation of ${track.name}.`,
      difficulty: "beginner",
      content: `${mod} is a core skill in ${track.name}. Here's what you need to know:\n\n1. The basics: ${mod} helps you ${track.outcome.toLowerCase()}\n2. Why it matters: ${track.moneyAngle}\n3. Getting started: Focus on understanding the core concept before trying advanced techniques.\n\nPractical example: Start by identifying one area in your daily work where ${mod.toLowerCase()} applies. Apply the simplest version of this concept today.`,
      mentalModel: `Think of ${mod.toLowerCase()} as a tool in your toolkit. At the beginner level, you learn WHAT it does and WHEN to use it. The key insight: ${track.outcome.toLowerCase()}`,
      commonMistakes: `1) Trying to master everything at once — focus on one sub-skill first. 2) Not practicing with real examples — theory without application doesn't stick. 3) Skipping fundamentals — ${mod.toLowerCase()} builds on basic understanding.`,
      upgrade: `Once you understand the basics: ${track.moneyAngle}`,
      bragLine: `I understand the fundamentals of ${mod} and how it creates real value.`,
      interaction: "choice" as const,
      options: [
        `Understanding the core concept and applying it practically`,
        `Memorizing every detail before starting`,
        `Skipping to advanced techniques immediately`,
        `Waiting until you feel "ready" to begin`,
      ],
      correctAnswer: 0,
      tryPrompt: `Open AI chat and ask: "Explain ${mod} in the context of ${track.name}. Give me the simplest explanation, one real-world example, and one thing I can try right now."`,
      xp: 50 + i * 5,
      tokens: 10 + Math.floor(i / 2) * 2,
    });

    // Intermediate lesson
    starterLessons.push({
      title: `${mod} — Applied`,
      hook: `Apply ${mod.toLowerCase()} to real scenarios — move from theory to execution.`,
      difficulty: "intermediate",
      content: `Now that you understand ${mod.toLowerCase()}, it's time to apply it strategically.\n\nAt this level, you should:\n1. Use ${mod.toLowerCase()} in real work situations, not just practice exercises\n2. Combine it with other skills from the ${track.name} track\n3. Start measuring results — what changed after you applied this?\n4. Build repeatable processes around it\n\nThe money angle: ${track.moneyAngle} At the intermediate level, you start seeing real returns from consistent application.`,
      mentalModel: `Intermediate mastery = consistent application + measuring results. You're not just doing ${mod.toLowerCase()} — you're building systems around it. Think: "How can I do this faster, better, and more consistently?"`,
      commonMistakes: `1) Staying in "learning mode" forever — at this stage, you need to execute. 2) Not tracking results — if you can't measure improvement, you can't prove value. 3) Working in isolation — combine ${mod.toLowerCase()} with other skills for compound results.`,
      upgrade: `At the intermediate level, start building templates and workflows around ${mod.toLowerCase()}. Systemize what works so you can repeat it.`,
      bragLine: `I apply ${mod} systematically and measure the results.`,
      interaction: "choice" as const,
      options: [
        `Apply consistently, measure results, and build systems`,
        `Keep reading more theory before acting`,
        `Try it once and move to the next topic`,
        `Only use it when someone tells you to`,
      ],
      correctAnswer: 0,
      tryPrompt: `Ask AI: "Give me a real-world workflow for applying ${mod} in ${track.name}. Include: step-by-step process, common pitfalls, and how to measure success."`,
      xp: 65 + i * 5,
      tokens: 14 + Math.floor(i / 2) * 2,
    });

    // Advanced lesson
    starterLessons.push({
      title: `${mod} — Mastery`,
      hook: `Master ${mod.toLowerCase()} at a strategic level — teach it, optimize it, profit from it.`,
      difficulty: "advanced",
      content: `Advanced mastery of ${mod.toLowerCase()} means you can:\n\n1. Teach it to others clearly and effectively\n2. Identify edge cases and handle them confidently\n3. Combine it with multiple other skills for compound advantage\n4. Create original approaches and frameworks\n5. Use it to generate revenue or significant value\n\nStrategic insight: ${track.moneyAngle}\n\nAt this level, ${mod.toLowerCase()} becomes a competitive advantage — something that sets you apart professionally.`,
      mentalModel: `Mastery = the ability to teach, adapt, and innovate. You don't just use ${mod.toLowerCase()} — you understand WHY it works, can modify it for new situations, and can teach others. This is where expertise becomes leverage.`,
      commonMistakes: `1) Assuming mastery means perfection — it means adaptability. 2) Not teaching others — teaching is the fastest path to deeper understanding. 3) Ignoring new developments — even experts must keep learning. 4) Not monetizing your expertise — mastery without application is wasted potential.`,
      upgrade: `At mastery level, you should be packaging your ${mod.toLowerCase()} knowledge into something sellable: courses, templates, consulting, or products.`,
      bragLine: `I've mastered ${mod} and use it as a competitive advantage.`,
      interaction: "choice" as const,
      options: [
        `Teach it, adapt it, innovate with it, and create value`,
        `Just know more facts than other people`,
        `Never change your approach once it works`,
        `Keep it to yourself as a secret advantage`,
      ],
      correctAnswer: 0,
      tryPrompt: `Ask AI: "I want to become an expert in ${mod} within ${track.name}. Give me: 3 advanced scenarios with solutions, 2 edge cases most people miss, and a framework I can teach others."`,
      xp: 80 + i * 5,
      tokens: 18 + Math.floor(i / 2) * 2,
    });
  });

  return {
    id: track.id,
    name: track.name,
    icon: track.icon,
    description: track.description,
    levels: [
      { level: "Beginner", modules: track.modules },
      { level: "Intermediate", modules: track.modules.map(m => `${m} — Applied`) },
      { level: "Advanced", modules: track.modules.map(m => `${m} — Mastery`) },
    ],
    starterLessons,
    workflows: [
      { title: `${track.name} Workflow`, steps: track.modules.slice(0, 5) },
    ],
    prompts: track.modules.slice(0, 4).map(mod => ({
      label: mod,
      prompt: `Teach me about ${mod} in the context of ${track.name}. Include practical examples, common mistakes, and an actionable exercise.`,
      level: "beginner" as const,
    })),
    scenario: {
      title: `Apply ${track.name}`,
      description: `${track.description} ${track.moneyAngle}`,
    },
  };
}

// Get all module lesson starters for a specific module
export function getModuleLessons(categoryId: string, level: string, moduleIndex: number): StarterLesson[] {
  const track = getCategoryTrack(categoryId);
  if (!track) return [];
  const levelData = track.levels.find(l => l.level === level);
  if (!levelData || !levelData.modules[moduleIndex]) return [];
  
  const moduleName = levelData.modules[moduleIndex];
  // Filter starter lessons by difficulty matching the level
  const difficultyMap: Record<string, string> = { "Beginner": "beginner", "Intermediate": "intermediate", "Advanced": "advanced" };
  const diff = difficultyMap[level] || "beginner";
  
  const matching = track.starterLessons.filter(l => l.difficulty === diff);
  // Return at least some lessons, cycling through available ones
  if (matching.length === 0) return track.starterLessons.slice(0, 5);
  return matching;
}
