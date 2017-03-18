const jsesc = require('jsesc');
const regenerate = require('regenerate');

/**
 * Represents an alternation (e.g. `foo|bar`)
 */
class Alternation {
  constructor(...options) {
    this.precedence = 1;
    this.options = this.flatten(options);
    this.options.sort((a, b) => b.length - a.length);
  }

  flatten(options) {
    return options.reduce((res, option) => res.concat(
      option instanceof Alternation ? this.flatten(option.options) : option
    ), []);
  }

  toString() {
    return this.options.map(o => parens(o, this)).join('|');
  }
}

/**
 * Represents a character class (e.g. [0-9a-z])
 */
class CharClass {
  constructor(a, b) {
    this.precedence = 1;
    this.set = regenerate(a, b);
  }

  get length() {
    return 1;
  }

  toString() {
    return this.set.toString();
  }

  getCharClass() {
    return this.set;
  }

  get isSingleCharacter() {
    return !this.set.toArray().some(c => c > 0xffff);
  }
}

/**
 * Represents a concatenation (e.g. `foo`)
 */
class Concatenation {
  constructor(a, b) {
    this.precedence = 2;
    this.a = a;
    this.b = b;
  }

  get length() {
    return this.a.length + this.b.length;
  }

  toString() {
    return parens(this.a, this) + parens(this.b, this);
  }

  getLiteral(side) {
    if (side === 'start' && this.a.getLiteral) {
      return this.a.getLiteral(side);
    }

    if (side === 'end' && this.b.getLiteral) {
      return this.b.getLiteral(side);
    }
  }

  removeSubstring(side, len) {
    let {a, b} = this;
    if (side === 'start' && a.removeSubstring) {
      a = a.removeSubstring(side, len);
    }

    if (side === 'end' && b.removeSubstring) {
      b = b.removeSubstring(side, len);
    }

    return a.isEmpty ? b : b.isEmpty ? a : new Concatenation(a, b);
  }
}

/**
 * Represents a repetition (e.g. `a*` or `a?`)
 */
class Repetition {
  constructor(expr, type) {
    this.precedence = 3;
    this.expr = expr;
    this.type = type;
  }

  get length() {
    return this.expr.length;
  }

  toString() {
    return parens(this.expr, this) + this.type;
  }
}

/**
 * Represents a literal (e.g. a string)
 */
class Literal {
  constructor(value) {
    this.precedence = 2;
    this.value = value;
  }

  get isEmpty() {
    return !this.value;
  }

  get isSingleCharacter() {
    return this.length === 1;
  }

  get length() {
    return this.value.length;
  }

  toString() {
    return jsesc(this.value).replace(/([\t\n\f\r\$\(\)\*\+\-\.\?\[\]\^\{\|\}])/g, '\\$1');
  }

  getCharClass() {
    if (Array.from(this.value).length === 1) {
      return this.value;
    }
  }

  getLiteral() {
    return this.value;
  }

  removeSubstring(side, len) {
    if (side === 'start') {
      return new Literal(this.value.slice(len));
    }

    if (side === 'end') {
      return new Literal(this.value.slice(0, this.value.length - len));
    }
  }
}

function parens(exp, parent) {
  let str = exp.toString();
  if (exp.precedence < parent.precedence && !exp.isSingleCharacter) {
    return '(?:' + str + ')';
  }

  return str;
}

exports.Alternation = Alternation;
exports.CharClass = CharClass;
exports.Concatenation = Concatenation;
exports.Repetition = Repetition;
exports.Literal = Literal;
