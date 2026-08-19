import {
  sampleFormula,
  sampleMultiFormulas,
  generateFormulaMarkdownTable
} from "../lib/utils/formulaSampler.js";

describe("formulaSampler", () => {
  describe("sampleFormula", () => {
    test("samples a linear formula over a domain", () => {
      const res = sampleFormula("2x + 1", { xMin: 0, xMax: 10, points: 11 });
      expect(res.error).toBeNull();
      expect(res.points.length).toBe(11);
      expect(res.points[0]).toEqual({ x: 0, y: 1 });
      expect(res.points[5]).toEqual({ x: 5, y: 11 });
      expect(res.points[10]).toEqual({ x: 10, y: 21 });
    });

    test("handles errors when xMin >= xMax", () => {
      const res = sampleFormula("x", { xMin: 10, xMax: 0 });
      expect(res.error).toBe("xMin must be less than xMax");
      expect(res.points.length).toBe(0);
    });

    test("handles undefined points at asymptotes", () => {
      const res = sampleFormula("1 / x", { xMin: -2, xMax: 2, points: 5 });
      // Points: -2, -1, 0, 1, 2
      expect(res.points[2].x).toBe(0);
      expect(res.points[2].y).toBeNull();
    });
  });

  describe("sampleMultiFormulas", () => {
    test("samples multiple active formulas into Chart.js dataset format", () => {
      const formulas = [
        { id: "f1", expression: "sin(x)", name: "Sine", color: "#ff0000", active: true },
        { id: "f2", expression: "cos(x)", name: "Cosine", color: "#00ff00", active: true },
        { id: "f3", expression: "tan(x)", name: "Tangent", color: "#0000ff", active: false }
      ];

      const res = sampleMultiFormulas(formulas, { xMin: -3.1416, xMax: 3.1416, points: 50 });
      expect(res.hasValidData).toBe(true);
      expect(res.datasets.length).toBe(2); // f3 is inactive
      expect(res.datasets[0].label).toBe("Sine");
      expect(res.datasets[0].borderColor).toBe("#ff0000");
      expect(res.datasets[1].label).toBe("Cosine");
    });

    test("handles empty or all-inactive formulas gracefully", () => {
      const res = sampleMultiFormulas([]);
      expect(res.hasValidData).toBe(false);
      expect(res.datasets.length).toBe(0);
    });
  });

  describe("generateFormulaMarkdownTable", () => {
    test("generates markdown table from formulas", () => {
      const formulas = [
        { expression: "x^2", name: "Quadratic", active: true },
        { expression: "2x", name: "Linear", active: true }
      ];

      const tableMd = generateFormulaMarkdownTable(formulas, { xMin: 0, xMax: 2, points: 3 });
      expect(tableMd).toContain("| x | Quadratic | Linear |");
      expect(tableMd).toContain("| --- | --- | --- |");
      expect(tableMd).toContain("| 0 | 0 | 0 |");
      expect(tableMd).toContain("| 1 | 1 | 2 |");
      expect(tableMd).toContain("| 2 | 4 | 4 |");
    });
  });
});
