/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";

import {
  HOST_COMPETITION_STEP_COUNT,
  hostCompetitionInitialState,
  hostCompetitionReducer,
  QUESTION_CODE_SEED,
} from "./HostCompetitionWizardContext";
import type { HostCompetitionAction, HostCompetitionState } from "./HostCompetitionWizardContext";
/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */
/** Run a single action against the initial state. */
function run(
  action: HostCompetitionAction,
  from: HostCompetitionState = hostCompetitionInitialState,
) {
  return hostCompetitionReducer(from, action);
}
/** ################################ /HELPERS ############################# */

describe("hostCompetitionReducer", () => {
  it("clamps step navigation inside the wizard bounds", () => {
    expect(run({ type: "NEXT_STEP" }).step).toBe(2);

    const atLast = hostCompetitionReducer(
      { ...hostCompetitionInitialState, step: HOST_COMPETITION_STEP_COUNT },
      { type: "NEXT_STEP" },
    );
    expect(atLast.step).toBe(HOST_COMPETITION_STEP_COUNT);

    expect(run({ type: "PREVIOUS_STEP" }).step).toBe(1);
    expect(run({ type: "SET_STEP", payload: 99 }).step).toBe(HOST_COMPETITION_STEP_COUNT);
  });

  it("adds prize cards with unique ids and patches/removes them", () => {
    const added = run({ type: "ADD_PRIZE" });
    expect(added.draft.prizes).toHaveLength(2);
    const newId = added.draft.prizes[1].id;
    expect(newId).not.toBe(added.draft.prizes[0].id);

    const patched = run(
      { type: "UPDATE_PRIZE", payload: { id: newId, patch: { rank: "1st place" } } },
      added,
    );
    expect(patched.draft.prizes[1].rank).toBe("1st place");

    const removed = run({ type: "REMOVE_PRIZE", payload: newId }, patched);
    expect(removed.draft.prizes).toHaveLength(1);
  });

  it("adds and removes timeline phases", () => {
    const added = run({ type: "ADD_PHASE" });
    expect(added.draft.phases).toHaveLength(2);

    const removed = run({ type: "REMOVE_PHASE", payload: added.draft.phases[1].id }, added);
    expect(removed.draft.phases).toHaveLength(1);
  });

  it("adds labelled question tabs and activates them", () => {
    const added = run({ type: "ADD_QUESTION" });
    expect(added.draft.questions).toHaveLength(2);
    expect(added.draft.questions[1].label).toBe("Q2.");
    expect(added.draft.questions[1].code).toBe(QUESTION_CODE_SEED);
    expect(added.draft.activeQuestionId).toBe(added.draft.questions[1].id);
  });

  it("switches the active module and merges module settings", () => {
    const withModule = run({ type: "SET_ACTIVE_MODULE", payload: "code-editor" });
    expect(withModule.draft.activeModule).toBe("code-editor");

    const withSettings = run(
      { type: "UPDATE_MODULE_SETTINGS", payload: { difficulty: "HARD", points: "25" } },
      withModule,
    );
    expect(withSettings.draft.moduleSettings.difficulty).toBe("HARD");
    expect(withSettings.draft.moduleSettings.points).toBe("25");
    expect(withSettings.draft.moduleSettings.language).toBe("HTML");
  });

  it("records draft saves and launch", () => {
    expect(run({ type: "SAVE_DRAFT" }).draftSavedAt).not.toBeNull();
    expect(run({ type: "LAUNCH" }).launched).toBe(true);
  });
});
