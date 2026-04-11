// Adaptive Persona Engine v2.0 — ALPHA-ACCURACY enhanced
// Determines Owl's tone/style based on deep context analysis

export type PersonaState = "guide" | "operator" | "mentor" | "debrief" | "strategist";

export interface PersonaConfig {
  state: PersonaState;
  intensity: "low" | "medium" | "high";
  verbosity: "concise" | "normal" | "detailed";
  contextHints: string[];
  confidenceMode: "standard" | "high-precision" | "exploratory";
}

const SCREEN_PERSONA_MAP: Record<string, Partial<PersonaConfig>> = {
  // Strategic screens → Operator/Strategist mode
  "/drills": { state: "operator", intensity: "high", verbosity: "detailed", confidenceMode: "high-precision" },
  "/goals": { state: "strategist", intensity: "medium", verbosity: "normal", confidenceMode: "high-precision" },
  "/wallet": { state: "operator", intensity: "low", verbosity: "concise" },
  "/store": { state: "operator", intensity: "low", verbosity: "concise" },
  "/arena": { state: "strategist", intensity: "high", verbosity: "detailed", confidenceMode: "high-precision" },
  // Learning screens → Mentor mode
  "/courses": { state: "mentor", intensity: "medium", verbosity: "normal" },
  "/learn": { state: "mentor", intensity: "medium", verbosity: "normal" },
  "/lesson": { state: "mentor", intensity: "medium", verbosity: "detailed" },
  
  // Game screens → Guide with energy
  "/games": { state: "guide", intensity: "medium", verbosity: "concise" },
  // Profile/settings → calm guide
  "/profile": { state: "guide", intensity: "low", verbosity: "concise" },
  "/settings": { state: "guide", intensity: "low", verbosity: "concise" },
  // Dashboard
  "/scoreboard": { state: "guide", intensity: "low", verbosity: "normal" },
};

function getTimeOfDayHint(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "late-night";
  if (hour < 9) return "early-morning";
  if (hour < 12) return "morning";
  if (hour < 14) return "midday";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export function resolvePersona(context: {
  screen?: string;
  masteryAvg?: number;
  streak?: number;
  hasActiveGoal?: boolean;
  lessonsToday?: number;
  messageCount?: number;
  hasNegativeFeedback?: boolean;
  sessionDurationMins?: number;
}): PersonaConfig {
  const config: PersonaConfig = {
    state: "guide",
    intensity: "medium",
    verbosity: "normal",
    contextHints: [],
    confidenceMode: "standard",
  };

  // Screen-based modulation
  const screenPath = context.screen || "/";
  for (const [path, override] of Object.entries(SCREEN_PERSONA_MAP)) {
    if (screenPath.startsWith(path)) {
      Object.assign(config, { ...override, contextHints: config.contextHints });
      break;
    }
  }

  // Goal-based modulation
  if (context.hasActiveGoal) {
    if (config.state === "guide") config.state = "operator";
    config.contextHints.push("User has active goal — lean toward execution and strategic alignment");
  }

  // Mastery-based modulation
  if (context.masteryAvg !== undefined) {
    if (context.masteryAvg < 20) {
      config.intensity = "low";
      config.confidenceMode = "exploratory";
      config.contextHints.push("Early learner — be encouraging, build foundation, don't overwhelm");
    } else if (context.masteryAvg > 70) {
      config.intensity = "high";
      config.confidenceMode = "high-precision";
      config.contextHints.push("Advanced user — skip basics, go deep, challenge assumptions");
    } else if (context.masteryAvg > 40) {
      config.contextHints.push("Intermediate learner — push toward mastery, introduce advanced concepts");
    }
  }

  // Streak awareness
  if (context.streak && context.streak >= 14) {
    config.contextHints.push(`Exceptional ${context.streak}-day streak — this user is committed, match their energy`);
  } else if (context.streak && context.streak >= 7) {
    config.contextHints.push(`Strong ${context.streak}-day streak — acknowledge momentum, push harder`);
  } else if (context.streak === 0) {
    config.contextHints.push("No active streak — gentle re-engagement, low pressure");
  }

  // Negative feedback awareness (NFLA integration)
  if (context.hasNegativeFeedback) {
    config.confidenceMode = "high-precision";
    config.contextHints.push("User has given negative feedback recently — be extra precise, validate understanding before responding, ask clarifying questions when uncertain");
  }

  // Session depth
  if (context.sessionDurationMins && context.sessionDurationMins > 45) {
    config.contextHints.push("Extended session (45+ min) — user is deeply engaged, can handle complex topics");
  } else if (context.messageCount && context.messageCount > 15) {
    config.contextHints.push("Deep conversation — reference earlier points, maintain thread continuity");
  } else if (context.messageCount && context.messageCount > 10) {
    config.contextHints.push("Sustained conversation — can reference earlier points");
  }

  // Time-of-day awareness
  const timeHint = getTimeOfDayHint();
  if (timeHint === "late-night") {
    config.contextHints.push("Late night session — be concise, respect their time, no lengthy explanations");
    config.verbosity = "concise";
  } else if (timeHint === "early-morning") {
    config.contextHints.push("Early morning — energizing but focused, help them start strong");
  } else if (timeHint === "evening") {
    config.contextHints.push("Evening session — could be wind-down or deep work, match their energy");
  }

  // Lessons today
  if (context.lessonsToday && context.lessonsToday >= 5) {
    config.contextHints.push("Heavy study day (5+ lessons) — user is in deep work mode, maintain intensity");
  } else if (context.lessonsToday && context.lessonsToday >= 3) {
    config.contextHints.push("Active study day — user is engaged and building momentum");
  }

  return config;
}

export function personaToSystemHint(config: PersonaConfig): string {
  const lines: string[] = [];

  lines.push(`PERSONA STATE: ${config.state.toUpperCase()}`);
  lines.push(`INTENSITY: ${config.intensity} | VERBOSITY: ${config.verbosity} | CONFIDENCE: ${config.confidenceMode}`);

  if (config.confidenceMode === "high-precision") {
    lines.push("HIGH-PRECISION MODE: Double-check facts, prefer specificity over generality, ask for clarification when ambiguous.");
  } else if (config.confidenceMode === "exploratory") {
    lines.push("EXPLORATORY MODE: User is learning — prioritize clarity and building understanding.");
  }

  if (config.contextHints.length > 0) {
    lines.push("CONTEXTUAL DIRECTIVES:");
    for (const hint of config.contextHints) {
      lines.push(`- ${hint}`);
    }
  }

  return lines.join("\n");
}
