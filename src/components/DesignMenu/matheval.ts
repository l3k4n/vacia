/** evalutes a string as a math expression and returns result or null if string
 * is invalid */
export function evalMathExpr(expr: string) {
  if (!expr.length) return null;
  if (Number.isFinite(+expr)) return +expr;

  const tokens = expr
    .replaceAll(" ", "")
    .match(/^([-+]?\d+(?:\.\d+)?)([+\-/*])([-+]?\d+(?:\.\d+)?)$/);

  if (!tokens) return null;

  const [_, num1, operator, num2] = tokens;
  let result = 0;

  if (operator === "+") result = +num1 + +num2;
  else if (operator === "-") result = +num1 - +num2;
  else if (operator === "*") result = +num1 * +num2;
  else if (operator === "/") result = +num1 / +num2;

  return Number.isFinite(result) ? result : 0;
}
