import { describe, expect, it, vi } from "vitest";
import { extractGoalsFromLoaMessage, hasLoaGoalPayload, persistLoaGoalsFromMessage } from "./loa-goals";

describe("loa-goals", () => {
  it("extracts and normalizes goals from fenced JSON", () => {
    const content = [
      "Plan",
      "===GOALS_START===",
      "```json",
      "[",
      "  {",
      '    "title": "Make $5k/month from AI services",',
      '    "target_metric": "revenue",',
      '    "target_value": 5000,',
      '    "baseline_value": 500,',
      '    "current_value": 750,',
      '    "deadline": "2026-12-31",',
      '    "why": "Need a reliable income engine",',
      '    "roadmap": ["Define the offer", { "task": "Send 20 outbound messages", "done": true }]',
      "  }",
      "]",
      "```",
      "===GOALS_END===",
    ].join("\n");

    expect(hasLoaGoalPayload(content)).toBe(true);
    expect(extractGoalsFromLoaMessage(content)).toEqual([
      {
        title: "Make $5k/month from AI services",
        targetMetric: "revenue",
        targetValue: 5000,
        currentValue: 750,
        baselineValue: 500,
        deadline: "2026-12-31",
        why: "Need a reliable income engine",
        roadmap: [
          { step: "Define the offer", done: false },
          { step: "Send 20 outbound messages", done: true },
        ],
      },
    ]);
  });

  it("retries once on transient save failure", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "temporary" }), { status: 502 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ createdCount: 1, goals: [{ id: "goal-1", title: "Goal" }] }), { status: 200 }),
      );

    const response = await persistLoaGoalsFromMessage(
      '===GOALS_START===[{"title":"Goal","targetMetric":"custom","targetValue":1,"baselineValue":0,"currentValue":0,"why":"Why","roadmap":[]}]===GOALS_END===',
      "token-123",
      "thread-123",
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.createdCount).toBe(1);
    expect(response.goals[0]?.title).toBe("Goal");
  });
});