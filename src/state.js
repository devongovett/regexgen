/**
 * Represents a state in a DFA.
 */
class State {
  constructor() {
    this.accepting = false;
    this.transitions = Object.create(null);
  }

  /**
   * A generator that yields all states in the subtree
   * starting with this state.
   */
  *visit(visited = new Set) {
    if (visited.has(this)) return;
    visited.add(this);

    yield this;
    for (let symbol in this.transitions) {
      yield* this.transitions[symbol].visit(visited);
    }
  }
}

module.exports = State;
