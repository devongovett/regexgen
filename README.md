# regexgen

Generates regular expressions that match a set of strings.

## Installation

`regexgen` can be installed using [npm](https://npmjs.com):

```
npm install regexgen
```

## Example

The simplest use is to simply pass an array of strings to `regexgen`:

```javascript
const regexgen = require('regexgen');

regexgen(['foobar', 'foobaz', 'foozap', 'fooza']); // => /foo(?:zap?|ba[rz])/
```

You can also use the `Trie` class directly:

```javascript
const {Trie} = require('regexgen');

let t = new Trie;
t.add('foobar');
t.add('foobaz');

t.toRegExp(); // => /fooba[rz]/
```

## CLI

`regexgen` also has a simple CLI to generate regexes using inputs from the command line.

```shell
$ regexgen
Usage: regexgen [-gimuy] string1 string2 string3...
```

The optional first parameter is the [flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) to add
to the regex (e.g. `-i` for a case insensitive match).

## ES2015 and Unicode

By default `regexgen` will output a standard JavaScript regular expression, with Unicode codepoints converted into UCS-2 surrogate pairs.

If desired, you can request an ES2015-compatible Unicode regular expression by supplying the `-u` flag, which results in those codepoints being retained.

```shell
$ regexgen 👩 👩‍💻 👩🏻‍💻 👩🏼‍💻 👩🏽‍💻 👩🏾‍💻 👩🏿‍💻
/\uD83D\uDC69(?:(?:\uD83C[\uDFFB-\uDFFF])?\u200D\uD83D\uDCBB)?/

$ regexgen -u 👩 👩‍💻 👩🏻‍💻 👩🏼‍💻 👩🏽‍💻 👩🏾‍💻 👩🏿‍💻
/\u{1F469}(?:[\u{1F3FB}-\u{1F3FF}]?\u200D\u{1F4BB})?/u
```


Such regular expressions are compatible with current versions of Node, as well as the latest browsers, and may be more transferrable to other languages.

## How does it work?

1. Generate a [Trie](https://en.wikipedia.org/wiki/Trie) containing all of the input strings.
   This is a tree structure where each edge represents a single character. This removes
   redundancies at the start of the strings, but common branches further down are not merged.

2. A trie can be seen as a tree-shaped deterministic finite automaton (DFA), so DFA algorithms
   can be applied. In this case, we apply [Hopcroft's DFA minimization algorithm](https://en.wikipedia.org/wiki/DFA_minimization#Hopcroft.27s_algorithm)
   to merge the nondistinguishable states.

3. Convert the resulting minimized DFA to a regular expression. This is done using
   [Brzozowski's algebraic method](http://cs.stackexchange.com/questions/2016/how-to-convert-finite-automata-to-regular-expressions#2392),
   which is quite elegant. It expresses the DFA as a system of equations which can be solved
   for a resulting regex. Along the way, some additional optimizations are made, such
   as hoisting common substrings out of an alternation, and using character class ranges.
   This produces an an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
   (AST) for the regex, which is then converted to a string and compiled to a JavaScript
   `RegExp` object.

## License

MIT
