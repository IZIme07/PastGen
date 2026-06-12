import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { ClaimRow } from "./ClaimRow";
import { ProposalCard } from "./ProposalCard";

describe("design primitives", () => {
  it("ConfidenceMeter shows value and level label", () => {
    render(<ConfidenceMeter value={76} showLabel />);
    expect(screen.getByText("76")).toBeTruthy();
    expect(screen.getByText("вероятно")).toBeTruthy();
  });

  it("ClaimRow renders fact, sources and conflict", () => {
    render(
      <ClaimRow label="Рождение" value="1928, Тула" confidence={70}
        sources={[{ type: "story", label: "Рассказ дочери" }]}
        alternatives={1} conflict="1928 / 1930" />,
    );
    expect(screen.getByText("Рождение")).toBeTruthy();
    expect(screen.getByText("1928, Тула")).toBeTruthy();
    expect(screen.getByText("Рассказ дочери")).toBeTruthy();
    expect(screen.getByText("1928 / 1930")).toBeTruthy();
  });

  it("ProposalCard shows actions when pending and state when resolved", () => {
    const { rerender } = render(<ProposalCard kind="add_person" title="Новый человек — Громова П." />);
    expect(screen.getByText("Принять")).toBeTruthy();
    expect(screen.getByText("Отклонить")).toBeTruthy();
    rerender(<ProposalCard kind="add_person" title="Новый человек — Громова П." resolvedState="accepted" />);
    expect(screen.getByText("Принято")).toBeTruthy();
  });
});
