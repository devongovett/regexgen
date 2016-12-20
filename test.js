const Trie = require('./src/trie');

// ['7\uFE0F\u20E3', '7\u200D\uFE0F\u200D\u20E3', '7\u20E3', '7\u200D\u20E3']
// ['0\u20E3', '1\u20E3', '2\u20E3', '3\u20E3','4\u20E3','5\u20E3']

let t = new Trie;
for (let i of ['0\u20E3', '1\u20E3', '2\u20E3', '3\u20E3','4\u20E3','5\u20E3', '6\u20E3', '7\u20E3','8\u20E3','9\u20E3','*\u20E3', '#\u20E3']) {
  t.add(i);
}

console.log(t.toRegex());