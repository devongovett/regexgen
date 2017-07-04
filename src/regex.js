const {Alternation, CharClass, Concatenation, Repetition, Literal} = require('./ast');

/**
 * Implements Brzozowski's algebraic method to convert a DFA into a regular
 * expression pattern.
 * http://cs.stackexchange.com/questions/2016/how-to-convert-finite-automata-to-regular-expressions#2392
 *
 * @param {State} root - the initial state of the DFA
 * @param {string} flags - The flags to add to the regex.
 * @return {String} - the converted regular expression pattern
 */
function toRegex(root, flags) {
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

  return B[0].toString(flags);
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
    let start, end, res;
    [a, b, start] = removeCommonSubstring(a, b, 'start');
    [a, b, end] = removeCommonSubstring(a, b, 'end');

    // If a or b is empty, make an optional group instead
    if (a.isEmpty || b.isEmpty) {
      res = new Repetition(a.isEmpty ? b : a, '?');
    } else if (a instanceof Repetition && a.type === '?') {
      res = new Repetition(new Alternation(a.expr, b), '?');
    } else if (b instanceof Repetition && b.type === '?') {
      res = new Repetition(new Alternation(a, b.expr), '?');
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
  let al = a.getLiteral && a.getLiteral(side);
  let bl = b.getLiteral && b.getLiteral(side);
  if (!al || !bl) {
    return [a, b, null];
  }

  let s = commonSubstring(al, bl, side);
  if (!s) {
    return [a, b, ''];
  }

  a = a.removeSubstring(side, s.length);
  b = b.removeSubstring(side, s.length);

  return [a, b, s];
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
