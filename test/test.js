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
  });
});
