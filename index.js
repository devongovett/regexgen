'use strict';

const Trie = require('./src/trie');

/**
 * Generates a regular expression that matches the given input strings.
 * @param {Array<string>} inputs
 * @param {string} flags
 * @return {RegExp}
 */
function regexgen(inputs, flags) {
  let trie = new Trie;
  for (let input of inputs) {
    trie.add(input);
  }

  return trie.toRegExp(flags);
}

regexgen.Trie = Trie;
module.exports = regexgen;
