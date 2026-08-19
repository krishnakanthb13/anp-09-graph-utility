import {
  tokenizeMath,
  parseMathTokens,
  evaluateAst,
  compileMathExpression,
  evaluateMathExpression
} from "../lib/utils/mathEvaluator.js";

describe("mathEvaluator", () => {
  describe("Arithmetic & Precedence", () => {
    test("evaluates basic arithmetic operations", () => {
      expect(evaluateMathExpression("2 + 3", 0)).toBe(5);
      expect(evaluateMathExpression("10 - 4", 0)).toBe(6);
      expect(evaluateMathExpression("3 * 7", 0)).toBe(21);
      expect(evaluateMathExpression("15 / 3", 0)).toBe(5);
      expect(evaluateMathExpression("10 % 3", 0)).toBe(1);
      expect(evaluateMathExpression("2 ^ 3", 0)).toBe(8);
    });

    test("respects operator precedence", () => {
      expect(evaluateMathExpression("2 + 3 * 4", 0)).toBe(14);
      expect(evaluateMathExpression("(2 + 3) * 4", 0)).toBe(20);
      expect(evaluateMathExpression("2 * 3 ^ 2", 0)).toBe(18);
      expect(evaluateMathExpression("(2 * 3) ^ 2", 0)).toBe(36);
      expect(evaluateMathExpression("10 - 3 - 2", 0)).toBe(5);
      expect(evaluateMathExpression("2 ^ 3 ^ 2", 0)).toBe(512); // Right-associative 2^(3^2) = 2^9 = 512
    });

    test("handles unary negation and plus", () => {
      expect(evaluateMathExpression("-5", 0)).toBe(-5);
      expect(evaluateMathExpression("+5", 0)).toBe(5);
      expect(evaluateMathExpression("-x + 2", 3)).toBe(-1);
      expect(evaluateMathExpression("-(x + 2)", 3)).toBe(-5);
    });
  });

  describe("Variable 'x' evaluation", () => {
    test("evaluates linear and polynomial formulas with x", () => {
      expect(evaluateMathExpression("x", 42)).toBe(42);
      expect(evaluateMathExpression("x^2 - 4*x + 4", 2)).toBe(0);
      expect(evaluateMathExpression("x^2 - 4*x + 4", 3)).toBe(1);
      expect(evaluateMathExpression("x^3 - x", 2)).toBe(6);
    });

    test("handles implicit multiplication", () => {
      expect(evaluateMathExpression("2x", 5)).toBe(10);
      expect(evaluateMathExpression("3x^2", 2)).toBe(12);
      expect(evaluateMathExpression("(x+1)(x-1)", 3)).toBe(8);
      expect(evaluateMathExpression("2(x+3)", 4)).toBe(14);
      expect(evaluateMathExpression("2sin(x)", 0)).toBe(0);
    });
  });

  describe("Constants & Functions", () => {
    test("evaluates mathematical constants", () => {
      expect(evaluateMathExpression("pi", 0)).toBeCloseTo(Math.PI);
      expect(evaluateMathExpression("e", 0)).toBeCloseTo(Math.E);
      expect(evaluateMathExpression("tau", 0)).toBeCloseTo(Math.PI * 2);
      expect(evaluateMathExpression("2pi", 0)).toBeCloseTo(Math.PI * 2);
    });

    test("evaluates standard mathematical functions", () => {
      expect(evaluateMathExpression("sin(0)", 0)).toBe(0);
      expect(evaluateMathExpression("cos(0)", 0)).toBe(1);
      expect(evaluateMathExpression("sin(pi / 2)", 0)).toBeCloseTo(1);
      expect(evaluateMathExpression("sqrt(16)", 0)).toBe(4);
      expect(evaluateMathExpression("abs(-7)", 0)).toBe(7);
      expect(evaluateMathExpression("ln(e)", 0)).toBeCloseTo(1);
      expect(evaluateMathExpression("log(100)", 0)).toBeCloseTo(2);
      expect(evaluateMathExpression("exp(0)", 0)).toBe(1);
      expect(evaluateMathExpression("floor(3.9)", 0)).toBe(3);
      expect(evaluateMathExpression("ceil(3.1)", 0)).toBe(4);
      expect(evaluateMathExpression("round(3.5)", 0)).toBe(4);
    });
  });

  describe("Defensive Edge Cases & Error Handling", () => {
    test("returns null for division by zero and domain violations", () => {
      expect(evaluateMathExpression("1 / 0", 0)).toBeNull();
      expect(evaluateMathExpression("1 / x", 0)).toBeNull();
      expect(evaluateMathExpression("sqrt(-4)", 0)).toBeNull();
      expect(evaluateMathExpression("ln(-1)", 0)).toBeNull();
    });

    test("handles syntax errors gracefully in compileMathExpression", () => {
      const empty = compileMathExpression("");
      expect(empty.error).toBeTruthy();
      expect(empty.evaluate(5)).toBeNull();

      const invalidChar = compileMathExpression("2 + @ 3");
      expect(invalidChar.error).toBeTruthy();

      const mismatchedParen = compileMathExpression("(2 + 3");
      expect(mismatchedParen.error).toBeTruthy();

      const unknownId = compileMathExpression("foo(x)");
      expect(unknownId.error).toContain("Unknown identifier 'foo'");
    });
  });
});
