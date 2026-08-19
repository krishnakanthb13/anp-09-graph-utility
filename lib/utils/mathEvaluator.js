/**
 * @file mathEvaluator.js
 * @description Safe, lightweight mathematical expression parser and evaluator.
 * Supports standard arithmetic, algebraic precedence, parentheses, implicit multiplication,
 * mathematical constants (pi, e, tau, phi), and a rich set of math functions.
 * Does NOT use eval() or Function constructor.
 */

const CONSTANTS = Object.freeze({
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E,
  tau: Math.PI * 2,
  TAU: Math.PI * 2,
  phi: (1 + Math.sqrt(5)) / 2,
  PHI: (1 + Math.sqrt(5)) / 2
});

const FUNCTIONS = Object.freeze({
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  log10: Math.log10,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  min: Math.min,
  max: Math.max,
  pow: Math.pow
});

const TOKEN_TYPES = Object.freeze({
  NUMBER: "NUMBER",
  VARIABLE: "VARIABLE",
  CONSTANT: "CONSTANT",
  FUNCTION: "FUNCTION",
  OPERATOR: "OPERATOR",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  COMMA: "COMMA"
});

/**
 * Tokenizes a mathematical formula string.
 * @param {string} input - Formula string (e.g., "sin(x) * 2x + 3^2")
 * @returns {Array<Object>} List of tokens
 */
export function tokenizeMath(input) {
  if (typeof input !== "string") {
    throw new TypeError("Formula expression must be a string");
  }

  const raw = input.trim();
  if (!raw) {
    throw new Error("Formula expression cannot be empty");
  }

  const tokens = [];
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const ch = raw[i];

    // Whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers (integers or floating point)
    if (/[0-9]/.test(ch) || (ch === "." && i + 1 < len && /[0-9]/.test(raw[i + 1]))) {
      let numStr = "";
      while (i < len && (/[0-9]/.test(raw[i]) || raw[i] === ".")) {
        if (raw[i] === "." && numStr.includes(".")) {
          throw new Error(`Invalid floating-point number at position ${i}`);
        }
        numStr += raw[i];
        i++;
      }
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: parseFloat(numStr) });
      continue;
    }

    // Identifiers: variables ('x'), constants ('pi', 'e'), or functions ('sin', 'sqrt')
    if (/[a-zA-Z_]/.test(ch)) {
      let id = "";
      while (i < len && /[a-zA-Z0-9_]/.test(raw[i])) {
        id += raw[i];
        i++;
      }
      const lower = id.toLowerCase();

      if (lower === "x") {
        tokens.push({ type: TOKEN_TYPES.VARIABLE, value: "x" });
      } else if (lower in CONSTANTS) {
        tokens.push({ type: TOKEN_TYPES.CONSTANT, value: CONSTANTS[lower], name: lower });
      } else if (lower in FUNCTIONS) {
        tokens.push({ type: TOKEN_TYPES.FUNCTION, value: FUNCTIONS[lower], name: lower });
      } else {
        throw new Error(`Unknown identifier '${id}' at position ${i - id.length}`);
      }
      continue;
    }

    // Operators and Parentheses
    if (ch === "+") {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: "+", precedence: 1, assoc: "L" });
      i++;
    } else if (ch === "-") {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: "-", precedence: 1, assoc: "L" });
      i++;
    } else if (ch === "*") {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: "*", precedence: 2, assoc: "L" });
      i++;
    } else if (ch === "/") {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: "/", precedence: 2, assoc: "L" });
      i++;
    } else if (ch === "%") {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: "%", precedence: 2, assoc: "L" });
      i++;
    } else if (ch === "^") {
      tokens.push({ type: TOKEN_TYPES.OPERATOR, value: "^", precedence: 3, assoc: "R" });
      i++;
    } else if (ch === "(") {
      tokens.push({ type: TOKEN_TYPES.LPAREN, value: "(" });
      i++;
    } else if (ch === ")") {
      tokens.push({ type: TOKEN_TYPES.RPAREN, value: ")" });
      i++;
    } else if (ch === ",") {
      tokens.push({ type: TOKEN_TYPES.COMMA, value: "," });
      i++;
    } else {
      throw new Error(`Unexpected character '${ch}' at position ${i}`);
    }
  }

  // Insert implicit multiplication tokens (e.g. 2x -> 2 * x, (x+1)(x-1) -> (x+1) * (x-1))
  return insertImplicitMultiplication(tokens);
}

