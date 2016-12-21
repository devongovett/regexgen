const State = require('./state');
const minimize = require('./minimize');
const toRegExp = require('./regex');

/**
 * A Trie represents a set of strings in a tree data structure
 * where each edge represents a single character.
 * https://en.wikipedia.org/wiki/Trie
 */
class Trie {
  constructor() {
    this.alphabet = new Set;
    this.root = new State;
  }

  /**
   * Adds the given string to the trie.
   * @param {string} string - the string to add
   */
  add(string) {
    let node = this.root;
    for (let char of string) {
      this.alphabet.add(char);
      node = node.transitions.get(char);
    }

    node.accepting = true;
  }

  /**
   * Returns a minimal DFA representing the strings in the trie.
   * @return {State} - the starting state of the minimal DFA
   */
  minimize() {
    return minimize(this.root, this.alphabet);
  }

  /**
   * Returns a regex that matches the strings in the trie.
   * @return {RegExp}
   */
  toRegExp() {
    return toRegExp(this.minimize());
  }
}

module.exports = Trie;
