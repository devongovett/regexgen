const {Alternation, CharClass, Concatenation, Repetition, Literal} = require('./ast');

/**
 * Implements Brzozowski's algebraic method to convert a DFA into a regular expression.
 * http://cs.stackexchange.com/questions/2016/how-to-convert-finite-automata-to-regular-expressions#2392
 *
 * @param {State} root - the initial state of the DFA
 * @return {RegExp} - the converted regular expression
 */
function toRegex(root) {
  let states = Array.from(root.visit());

  // Setup the system of equations A and B from Arden's Lemma.
  // A represents a state transition table for the given DFA.
  // B is a vector of accepting states in the DFA, marked as epsilons.
  let A = [];
  let B = [];

  for (let i = 0; i < states.length; i++) {
    let a = states[i];
    if (a.accepting) {
      B[i] = new Literal('');
    }

    A[i] = [];
    for (let [t, s] of a.transitions) {
      let j = states.indexOf(s);
      A[i][j] = A[i][j] ? union(A[i][j], new Literal(t)) : new Literal(t);
    }
  }

  // Solve the of equations
  for (let n = states.length - 1; n >= 0; n--) {
    if (A[n][n] != null) {
      B[n] = concat(star(A[n][n]), B[n]);
      for (let j = 0; j < n; j++) {
        A[n][j] = concat(star(A[n][n]), A[n][j]);
      }
    }

    for (let i = 0; i < n; i++) {
      if (A[i][n] != null) {
        B[i] = union(B[i], concat(A[i][n], B[n]));
        for (let j = 0; j < n; j++) {
          A[i][j] = union(A[i][j], concat(A[i][n], A[n][j]));
        }
      }
    }
  }

  return new RegExp(B[0]);
}

/**
 * Creates a repetition if `exp` exists.
 */
function star(exp) {
  return exp ? new Repetition(exp, '*') : null;
}

/**
 * Creates a union between two expressions
 */
function union(a, b) {
  if (a != null && b != null && a !== b) {
    // Hoist common substrings at the start and end of the options
    let start = removeCommonSubstring(a, b, 'start');
    let end = removeCommonSubstring(a, b, 'end');
    let res;

    a = a.simplify ? a.simplify() : a;
    b = b.simplify ? b.simplify() : b;

    // If a or b is empty, make an optional group instead
    if (a.isEmpty || b.isEmpty) {
      res = new Repetition(a.isEmpty ? b : a, '?');
    } else {
      // Check if we can make a character class instead of an alternation
      let ac = a.getCharClass && a.getCharClass();
      let bc = b.getCharClass && b.getCharClass();
      if (ac && bc) {
        res = new CharClass(ac, bc);
      } else {
        res = new Alternation(a, b);
      }
    }

    if (start) {
      res = new Concatenation(new Literal(start), res);
    }

    if (end) {
      res = new Concatenation(res, new Literal(end));
    }

    return res;
  }

  return a || b;
}

/**
 * Removes the common prefix or suffix from the two expressions
 */
function removeCommonSubstring(a, b, side) {
  a = a.getLiteral && a.getLiteral(side);
  b = b.getLiteral && b.getLiteral(side);
  if (!a || !b) return null;

  let s = commonSubstring(a.value, b.value, side);

  if (side === 'start') {
    a.value = a.value.slice(s.length);
    b.value = b.value.slice(s.length);
  } else {
    a.value = a.value.slice(0, a.value.length - s.length);
    b.value = b.value.slice(0, b.value.length - s.length);
  }

  return s;
}

/**
 * Finds the common prefix or suffix between to strings
 */
function commonSubstring(a, b, side) {
  let dir = side === 'start' ? 1 : -1;
  a = Array.from(a);
  b = Array.from(b);
  let ai = dir === 1 ? 0 : a.length - 1;
  let ae = dir === 1 ? a.length : -1;
  let bi = dir === 1 ? 0 : b.length - 1;
  let be = dir === 1 ? b.length : -1;
  let res = '';

  for (; ai !== ae && bi !== be && a[ai] === b[bi]; ai += dir, bi += dir) {
    if (dir === 1) {
      res += a[ai];
    } else {
      res = a[ai] + res;
    }
  }

  return res;
}

/**
 * Creates a concatenation between expressions a and b
 */
function concat(a, b) {
  if (a == null || b == null) {
    return null;
  }

  if (a.isEmpty) {
    return b;
  }

  if (b.isEmpty) {
    return a;
  }

  // Combine literals
  if (a instanceof Literal && b instanceof Literal) {
    return new Literal(a.value + b.value);
  }

  if (a instanceof Literal && b instanceof Concatenation && b.a instanceof Literal) {
    return new Concatenation(new Literal(a.value + b.a.value), b.b);
  }

  if (b instanceof Literal && a instanceof Concatenation && a.b instanceof Literal) {
    return new Concatenation(a.a, new Literal(a.b.value + b.value));
  }

  return new Concatenation(a, b);
}

module.exports = toRegex;
