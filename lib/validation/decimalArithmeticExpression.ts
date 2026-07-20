import { normalizeDecimalField } from "@/lib/validation/fieldValidations";

export type DecimalArithmeticExpressionResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: string;
    };

const allowedExpressionPattern = /^[\d\s.,+\-*/()]+$/;

class DecimalArithmeticExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecimalArithmeticExpressionError";
  }
}

class DecimalArithmeticExpressionParser {
  private readonly expression: string;
  private index = 0;

  constructor(expression: string) {
    this.expression = expression.replace(/\s+/g, "");
  }

  parse() {
    if (!this.expression) {
      throw new DecimalArithmeticExpressionError("El importe es obligatorio.");
    }

    const value = this.parseExpression();

    if (this.index < this.expression.length) {
      throw new DecimalArithmeticExpressionError(
        "La expresion del importe no es valida."
      );
    }

    return value;
  }

  private parseExpression() {
    let value = this.parseTerm();

    while (this.match("+") || this.match("-")) {
      const operator = this.previous();
      const rightValue = this.parseTerm();

      value = operator === "+" ? value + rightValue : value - rightValue;
    }

    return value;
  }

  private parseTerm() {
    let value = this.parseFactor();

    while (this.match("*") || this.match("/")) {
      const operator = this.previous();
      const rightValue = this.parseFactor();

      if (operator === "*") {
        value *= rightValue;
        continue;
      }

      if (rightValue === 0) {
        throw new DecimalArithmeticExpressionError(
          "No se puede dividir entre cero."
        );
      }

      value /= rightValue;
    }

    return value;
  }

  private parseFactor(): number {
    if (this.match("+")) {
      return this.parseFactor();
    }

    if (this.match("-")) {
      return -this.parseFactor();
    }

    if (this.match("(")) {
      const value = this.parseExpression();

      if (!this.match(")")) {
        throw new DecimalArithmeticExpressionError(
          "Falta cerrar un parentesis en el importe."
        );
      }

      return value;
    }

    return this.parseNumber();
  }

  private parseNumber() {
    const startIndex = this.index;

    while (this.isNumberCharacter(this.peek())) {
      this.index += 1;
    }

    if (startIndex === this.index) {
      throw new DecimalArithmeticExpressionError(
        "La expresion del importe esta incompleta."
      );
    }

    const rawValue = this.expression.slice(startIndex, this.index);
    const normalizedValue = normalizeDecimalField(rawValue);

    if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
      throw new DecimalArithmeticExpressionError(
        "La expresion del importe no es valida."
      );
    }

    const value = Number(normalizedValue);

    if (!Number.isFinite(value)) {
      throw new DecimalArithmeticExpressionError(
        "La expresion del importe no es valida."
      );
    }

    return value;
  }

  private match(expectedCharacter: string) {
    if (this.peek() !== expectedCharacter) {
      return false;
    }

    this.index += 1;
    return true;
  }

  private previous() {
    return this.expression[this.index - 1];
  }

  private peek() {
    return this.expression[this.index] ?? "";
  }

  private isNumberCharacter(character: string) {
    return /[\d.,]/.test(character);
  }
}

function formatExpressionResult(value: number) {
  const normalizedValue = Object.is(value, -0) ? 0 : value;
  const roundedValue = Number(normalizedValue.toFixed(12));
  const formattedValue = roundedValue.toFixed(12).replace(/\.?0+$/, "");

  return formattedValue || "0";
}

export function hasDecimalArithmeticExpression(value: string) {
  const normalizedValue = String(value ?? "").trim();

  return /[()*/]/.test(normalizedValue) || /.+[+-].+/.test(normalizedValue);
}

export function evaluateDecimalArithmeticExpression(
  value: string
): DecimalArithmeticExpressionResult {
  const expression = String(value ?? "").trim();

  if (!expression) {
    return {
      ok: true,
      value: "",
    };
  }

  if (!allowedExpressionPattern.test(expression)) {
    return {
      ok: false,
      error:
        "El importe solo admite numeros, coma/punto decimal, +, -, *, / y parentesis.",
    };
  }

  try {
    const parser = new DecimalArithmeticExpressionParser(expression);
    const numericValue = parser.parse();

    if (!Number.isFinite(numericValue)) {
      return {
        ok: false,
        error: "La expresion del importe no es valida.",
      };
    }

    return {
      ok: true,
      value: formatExpressionResult(numericValue),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof DecimalArithmeticExpressionError
          ? error.message
          : "La expresion del importe no es valida.",
    };
  }
}