/**
 * Detects adjacent tokens where multiplication is implied and injects a '*' operator.
 * @param {Array<Object>} tokens
 * @returns {Array<Object>}
 */
function insertImplicitMultiplication(tokens) {
  const result = [];
  const multToken = { type: TOKEN_TYPES.OPERATOR, value: "*", precedence: 2, assoc: "L" };

  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    result.push(curr);

    if (i + 1 < tokens.length) {
      const next = tokens[i + 1];

      const currCanEndVal =
        curr.type === TOKEN_TYPES.NUMBER ||
        curr.type === TOKEN_TYPES.VARIABLE ||
        curr.type === TOKEN_TYPES.CONSTANT ||
        curr.type === TOKEN_TYPES.RPAREN;

      const nextCanStartVal =
        next.type === TOKEN_TYPES.NUMBER ||
        next.type === TOKEN_TYPES.VARIABLE ||
        next.type === TOKEN_TYPES.CONSTANT ||
        next.type === TOKEN_TYPES.FUNCTION ||
        next.type === TOKEN_TYPES.LPAREN;

      if (currCanEndVal && nextCanStartVal) {
        result.push(multToken);
      }
    }
  }

  return result;
}

/**
 * Parses tokens into an Abstract Syntax Tree (AST) using Pratt / Precedence Climbing.
 * @param {Array<Object>} tokens
 * @returns {Object} Root AST node
 */
export function parseMathTokens(tokens) {
  let index = 0;

  function peek() {
    return tokens[index] || null;
  }

  function consume(expectedType, expectedVal) {
    const token = tokens[index];
    if (!token) {
      throw new Error(`Unexpected end of formula`);
    }
    if (expectedType && token.type !== expectedType) {
      throw new Error(`Expected token type ${expectedType}, found ${token.type}`);
    }
    if (expectedVal && token.value !== expectedVal) {
      throw new Error(`Expected '${expectedVal}', found '${token.value}'`);
    }
    index++;
    return token;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) {
      throw new Error("Unexpected end of expression");
    }

    // Unary plus
    if (token.type === TOKEN_TYPES.OPERATOR && token.value === "+") {
      consume();
      return parsePrimary();
    }

    // Unary minus
    if (token.type === TOKEN_TYPES.OPERATOR && token.value === "-") {
      consume();
      const expr = parseExpression(3); // high precedence for unary
      return { type: "UNARY_NEGATION", argument: expr };
    }

    // Numbers
    if (token.type === TOKEN_TYPES.NUMBER) {
      consume();
      return { type: "NUMBER", value: token.value };
    }

    // Constants
    if (token.type === TOKEN_TYPES.CONSTANT) {
      consume();
      return { type: "CONSTANT", value: token.value, name: token.name };
    }

    // Variable 'x'
    if (token.type === TOKEN_TYPES.VARIABLE) {
      consume();
      return { type: "VARIABLE", name: "x" };
    }

    // Function call: func(arg1, arg2, ...)
    if (token.type === TOKEN_TYPES.FUNCTION) {
      const fnToken = consume();
      consume(TOKEN_TYPES.LPAREN, "(");
      const args = [];
      if (peek() && peek().type !== TOKEN_TYPES.RPAREN) {
        args.push(parseExpression(0));
        while (peek() && peek().type === TOKEN_TYPES.COMMA) {
          consume(TOKEN_TYPES.COMMA, ",");
          args.push(parseExpression(0));
        }
      }
      consume(TOKEN_TYPES.RPAREN, ")");
      return { type: "FUNCTION_CALL", name: fnToken.name, fn: fnToken.value, args };
    }

    // Parenthesized expression: (expr)
    if (token.type === TOKEN_TYPES.LPAREN) {
      consume(TOKEN_TYPES.LPAREN, "(");
      const expr = parseExpression(0);
      consume(TOKEN_TYPES.RPAREN, ")");
      return expr;
    }

    throw new Error(`Unexpected token '${token.value || token.type}'`);
  }

  function parseExpression(minPrecedence) {
    let left = parsePrimary();

    while (index < tokens.length) {
      const token = peek();
      if (!token || token.type !== TOKEN_TYPES.OPERATOR) {
        break;
      }

      const precedence = token.precedence;
      if (precedence < minPrecedence) {
        break;
      }

      consume();
      const nextMinPrecedence = token.assoc === "L" ? precedence + 1 : precedence;
      const right = parseExpression(nextMinPrecedence);

      left = {
        type: "BINARY_OP",
        operator: token.value,
        left,
        right
      };
    }

    return left;
  }

  const ast = parseExpression(0);
  if (index < tokens.length) {
    throw new Error(`Unexpected extra tokens after expression: '${tokens[index].value}'`);
  }
  return ast;
}

