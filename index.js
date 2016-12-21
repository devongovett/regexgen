const Trie = require('./src/trie');

/**
 * Generates a regular expression that matches the given input strings.
 * @param {Array<string>} inputs
 * @return {RegExp}
 */
function regexgen(inputs) {
  let trie = new Trie;
  for (let input of inputs) {
    trie.add(input);
  }

  return trie.toRegExp();
}

regexgen.Trie = Trie;
module.exports = regexgen;
