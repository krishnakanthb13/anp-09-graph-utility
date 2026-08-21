/**
 * @file formulaSampler.js
 * @description Samples mathematical functions over coordinate domains and prepares datasets
 * for Chart.js visualization and Amplenote Markdown table generation.
 */

import { compileMathExpression } from "./mathEvaluator.js";

const DEFAULT_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316"  // Orange
];

/**
 * Samples a single formula over a domain [xMin, xMax].
 * @param {string} formulaStr - Mathematical expression
 * @param {Object} [options] - Domain configuration
 * @param {number} [options.xMin=-10] - Minimum x
 * @param {number} [options.xMax=10] - Maximum x
 * @param {number} [options.points=200] - Sample point count
 * @param {number} [options.maxAbsY=10000] - Clamp limit for vertical asymptotes
 * @returns {{ xValues: number[], yValues: (number|null)[], points: Array<{x: number, y: number|null}>, error: string|null }}
 */
export function sampleFormula(formulaStr, options = {}) {
  const xMin = Number.isFinite(options.xMin) ? options.xMin : -10;
  const xMax = Number.isFinite(options.xMax) ? options.xMax : 10;
  const points = Math.max(2, Math.min(2000, options.points || 200));
  const maxAbsY = options.maxAbsY || 100000;

  if (xMin >= xMax) {
    return {
      xValues: [],
      yValues: [],
      points: [],
      error: "xMin must be less than xMax"
    };
  }

  const compiled = compileMathExpression(formulaStr);
  if (compiled.error) {
    return {
      xValues: [],
      yValues: [],
      points: [],
      error: compiled.error
    };
  }

  const step = (xMax - xMin) / (points - 1);
  const xValues = new Array(points);
  const yValues = new Array(points);
  const ptArray = new Array(points);

  for (let i = 0; i < points; i++) {
    const x = i === points - 1 ? xMax : xMin + i * step;
    // Round floating point jitter for cleaner representation
    const cleanX = Number(x.toFixed(6));
    let y = compiled.evaluate(cleanX);

    if (y !== null && (isNaN(y) || !isFinite(y) || Math.abs(y) > maxAbsY)) {
      y = null;
    } else if (y !== null) {
      y = Number(y.toFixed(6));
    }

    xValues[i] = cleanX;
    yValues[i] = y;
    ptArray[i] = { x: cleanX, y };
  }

  return {
    xValues,
    yValues,
    points: ptArray,
    error: null
  };
}

/**
 * Samples multiple formulas and builds Chart.js ready dataset definitions.
 * @param {Array<Object|string>} formulas - Array of formula strings or { id, expression, name, color }
 * @param {Object} [options] - Domain options
 * @returns {Object} Chart.js data configuration & formula errors
 */
export function sampleMultiFormulas(formulas = [], options = {}) {
  const normFormulas = formulas.map((f, idx) => {
    if (typeof f === "string") {
      return {
        id: `f_${idx + 1}`,
        expression: f,
        name: `f${idx + 1}(x) = ${f}`,
        color: DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
        active: true
      };
    }
    return {
      id: f.id || `f_${idx + 1}`,
      expression: f.expression || "",
      name: f.name || `f${idx + 1}(x) = ${f.expression || ""}`,
      color: f.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
      active: f.active !== false
    };
  });

  const activeFormulas = normFormulas.filter(f => f.active && f.expression.trim().length > 0);
  if (activeFormulas.length === 0) {
    return {
      xValues: [],
      xLabels: [],
      datasets: [],
      errors: {},
      hasValidData: false
    };
  }

  const xMin = Number.isFinite(options.xMin) ? options.xMin : -10;
  const xMax = Number.isFinite(options.xMax) ? options.xMax : 10;
  const points = Math.max(2, Math.min(2000, options.points || 200));

  const step = (xMax - xMin) / (points - 1);
  const xValues = new Array(points);
  const xLabels = new Array(points);

  for (let i = 0; i < points; i++) {
    const x = i === points - 1 ? xMax : xMin + i * step;
    const cleanX = Number(x.toFixed(6));
    xValues[i] = cleanX;
    xLabels[i] = String(cleanX);
  }

  const datasets = [];
  const errors = {};

  activeFormulas.forEach((f) => {
    const sampled = sampleFormula(f.expression, { xMin, xMax, points });
    if (sampled.error) {
      errors[f.id] = sampled.error;
    } else {
      datasets.push({
        id: f.id,
        label: f.name || f.expression,
        expression: f.expression,
        borderColor: f.color,
        backgroundColor: `${f.color}22`,
        borderWidth: 2.5,
        pointRadius: points > 150 ? 0 : 2,
        pointHoverRadius: 5,
        tension: 0.25,
        fill: false,
        spanGaps: false,
        data: sampled.points
      });
    }
  });

  return {
    xValues,
    xLabels,
    datasets,
    errors,
    hasValidData: datasets.length > 0
  };
}

/**
 * Generates an Amplenote-compatible Markdown table containing sampled formula coordinates.
 * @param {Array<Object|string>} formulas - Formulas list
 * @param {Object} [options] - Options (xMin, xMax, points, maxAbsY)
 * @returns {string} Markdown table string
 */
export function generateFormulaMarkdownTable(formulas = [], options = {}) {
  const normFormulas = formulas.map((f, idx) => {
    if (typeof f === "string") {
      return { expression: f, name: `f${idx + 1}(x) = ${f}`, active: true };
    }
    return {
      expression: f.expression || "",
      name: f.name || `f${idx + 1}(x) = ${f.expression || ""}`,
      active: f.active !== false
    };
  }).filter(f => f.active && f.expression.trim().length > 0);

  if (normFormulas.length === 0) {
    return "";
  }

  // Use a reasonable row count for markdown table readability (e.g. 21 to 51 points)
  const points = Math.max(5, Math.min(101, options.points || 21));
  const xMin = Number.isFinite(options.xMin) ? options.xMin : -10;
  const xMax = Number.isFinite(options.xMax) ? options.xMax : 10;
  const maxAbsY = Number.isFinite(options.maxAbsY) ? options.maxAbsY : 100000;
  const step = (xMax - xMin) / (points - 1);

  const compiledList = normFormulas.map(f => ({
    name: f.name.replace(/\|/g, "\\|"),
    compiled: compileMathExpression(f.expression)
  }));

  const headers = ["x", ...compiledList.map(item => item.name)];
  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

  const rows = [];
  for (let i = 0; i < points; i++) {
    const x = i === points - 1 ? xMax : xMin + i * step;
    const cleanX = Number(x.toFixed(6));
    const cellVals = [String(cleanX)];

    for (const item of compiledList) {
      if (item.compiled.error) {
        cellVals.push("ERR");
      } else {
        const y = item.compiled.evaluate(cleanX);
        if (y === null || isNaN(y) || !isFinite(y) || Math.abs(y) > maxAbsY) {
          cellVals.push("NaN");
        } else {
          cellVals.push(String(Number(y.toFixed(6))));
        }
      }
    }
    rows.push(`| ${cellVals.join(" | ")} |`);
  }

  return `${headerRow}\n${separatorRow}\n${rows.join("\n")}`;
}
