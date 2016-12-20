const Set = require('./set');
const State = require('./state');

/**
 * Implements Hopcroft's algorithm to minimize a DFA.
 * https://en.wikipedia.org/wiki/DFA_minimization#Hopcroft.27s_algorithm
 *
 * @param {State} root - the initial state of the DFA
 * @param {Set} alphabet - the DFA's alphabet
 * @return {State} - the new initial state
 */
function minimize(root, alphabet) {
  let states = new Set;
  let finalStates = new Set;

  for (let state of root.visit()) {
    states.add(state);
    if (state.accepting) {
      finalStates.add(state);
    }
  }

  // Create a map of incoming transitions to each state.
  let transitions = new DefaultMap(k => new DefaultMap(k => new Set));
  for (let s of states) {
    for (let t in s.transitions) {
      transitions.get(s.transitions[t]).get(t).add(s);
    }
  }

  let P = new Set([finalStates, states.difference(finalStates)]);
  let W = new Set([finalStates]);

  while (W.size > 0) {
    let A = W.shift();

    // Collect states that have transitions leading to states in A, grouped by character.
    let t = new DefaultMap(k => new Set);
    for (let s of A) {
      for (let [T, X] of transitions.get(s)) {
        t.get(T).addAll(X);
      }
    }

    for (let X of t.values()) {
      for (let Y of P) {
        let i = X.intersection(Y);
        let d = Y.difference(X);

        if (i.size > 0 && d.size > 0) {
          P.replace(Y, i, d);

          let y = W.find(v => v.equals(Y));
          if (y) {
            W.replace(y, i, d);
          } else {
            if (i.size <= d.size) {
              W.add(i);
            } else {
              W.add(d);
            }
          }
        }
      }
    }
  }

  let newStates = new Map;
  for (let S of P) {
    newStates.set(S, new State);
  }

  let initial = null;
  for (let S of P) {
    let first = S.first();
    let s = newStates.get(S);
    for (let c in first.transitions) {
      let old = first.transitions[c];
      s.transitions[c] = newStates.get(P.find(v => v.has(old)));
    }

    s.accepting = first.accepting;

    if (S.has(root)) {
      initial = s;
    }
  }

  return initial;
}

class DefaultMap extends Map {
  constructor(defaultGetter) {
    super();
    this.defaultGetter = defaultGetter;
  }

  get(key) {
    if (!super.has(key)) {
      let res = this.defaultGetter(key);
      this.set(key, res);
      return res;
    }

    return super.get(key);
  }
}

module.exports = minimize;
