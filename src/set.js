/**
 * This class extends the native ES6 Set class with some additional methods
 */
class ExtendedSet extends Set {
  filter(fn) {
    let res = new ExtendedSet;
    for (let x of this) {
      if (fn(x)) {
        res.add(x);
      }
    }

    return res;
  }

  difference(b) {
    return this.filter(x => !b.has(x));
  }

  intersection(b) {
    return this.filter(x => b.has(x));
  }

  equals(b) {
    if (this.size !== b.size) {
      return false;
    }

    for (let x of this) {
      if (!b.has(x)) {
        return false;
      }
    }

    return true;
  }

  find(fn) {
    for (let x of this) {
      if (fn(x)) {
        return x;
      }
    }

    return null;
  }

  first() {
    return this.values().next().value;
  }

  shift() {
    let v = this.first();
    this.delete(v);
    return v;
  }

  replace(search, ...replacements) {
    if (this.delete(search)) {
      this.addAll(replacements);
    }
  }

  addAll(items) {
    for (let x of items) {
      this.add(x);
    }
  }
}

module.exports = ExtendedSet;
