const Map = require('./map');

/**
 * Represents a state in a DFA.
 */
class State {
  constructor() {
    this.accepting = false;
    this.transitions = new Map(k => new State);
  }

  /**
   * A generator that yields all states in the subtree
   * starting with this state.
   */
  *visit(visited = new Set) {
    if (visited.has(this)) return;
    visited.add(this);

    yield this;
    for (let state of this.transitions.values()) {
      yield* state.visit(visited);
    }
  }
}

module.exports = State;
