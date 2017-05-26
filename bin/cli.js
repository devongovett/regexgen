#!/usr/bin/env node

const Trie = require('../src/trie');

let args = process.argv.slice(2);
let flags = '';
if (args.length && args[0][0] === '-') {
  flags = args.shift().slice(1);
}

if (args.length === 0) {
  console.log('Usage: regexgen [-gimuy] string1 string2 string3...');
  process.exit(1);
}

let trie = new Trie;
trie.addAll(args);

console.log(new RegExp(trie.toString(), flags));
