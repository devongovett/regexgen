const assert = require('assert');
const regexgen = require('../');

describe('regexgen', function () {
  it('should generate a char class', function () {
    assert.deepEqual(regexgen(['a', 'b', 'c']), /[a-c]/);
  });

  it('should generate an alternation', function () {
    assert.deepEqual(regexgen(['abc', '123']), /123|abc/);
  });

  it('should extract common prefixes at the start', function () {
    assert.deepEqual(regexgen(['foobar', 'foozap']), /foo(?:zap|bar)/);
  });

  it('should extract common prefixes at the end', function () {
    assert.deepEqual(regexgen(['barfoo', 'zapfoo']), /(?:zap|bar)foo/);
  });

  it('should extract common prefixes at the start and end', function () {
    assert.deepEqual(regexgen(['foobarfoo', 'foozapfoo']), /foo(?:zap|bar)foo/);
  });

  it('should generate an optional group', function () {
    assert.deepEqual(regexgen(['foo', 'foobar']), /foo(?:bar)?/);
  });

  it('should generate multiple optional groups', function () {
    assert.deepEqual(regexgen(['f', 'fo', 'fox']), /f(?:ox?)?/);
  });

  it('should escape meta characters', function () {
    assert.deepEqual(regexgen(['foo|bar[test]+']), /foo\|bar\[test\]\+/);
    assert.deepEqual(regexgen(['u{}\\iu']), /u\{\}\\iu/);
  });

  it('should escape non-ascii characters', function () {
    assert.deepEqual(regexgen(['🎉']), /\uD83C\uDF89/);
  });

  it('should support regex flags', function () {
    assert.deepEqual(regexgen(['a', 'b', 'c'], 'g'), /[a-c]/g);
  });

  it('should support using the Trie class directly', function () {
    let t = new regexgen.Trie;
    t.add('foobar');
    t.add('foobaz');

    assert.deepEqual(t.toString(), 'fooba[rz]');
    assert.deepEqual(t.toRegExp(), /fooba[rz]/);

    let t2 = new regexgen.Trie;
    t2.addAll(['foobar', 'foobaz']);

    assert.deepEqual(t2.toString(), 'fooba[rz]');
    assert.deepEqual(t2.toRegExp(), /fooba[rz]/);
  });

  it('should work with optional groups', function () {
    assert.deepEqual(regexgen(['a', 'abc']), /a(?:bc)?/);
  });

  it('should wrap optional character classes in parens if they contain non-BMP codepoints', function () {
    assert.deepEqual(regexgen(['\u261D', '\u261D\u{1f3fb}', '\u261D\u{1f3fc}']), /\u261D(?:\uD83C[\uDFFB\uDFFC])?/);
  });

  it('should wrap optional literals in parens if they contain more than one code unit', function () {
    assert.deepEqual(regexgen(['\u261D', '\u261D\u{1f3fb}']), /\u261D(?:\uD83C\uDFFB)?/);
  });

  it('should retain non-BMP codepoints when the Unicode flag is passed', function () {
    assert.deepEqual(regexgen(['\u261D', '\u261D\u{1f3fb}'], 'u'), /\u261D\u{1F3FB}?/u);
    assert.deepEqual(
      regexgen(['\u{1F3F4}', '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}', '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}', '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}'], 'u'),
      /\u{1F3F4}(?:\u{E0067}\u{E0062}(?:\u{E0073}\u{E0063}\u{E0074}|\u{E0077}\u{E006C}\u{E0073}|\u{E0065}\u{E006E}\u{E0067}))?/u
    );
  });

  it('should handle non-BMP codepoint ranges correctly', function() {
    assert.deepEqual(
      regexgen(['\u{1F311}', '\u{1F312}', '\u{1F313}', '\u{1F314}', '\u{1F315}', '\u{1F316}', '\u{1F317}', '\u{1F318}'], 'u'),
      /[\u{1F311}-\u{1F318}]/u
    );
  });

  it('should correctly extract common prefix from multiple alternations', function () {
    assert.deepEqual(regexgen(['abjv', 'abxcjv', 'abydjv', 'abzejv']), /ab(?:ze|yd|xc)?jv/);
  });

  it('should sort alternation options correctly (#10)', function () {
    let s = '\uD83C\uDFCA\uD83C\uDFFD\u200D\u2640\uFE0F';
    let r = regexgen([
      '\uD83C\uDDF7\uD83C\uDDFC',
      '\uD83C\uDDF8\uD83C\uDDE6',
      '\uD83C\uDFCA\uD83C\uDFFD',
      s
    ]);

    assert.deepEqual(s.match(r)[0], s);
  });

  it('should sort non-BMP alternation options correctly', function () {
    let r = regexgen(
      [
        // shrug emoji
        '\u{1F937}\u200D',
        // shrug emoji with fitzpatrick modifiers
        '\u{1F937}\u{1F3FB}\u200D',
        '\u{1F937}\u{1F3FC}\u200D',
        '\u{1F937}\u{1F3FD}\u200D',
        '\u{1F937}\u{1F3FE}\u200D',
        '\u{1F937}\u{1F3FF}\u200D',
        // shrug emoji with gender modifier
        '\u{1F937}\u200D\u2640\uFE0F',
        // shrug emoji with gender and fitzpatrick modifiers
        '\u{1F937}\u{1F3FB}\u200D\u2640\uFE0F',
        '\u{1F937}\u{1F3FC}\u200D\u2640\uFE0F',
        '\u{1F937}\u{1F3FD}\u200D\u2640\uFE0F',
        '\u{1F937}\u{1F3FE}\u200D\u2640\uFE0F',
        '\u{1F937}\u{1F3FF}\u200D\u2640\uFE0F'
      ],
      'u'
    );

    assert.deepEqual(r, /\u{1F937}[\u{1F3FB}-\u{1F3FF}]?\u200D(?:\u2640\uFE0F)?/u);
    assert.deepEqual('\u{1F937}\u{1F3FB}\u200D\u2640\uFE0F'.match(r)[0], '\u{1F937}\u{1F3FB}\u200D\u2640\uFE0F');
  });

  it('should sort alternations of alternations correctly', function () {
    let r = regexgen(['aef', 'aghz', 'ayz', 'abcdz', 'abcd']);
    let s = 'abcdz';

    assert.deepEqual(s.match(r)[0], s);
    assert.deepEqual(r, /a(?:(?:bcd|gh|y)z|bcd|ef)/);
  });
});
