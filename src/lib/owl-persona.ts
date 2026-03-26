// Adaptive Persona Engine — determines Owl's tone/style based on context

export type PersonaState = "guide" | "operator" | "mentor" | "debrief";

export interface PersonaConfig {
  state: PersonaState;
  intensity: "low" | "medium" | "high";
  verbosity: "concise" | "normal" | "detailed";
  contextHints: string[];
}

const SCREEN_PERSONA_MAP: Record<string, Partial<PersonaConfig>> = {
  // Strategic screens → Operator mode
  "/drills": { state: "operator", intensity: "high", verbosity: "detailed" },
  "/goals": { state: "operator", intensity: "medium", verbosity: "normal" },
  "/wallet": { state: "operator", intensity: "low", verbosity: "concise" },
  "/store": { state: "operator", intensity: "low", verbosity: "concise" },
  // Learning screens → Mentor mode
  "/courses": { state: "mentor", intensity: "medium", verbosity: "normal" },
  "/feed": { state: "mentor", intensity: "low", verbosity: "normal" },
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
}): PersonaConfig {
  const config: PersonaConfig = {
    state: "guide",
    intensity: "medium",
    verbosity: "normal",
    contextHints: [],
  };

  // Screen-based modulation
  const screenPath = context.screen || "/";
  for (const [path, override] of Object.entries(SCREEN_PERSONA_MAP)) {
    if (screenPath.startsWith(path)) {
      Object.assign(config, override);
      break;
    }
  }

  // Goal-based modulation
  if (context.hasActiveGoal) {
    config.state = config.state === "guide" ? "operator" : config.state;
    config.contextHints.push("User has active goal — lean toward execution");
  }

  // Mastery-based modulation
  if (context.masteryAvg !== undefined) {
    if (context.masteryAvg < 20) {
      config.intensity = "low";
      config.contextHints.push("Early learner — be encouraging, not overwhelming");
    } else if (context.masteryAvg > 70) {
      config.intensity = "high";
      config.contextHints.push("Advanced user — skip basics, go deep");
    }
  }

  // Streak awareness
  if (context.streak && context.streak >= 7) {
    config.contextHints.push(`Strong ${context.streak}-day streak — acknowledge momentum`);
  } else if (context.streak === 0) {
    config.contextHints.push("No active streak — gentle re-engagement");
  }

  // Time-of-day awareness
  const timeHint = getTimeOfDayHint();
  if (timeHint === "late-night") {
    config.contextHints.push("It's late — be concise, respect their time");
    config.verbosity = "concise";
  } else if (timeHint === "early-morning") {
    config.contextHints.push("Early morning session — energizing but focused");
  }

  // Session depth
  if (context.messageCount && context.messageCount > 10) {
    config.contextHints.push("Deep conversation — can reference earlier points");
  }

  // Lessons today
  if (context.lessonsToday && context.lessonsToday >= 5) {
    config.contextHints.push("Heavy study day — user is in deep work mode");
  }

  return config;
}

export function personaToSystemHint(config: PersonaConfig): string {
  const lines: string[] = [];

  lines.push(`PERSONA STATE: ${config.state.toUpperCase()}`);
  lines.push(`INTENSITY: ${config.intensity} | VERBOSITY: ${config.verbosity}`);

  if (config.contextHints.length > 0) {
    lines.push("CONTEXTUAL HINTS:");
    for (const hint of config.contextHints) {
      lines.push(`- ${hint}`);
    }
  }

  return lines.join("\n");
}
