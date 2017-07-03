#!/usr/bin/env node

const regexgen = require('../');

let args = process.argv.slice(2);
let flags = '';
if (args.length && args[0][0] === '-') {
  flags = args.shift().slice(1);
}

if (args.length === 0) {
  console.log('Usage: regexgen [-gimuy] string1 string2 string3...');
  process.exit(1);
}

console.log(regexgen(args, flags));