/**
 * Evaluates an AST for a given variable value `x`.
 * @param {Object} node - AST node
 * @param {number} xVal - Value of x
 * @returns {number|null} Evaluated result or null if invalid/singularity
 */
export function evaluateAst(node, xVal) {
  if (!node) return null;

  switch (node.type) {
    case "NUMBER":
    case "CONSTANT":
      return node.value;

    case "VARIABLE":
      return xVal;

    case "UNARY_NEGATION": {
      const val = evaluateAst(node.argument, xVal);
      return (val === null || isNaN(val)) ? null : -val;
    }

    case "FUNCTION_CALL": {
      const evaluatedArgs = [];
      for (const arg of node.args) {
        const res = evaluateAst(arg, xVal);
        if (res === null || isNaN(res)) return null;
        evaluatedArgs.push(res);
      }
      try {
        const result = node.fn(...evaluatedArgs);
        if (!isFinite(result) || isNaN(result)) return null;
        return result;
      } catch {
        return null;
      }
    }

    case "BINARY_OP": {
      const left = evaluateAst(node.left, xVal);
      const right = evaluateAst(node.right, xVal);
      if (left === null || right === null || isNaN(left) || isNaN(right)) {
        return null;
      }

      let res;
      switch (node.operator) {
        case "+":
          res = left + right;
          break;
        case "-":
          res = left - right;
          break;
        case "*":
          res = left * right;
          break;
        case "/":
          if (Math.abs(right) < 1e-15) return null; // Avoid division by zero singularity
          res = left / right;
          break;
        case "%":
          if (Math.abs(right) < 1e-15) return null;
          res = left % right;
          break;
        case "^":
          res = Math.pow(left, right);
          break;
        default:
          return null;
      }

      return (!isFinite(res) || isNaN(res)) ? null : res;
    }

    default:
      return null;
  }
}

/**
 * Compiles a mathematical formula string into a fast evaluate(x) function.
 * @param {string} formulaStr
 * @returns {{ evaluate: (x: number) => number|null, ast: Object, error: string|null }}
 */
export function compileMathExpression(formulaStr) {
  try {
    const tokens = tokenizeMath(formulaStr);
    const ast = parseMathTokens(tokens);
    return {
      ast,
      error: null,
      evaluate: (x) => evaluateAst(ast, x)
    };
  } catch (err) {
    return {
      ast: null,
      error: err.message,
      evaluate: () => null
    };
  }
}

/**
 * Evaluates a formula string directly for a given x.
 * @param {string} formulaStr
 * @param {number} x
 * @returns {number|null}
 */
export function evaluateMathExpression(formulaStr, x) {
  const compiled = compileMathExpression(formulaStr);
  if (compiled.error) return null;
  return compiled.evaluate(x);
}
