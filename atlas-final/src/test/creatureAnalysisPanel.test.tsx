import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatureAnalysisPanel } from "@plugins/creature/components/CreatureAnalysisPanel";
import { createAbilityEntry, createDefaultCreatureData, type CreatureData } from "@plugins/creature/schema";

function creature(): CreatureData {
  const data = createDefaultCreatureData();
  data.hitPoints = 25;
  data.armorClass = 13;
  const action = createAbilityEntry();
  action.name = "Strike";
  action.damage = { diceCount: 1, diceType: "d10", bonus: 0, damageType: "slashing" };
  action.attackBonus = 3;
  data.actions = [action];
  return data;
}

describe("CreatureAnalysisPanel", () => {
  it("renders estimator factors and fractional CR values from the structured analysis", () => {
    render(<CreatureAnalysisPanel data={creature()} />);

    expect(screen.getByText("Estimated CR")).toBeTruthy();
    expect(screen.getByText("Defensive CR")).toBeTruthy();
    expect(screen.getByText("Offensive CR")).toBeTruthy();
    expect(screen.getByText(/damage per round/i)).toBeTruthy();
    expect(screen.getByText("Estimated CR").parentElement?.querySelector("strong")?.textContent).toBe("1/4");
    expect(screen.getByText("Updates as you edit")).toBeTruthy();
  });

  it("shows assumptions and estimator notices when expanded", () => {
    render(<CreatureAnalysisPanel data={createDefaultCreatureData()} />);
    fireEvent.click(screen.getByText("Assumptions & Limitations"));

    expect(screen.getByText(/2014 DMG defensive\/offensive CR approach/)).toBeTruthy();
    expect(screen.getByText(/highest-damage structured ordinary Action/)).toBeTruthy();
    expect(screen.getByText("Analysis notices")).toBeTruthy();
    expect(screen.getAllByText(/No structured action damage was available/).length).toBeGreaterThan(0);
  });

  it("updates the displayed CR when the input data changes", () => {
    const initial = creature();
    const view = render(<CreatureAnalysisPanel data={initial} />);
    const before = screen.getByText("Estimated CR").parentElement?.querySelector("strong")?.textContent;

    view.rerender(<CreatureAnalysisPanel data={{ ...initial, hitPoints: 500 }} />);
    const after = screen.getByText("Estimated CR").parentElement?.querySelector("strong")?.textContent;

    expect(after).not.toBe(before);
  });

  it("normalizes incomplete data for display and does not mutate authored values", () => {
    const partial = { hitPoints: 31, armorClass: 14 } as CreatureData;
    const before = JSON.stringify(partial);
    render(<CreatureAnalysisPanel data={partial} />);

    expect(screen.getByText("Creature Content")).toBeTruthy();
    expect(screen.getByText("Mobility & Senses", { exact: false })).toBeTruthy();
    expect(JSON.stringify(partial)).toBe(before);
  });
});
