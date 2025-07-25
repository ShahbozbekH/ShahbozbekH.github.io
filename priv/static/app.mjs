// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length3 = 0;
    while (current) {
      current = current.tail;
      length3++;
    }
    return length3 - 1;
  }
};
function prepend(element3, tail) {
  return new NonEmpty(element3, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index3) {
    if (index3 < 0 || index3 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index3);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a2 = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a2 !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a2 = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a2 >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index3) {
  if (bitOffset === 0) {
    return buffer[index3] ?? 0;
  } else {
    const a2 = buffer[index3] << bitOffset & 255;
    const b = buffer[index3 + 1] >> 8 - bitOffset;
    return a2 | b;
  }
}
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name, message) {
  if (isBitArrayDeprecationMessagePrinted[name]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name] = true;
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a2 = values2.pop();
    let b = values2.pop();
    if (a2 === b) continue;
    if (!isObject(a2) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a2);
    for (let k of keys2(a2)) {
      values2.push(get2(a2, k), get2(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return !(a2 instanceof BitArray) && a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c)) return false;
  return a2.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function compare(a2, b) {
  let $ = a2 === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = a2 < b;
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first.hasLength(0)) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first, second) {
  return append_loop(reverse(first), second);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4.hasLength(0)) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare4(prev, new$1);
      if ($ instanceof Gt && direction instanceof Descending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Lt && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Eq && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Gt && direction instanceof Ascending) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Lt && direction instanceof Descending) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22.hasLength(0)) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse(acc);
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse(prepend(reverse(sequence), acc));
    } else {
      let ascending1 = sequences2.head;
      let ascending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let descending = merge_ascendings(
        ascending1,
        ascending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(descending, acc);
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22.hasLength(0)) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse(acc);
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse(prepend(reverse(sequence), acc));
    } else {
      let descending1 = sequences2.head;
      let descending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let ascending = merge_descendings(
        descending1,
        descending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(ascending, acc);
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2.hasLength(0)) {
      return toList([]);
    } else if (sequences2.hasLength(1) && direction instanceof Ascending) {
      let sequence = sequences2.head;
      return sequence;
    } else if (sequences2.hasLength(1) && direction instanceof Descending) {
      let sequence = sequences2.head;
      return reverse(sequence);
    } else if (direction instanceof Ascending) {
      let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Descending();
      loop$compare = compare4;
    } else {
      let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Ascending();
      loop$compare = compare4;
    }
  }
}
function sort(list4, compare4) {
  if (list4.hasLength(0)) {
    return toList([]);
  } else if (list4.hasLength(1)) {
    let x = list4.head;
    return toList([x]);
  } else {
    let x = list4.head;
    let y = list4.tail.head;
    let rest$1 = list4.tail.tail;
    let _block;
    let $ = compare4(x, y);
    if ($ instanceof Lt) {
      _block = new Ascending();
    } else if ($ instanceof Eq) {
      _block = new Ascending();
    } else {
      _block = new Descending();
    }
    let direction = _block;
    let sequences$1 = sequences(
      rest$1,
      compare4,
      toList([x]),
      direction,
      y,
      toList([])
    );
    return merge_all(sequences$1, new Ascending(), compare4);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings.atLeastLength(1)) {
      let string5 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string5;
    } else {
      return accumulator;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map(_pipe$2, identity);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_ok(result) {
  if (!result.isOk()) {
    return false;
  } else {
    return true;
  }
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root3, shift, hash, key, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size2 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size2, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key) {
  const size2 = root3.array.length;
  for (let i = 0; i < size2; i++) {
    if (isEqual(key, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root3, key);
  }
}
function findArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root3, key);
  }
}
function withoutArray(root3, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key) {
  const idx = collisionIndexOf(root3, key);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
  const size2 = items.length;
  for (let i = 0; i < size2; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root3, size2) {
    this.root = root3;
    this.size = size2;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value) {
  if (/^[-+]?(\d+)$/.test(value)) {
    return new Ok(parseInt(value));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function graphemes(string5) {
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string5.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function new_map() {
  return Dict.new();
}
function map_to_list(map4) {
  return List.fromArray(map4.entries());
}
function map_get(map4, key) {
  const value = map4.get(key, NOT_FOUND);
  if (value === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value);
}
function map_insert(key, value, map4) {
  return map4.set(key, value);
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value) {
  return map_insert(key, value, dict2);
}
function from_list_loop(loop$list, loop$initial) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let key = list4.head[0];
      let value = list4.head[1];
      let rest = list4.tail;
      loop$list = rest;
      loop$initial = insert(initial, key, value);
    }
  }
}
function from_list(list4) {
  return from_list_loop(list4, new_map());
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first, accumulator);
    }
  }
}
function do_values_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let value = list4.head[1];
      let rest = list4.tail;
      loop$list = rest;
      loop$acc = prepend(value, acc);
    }
  }
}
function values(dict2) {
  let list_of_pairs = map_to_list(dict2);
  return do_values_loop(list_of_pairs, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment3) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment3;
  }
};
function remove_dot_segments_loop(loop$input, loop$accumulator) {
  while (true) {
    let input = loop$input;
    let accumulator = loop$accumulator;
    if (input.hasLength(0)) {
      return reverse(accumulator);
    } else {
      let segment = input.head;
      let rest = input.tail;
      let _block;
      if (segment === "") {
        let accumulator$12 = accumulator;
        _block = accumulator$12;
      } else if (segment === ".") {
        let accumulator$12 = accumulator;
        _block = accumulator$12;
      } else if (segment === ".." && accumulator.hasLength(0)) {
        _block = toList([]);
      } else if (segment === ".." && accumulator.atLeastLength(1)) {
        let accumulator$12 = accumulator.tail;
        _block = accumulator$12;
      } else {
        let segment$1 = segment;
        let accumulator$12 = accumulator;
        _block = prepend(segment$1, accumulator$12);
      }
      let accumulator$1 = _block;
      loop$input = rest;
      loop$accumulator = accumulator$1;
    }
  }
}
function remove_dot_segments(input) {
  return remove_dot_segments_loop(input, toList([]));
}
function path_segments(path) {
  return remove_dot_segments(split2(path, "/"));
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function map3(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$() {
  return new Set2(new_map());
}
function contains(set, member) {
  let _pipe = set.dict;
  let _pipe$1 = map_get(_pipe, member);
  return is_ok(_pipe$1);
}
var token = void 0;
function insert2(set, member) {
  return new Set2(insert(set.dict, member, token));
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var EMPTY_DICT = /* @__PURE__ */ Dict.new();
function empty_dict() {
  return EMPTY_DICT;
}
var EMPTY_SET = /* @__PURE__ */ new$();
function empty_set() {
  return EMPTY_SET;
}
var document2 = globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_FRAGMENT_NODE = 11;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare3(a2, b) {
  if (a2.name === b.name) {
    return EQ;
  } else if (a2.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
};
var Property = class extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name, handler, include, prevent_default, stop_propagation, immediate2, limit) {
    super();
    this.kind = kind;
    this.name = name;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate2;
    this.limit = limit;
  }
};
var NoLimit = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
};
var Debounce = class extends CustomType {
  constructor(kind, delay) {
    super();
    this.kind = kind;
    this.delay = delay;
  }
};
var Throttle = class extends CustomType {
  constructor(kind, delay) {
    super();
    this.kind = kind;
    this.delay = delay;
  }
};
function limit_equals(a2, b) {
  if (a2 instanceof NoLimit && b instanceof NoLimit) {
    return true;
  } else if (a2 instanceof Debounce && b instanceof Debounce && a2.delay === b.delay) {
    let d1 = a2.delay;
    let d2 = b.delay;
    return true;
  } else if (a2 instanceof Throttle && b instanceof Throttle && a2.delay === b.delay) {
    let d1 = a2.delay;
    let d2 = b.delay;
    return true;
  } else {
    return false;
  }
}
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes.hasLength(0)) {
      return merged;
    } else if (attributes.atLeastLength(2) && attributes.head instanceof Attribute && attributes.head.name === "class" && attributes.tail.head instanceof Attribute && attributes.tail.head.name === "class") {
      let kind = attributes.head.kind;
      let class1 = attributes.head.value;
      let class2 = attributes.tail.head.value;
      let rest = attributes.tail.tail;
      let value = class1 + " " + class2;
      let attribute$1 = new Attribute(kind, "class", value);
      loop$attributes = prepend(attribute$1, rest);
      loop$merged = merged;
    } else if (attributes.atLeastLength(2) && attributes.head instanceof Attribute && attributes.head.name === "style" && attributes.tail.head instanceof Attribute && attributes.tail.head.name === "style") {
      let kind = attributes.head.kind;
      let style1 = attributes.head.value;
      let style2 = attributes.tail.head.value;
      let rest = attributes.tail.tail;
      let value = style1 + ";" + style2;
      let attribute$1 = new Attribute(kind, "style", value);
      loop$attributes = prepend(attribute$1, rest);
      loop$merged = merged;
    } else {
      let attribute$1 = attributes.head;
      let rest = attributes.tail;
      loop$attributes = rest;
      loop$merged = prepend(attribute$1, merged);
    }
  }
}
function prepare(attributes) {
  if (attributes.hasLength(0)) {
    return attributes;
  } else if (attributes.hasLength(1)) {
    return attributes;
  } else {
    let _pipe = attributes;
    let _pipe$1 = sort(_pipe, (a2, b) => {
      return compare3(b, a2);
    });
    return merge(_pipe$1, empty_list);
  }
}
var attribute_kind = 0;
function attribute(name, value) {
  return new Attribute(attribute_kind, name, value);
}
var property_kind = 1;
var event_kind = 2;
var debounce_kind = 1;
var throttle_kind = 2;

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name, value) {
  return attribute(name, value);
}
function class$(name) {
  return attribute2("class", name);
}
function do_classes(loop$names, loop$class) {
  while (true) {
    let names = loop$names;
    let class$2 = loop$class;
    if (names.hasLength(0)) {
      return class$2;
    } else if (names.atLeastLength(1) && names.head[1]) {
      let name$1 = names.head[0];
      let rest = names.tail;
      return class$2 + name$1 + " " + do_classes(rest, class$2);
    } else {
      let rest = names.tail;
      loop$names = rest;
      loop$class = class$2;
    }
  }
}
function classes(names) {
  return class$(do_classes(names, ""));
}
function href(url) {
  return attribute2("href", url);
}
function src(url) {
  return attribute2("src", url);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none() {
  return empty;
}
function from(effect) {
  let task = (actions) => {
    let dispatch = actions.dispatch;
    return effect(dispatch);
  };
  let _record = empty;
  return new Effect(toList([task]), _record.before_paint, _record.after_paint);
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get(map4, key) {
  const value = map4?.get(key);
  if (value != null) {
    return new Ok(value);
  } else {
    return new Error(void 0);
  }
}
function insert3(map4, key, value) {
  map4 ??= /* @__PURE__ */ new Map();
  map4.set(key, value);
  return map4;
}
function remove(map4, key) {
  map4?.delete(key);
  return map4;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index3, parent) {
    super();
    this.index = index3;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates.hasLength(0)) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return true;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function add2(parent, index3, key) {
  if (key === "") {
    return new Index(index3, parent);
  } else {
    return new Key(key, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_index = "\n";
var separator_key = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      if (acc.hasLength(0)) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(separator_key, prepend(key, acc));
    } else {
      let index3 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_index,
        prepend(to_string(index3), acc)
      );
    }
  }
}
function to_string2(path) {
  return do_to_string(path, toList([]));
}
function matches(path, candidates) {
  if (candidates.hasLength(0)) {
    return false;
  } else {
    return do_matches(to_string2(path), candidates);
  }
}
var separator_event = "\f";
function event(path, event2) {
  return do_to_string(path, toList([separator_event, event2]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key, mapper, children, keyed_children, children_count) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.children = children;
    this.keyed_children = keyed_children;
    this.children_count = children_count;
  }
};
var Element = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key, mapper, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key, mapper, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function advance(node) {
  if (node instanceof Fragment) {
    let children_count = node.children_count;
    return 1 + children_count;
  } else {
    return 1;
  }
}
var fragment_kind = 0;
function fragment(key, mapper, children, keyed_children, children_count) {
  return new Fragment(
    fragment_kind,
    key,
    mapper,
    children,
    keyed_children,
    children_count
  );
}
var element_kind = 1;
function element(key, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element(
    element_kind,
    key,
    mapper,
    namespace,
    tag,
    prepare(attributes),
    children,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag, namespace)
  );
}
var text_kind = 2;
function text(key, mapper, content) {
  return new Text(text_kind, key, mapper, content);
}
var unsafe_inner_html_kind = 3;
function set_fragment_key(loop$key, loop$children, loop$index, loop$new_children, loop$keyed_children) {
  while (true) {
    let key = loop$key;
    let children = loop$children;
    let index3 = loop$index;
    let new_children = loop$new_children;
    let keyed_children = loop$keyed_children;
    if (children.hasLength(0)) {
      return [reverse(new_children), keyed_children];
    } else if (children.atLeastLength(1) && children.head instanceof Fragment && children.head.key === "") {
      let node = children.head;
      let children$1 = children.tail;
      let child_key = key + "::" + to_string(index3);
      let $ = set_fragment_key(
        child_key,
        node.children,
        0,
        empty_list,
        empty2()
      );
      let node_children = $[0];
      let node_keyed_children = $[1];
      let _block;
      let _record = node;
      _block = new Fragment(
        _record.kind,
        _record.key,
        _record.mapper,
        node_children,
        node_keyed_children,
        _record.children_count
      );
      let new_node = _block;
      let new_children$1 = prepend(new_node, new_children);
      let index$1 = index3 + 1;
      loop$key = key;
      loop$children = children$1;
      loop$index = index$1;
      loop$new_children = new_children$1;
      loop$keyed_children = keyed_children;
    } else if (children.atLeastLength(1) && children.head.key !== "") {
      let node = children.head;
      let children$1 = children.tail;
      let child_key = key + "::" + node.key;
      let keyed_node = to_keyed(child_key, node);
      let new_children$1 = prepend(keyed_node, new_children);
      let keyed_children$1 = insert3(
        keyed_children,
        child_key,
        keyed_node
      );
      let index$1 = index3 + 1;
      loop$key = key;
      loop$children = children$1;
      loop$index = index$1;
      loop$new_children = new_children$1;
      loop$keyed_children = keyed_children$1;
    } else {
      let node = children.head;
      let children$1 = children.tail;
      let new_children$1 = prepend(node, new_children);
      let index$1 = index3 + 1;
      loop$key = key;
      loop$children = children$1;
      loop$index = index$1;
      loop$new_children = new_children$1;
      loop$keyed_children = keyed_children;
    }
  }
}
function to_keyed(key, node) {
  if (node instanceof Element) {
    let _record = node;
    return new Element(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.children,
      _record.keyed_children,
      _record.self_closing,
      _record.void
    );
  } else if (node instanceof Text) {
    let _record = node;
    return new Text(_record.kind, key, _record.mapper, _record.content);
  } else if (node instanceof UnsafeInnerHtml) {
    let _record = node;
    return new UnsafeInnerHtml(
      _record.kind,
      key,
      _record.mapper,
      _record.namespace,
      _record.tag,
      _record.attributes,
      _record.inner_html
    );
  } else {
    let children = node.children;
    let $ = set_fragment_key(
      key,
      children,
      0,
      empty_list,
      empty2()
    );
    let children$1 = $[0];
    let keyed_children = $[1];
    let _record = node;
    return new Fragment(
      _record.kind,
      key,
      _record.mapper,
      children$1,
      keyed_children,
      _record.children_count
    );
  }
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index3, removed, changes, children) {
    super();
    this.index = index3;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key, before, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
    this.count = count;
  }
};
var RemoveKey = class extends CustomType {
  constructor(kind, key, count) {
    super();
    this.kind = kind;
    this.key = key;
    this.count = count;
  }
};
var Replace = class extends CustomType {
  constructor(kind, from2, count, with$) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
    this.with = with$;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
var Remove = class extends CustomType {
  constructor(kind, from2, count) {
    super();
    this.kind = kind;
    this.from = from2;
    this.count = count;
  }
};
function new$4(index3, removed, changes, children) {
  return new Patch(index3, removed, changes, children);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key, before, count) {
  return new Move(move_kind, key, before, count);
}
var remove_key_kind = 4;
function remove_key(key, count) {
  return new RemoveKey(remove_key_kind, key, count);
}
var replace_kind = 5;
function replace2(from2, count, with$) {
  return new Replace(replace_kind, from2, count, with$);
}
var insert_kind = 6;
function insert4(children, before) {
  return new Insert(insert_kind, children, before);
}
var remove_kind = 7;
function remove2(from2, count) {
  return new Remove(remove_kind, from2, count);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace, tag, path) {
  if (tag === "input" && namespace === "") {
    return has_dispatched_events(events, path);
  } else if (tag === "select" && namespace === "") {
    return has_dispatched_events(events, path);
  } else if (tag === "textarea" && namespace === "") {
    return has_dispatched_events(events, path);
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$7 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (old.hasLength(0) && new$7.hasLength(0)) {
      return new AttributeChange(added, removed, events);
    } else if (old.atLeastLength(1) && old.head instanceof Event2 && new$7.hasLength(0)) {
      let prev = old.head;
      let name = old.head.name;
      let old$1 = old.tail;
      let removed$1 = prepend(prev, removed);
      let events$1 = remove_event(events, path, name);
      loop$controlled = controlled;
      loop$path = path;
      loop$mapper = mapper;
      loop$events = events$1;
      loop$old = old$1;
      loop$new = new$7;
      loop$added = added;
      loop$removed = removed$1;
    } else if (old.atLeastLength(1) && new$7.hasLength(0)) {
      let prev = old.head;
      let old$1 = old.tail;
      let removed$1 = prepend(prev, removed);
      loop$controlled = controlled;
      loop$path = path;
      loop$mapper = mapper;
      loop$events = events;
      loop$old = old$1;
      loop$new = new$7;
      loop$added = added;
      loop$removed = removed$1;
    } else if (old.hasLength(0) && new$7.atLeastLength(1) && new$7.head instanceof Event2) {
      let next = new$7.head;
      let name = new$7.head.name;
      let handler = new$7.head.handler;
      let new$1 = new$7.tail;
      let added$1 = prepend(next, added);
      let events$1 = add_event(events, mapper, path, name, handler);
      loop$controlled = controlled;
      loop$path = path;
      loop$mapper = mapper;
      loop$events = events$1;
      loop$old = old;
      loop$new = new$1;
      loop$added = added$1;
      loop$removed = removed;
    } else if (old.hasLength(0) && new$7.atLeastLength(1)) {
      let next = new$7.head;
      let new$1 = new$7.tail;
      let added$1 = prepend(next, added);
      loop$controlled = controlled;
      loop$path = path;
      loop$mapper = mapper;
      loop$events = events;
      loop$old = old;
      loop$new = new$1;
      loop$added = added$1;
      loop$removed = removed;
    } else {
      let prev = old.head;
      let remaining_old = old.tail;
      let next = new$7.head;
      let remaining_new = new$7.tail;
      let $ = compare3(prev, next);
      if (prev instanceof Attribute && $ instanceof Eq && next instanceof Attribute) {
        let _block;
        let $1 = next.name;
        if ($1 === "value") {
          _block = controlled || prev.value !== next.value;
        } else if ($1 === "checked") {
          _block = controlled || prev.value !== next.value;
        } else if ($1 === "selected") {
          _block = controlled || prev.value !== next.value;
        } else {
          _block = prev.value !== next.value;
        }
        let has_changes = _block;
        let _block$1;
        if (has_changes) {
          _block$1 = prepend(next, added);
        } else {
          _block$1 = added;
        }
        let added$1 = _block$1;
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Property && $ instanceof Eq && next instanceof Property) {
        let _block;
        let $1 = next.name;
        if ($1 === "scrollLeft") {
          _block = true;
        } else if ($1 === "scrollRight") {
          _block = true;
        } else if ($1 === "value") {
          _block = controlled || !isEqual(prev.value, next.value);
        } else if ($1 === "checked") {
          _block = controlled || !isEqual(prev.value, next.value);
        } else if ($1 === "selected") {
          _block = controlled || !isEqual(prev.value, next.value);
        } else {
          _block = !isEqual(prev.value, next.value);
        }
        let has_changes = _block;
        let _block$1;
        if (has_changes) {
          _block$1 = prepend(next, added);
        } else {
          _block$1 = added;
        }
        let added$1 = _block$1;
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Event2 && $ instanceof Eq && next instanceof Event2) {
        let name = next.name;
        let handler = next.handler;
        let has_changes = prev.prevent_default !== next.prevent_default || prev.stop_propagation !== next.stop_propagation || prev.immediate !== next.immediate || !limit_equals(
          prev.limit,
          next.limit
        );
        let _block;
        if (has_changes) {
          _block = prepend(next, added);
        } else {
          _block = added;
        }
        let added$1 = _block;
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Event2 && $ instanceof Eq) {
        let name = prev.name;
        let added$1 = prepend(next, added);
        let removed$1 = prepend(prev, removed);
        let events$1 = remove_event(events, path, name);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed$1;
      } else if ($ instanceof Eq && next instanceof Event2) {
        let name = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let removed$1 = prepend(prev, removed);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed$1;
      } else if ($ instanceof Eq) {
        let added$1 = prepend(next, added);
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed$1;
      } else if ($ instanceof Gt && next instanceof Event2) {
        let name = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if ($ instanceof Gt) {
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else if (prev instanceof Event2 && $ instanceof Lt) {
        let name = prev.name;
        let removed$1 = prepend(prev, removed);
        let events$1 = remove_event(events, path, name);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = remaining_old;
        loop$new = new$7;
        loop$added = added;
        loop$removed = removed$1;
      } else {
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = remaining_old;
        loop$new = new$7;
        loop$added = added;
        loop$removed = removed$1;
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$7 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path = loop$path;
    let changes = loop$changes;
    let children = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (old.hasLength(0) && new$7.hasLength(0)) {
      return new Diff(
        new Patch(patch_index, removed, changes, children),
        events
      );
    } else if (old.atLeastLength(1) && new$7.hasLength(0)) {
      let prev = old.head;
      let old$1 = old.tail;
      let _block;
      let $ = prev.key === "" || !contains(moved, prev.key);
      if ($) {
        _block = removed + advance(prev);
      } else {
        _block = removed;
      }
      let removed$1 = _block;
      let events$1 = remove_child(events, path, node_index, prev);
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$7;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed$1;
      loop$node_index = node_index;
      loop$patch_index = patch_index;
      loop$path = path;
      loop$changes = changes;
      loop$children = children;
      loop$mapper = mapper;
      loop$events = events$1;
    } else if (old.hasLength(0) && new$7.atLeastLength(1)) {
      let events$1 = add_children(
        events,
        mapper,
        path,
        node_index,
        new$7
      );
      let insert5 = insert4(new$7, node_index - moved_offset);
      let changes$1 = prepend(insert5, changes);
      return new Diff(
        new Patch(patch_index, removed, changes$1, children),
        events$1
      );
    } else if (old.atLeastLength(1) && new$7.atLeastLength(1) && old.head.key !== new$7.head.key) {
      let prev = old.head;
      let old_remaining = old.tail;
      let next = new$7.head;
      let new_remaining = new$7.tail;
      let next_did_exist = get(old_keyed, next.key);
      let prev_does_exist = get(new_keyed, prev.key);
      let prev_has_moved = contains(moved, prev.key);
      if (prev_does_exist.isOk() && next_did_exist.isOk() && prev_has_moved) {
        loop$old = old_remaining;
        loop$old_keyed = old_keyed;
        loop$new = new$7;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset - advance(prev);
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events;
      } else if (prev_does_exist.isOk() && next_did_exist.isOk()) {
        let match = next_did_exist[0];
        let count = advance(next);
        let before = node_index - moved_offset;
        let move2 = move(next.key, before, count);
        let changes$1 = prepend(move2, changes);
        let moved$1 = insert2(moved, next.key);
        let moved_offset$1 = moved_offset + count;
        loop$old = prepend(match, old);
        loop$old_keyed = old_keyed;
        loop$new = new$7;
        loop$new_keyed = new_keyed;
        loop$moved = moved$1;
        loop$moved_offset = moved_offset$1;
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes$1;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events;
      } else if (!prev_does_exist.isOk() && next_did_exist.isOk()) {
        let count = advance(prev);
        let moved_offset$1 = moved_offset - count;
        let events$1 = remove_child(events, path, node_index, prev);
        let remove3 = remove_key(prev.key, count);
        let changes$1 = prepend(remove3, changes);
        loop$old = old_remaining;
        loop$old_keyed = old_keyed;
        loop$new = new$7;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset$1;
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes$1;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      } else if (prev_does_exist.isOk() && !next_did_exist.isOk()) {
        let before = node_index - moved_offset;
        let count = advance(next);
        let events$1 = add_child(events, mapper, path, node_index, next);
        let insert5 = insert4(toList([next]), before);
        let changes$1 = prepend(insert5, changes);
        loop$old = old;
        loop$old_keyed = old_keyed;
        loop$new = new_remaining;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset + count;
        loop$removed = removed;
        loop$node_index = node_index + count;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes$1;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      } else {
        let prev_count = advance(prev);
        let next_count = advance(next);
        let change = replace2(node_index - moved_offset, prev_count, next);
        let _block;
        let _pipe = events;
        let _pipe$1 = remove_child(_pipe, path, node_index, prev);
        _block = add_child(_pipe$1, mapper, path, node_index, next);
        let events$1 = _block;
        loop$old = old_remaining;
        loop$old_keyed = old_keyed;
        loop$new = new_remaining;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset - prev_count + next_count;
        loop$removed = removed;
        loop$node_index = node_index + next_count;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = prepend(change, changes);
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else if (old.atLeastLength(1) && old.head instanceof Fragment && new$7.atLeastLength(1) && new$7.head instanceof Fragment) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$7.head;
      let new$1 = new$7.tail;
      let node_index$1 = node_index + 1;
      let prev_count = prev.children_count;
      let next_count = next.children_count;
      let composed_mapper = compose_mapper(mapper, next.mapper);
      let child = do_diff(
        prev.children,
        prev.keyed_children,
        next.children,
        next.keyed_children,
        empty_set(),
        moved_offset,
        0,
        node_index$1,
        -1,
        path,
        empty_list,
        children,
        composed_mapper,
        events
      );
      let _block;
      let $ = child.patch.removed > 0;
      if ($) {
        let remove_from = node_index$1 + next_count - moved_offset;
        let patch = remove2(remove_from, child.patch.removed);
        _block = append(child.patch.changes, prepend(patch, changes));
      } else {
        _block = append(child.patch.changes, changes);
      }
      let changes$1 = _block;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset + next_count - prev_count;
      loop$removed = removed;
      loop$node_index = node_index$1 + next_count;
      loop$patch_index = patch_index;
      loop$path = path;
      loop$changes = changes$1;
      loop$children = child.patch.children;
      loop$mapper = mapper;
      loop$events = child.events;
    } else if (old.atLeastLength(1) && old.head instanceof Element && new$7.atLeastLength(1) && new$7.head instanceof Element && (old.head.namespace === new$7.head.namespace && old.head.tag === new$7.head.tag)) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$7.head;
      let new$1 = new$7.tail;
      let composed_mapper = compose_mapper(mapper, next.mapper);
      let child_path = add2(path, node_index, next.key);
      let controlled = is_controlled(
        events,
        next.namespace,
        next.tag,
        child_path
      );
      let $ = diff_attributes(
        controlled,
        child_path,
        composed_mapper,
        events,
        prev.attributes,
        next.attributes,
        empty_list,
        empty_list
      );
      let added_attrs = $.added;
      let removed_attrs = $.removed;
      let events$1 = $.events;
      let _block;
      if (added_attrs.hasLength(0) && removed_attrs.hasLength(0)) {
        _block = empty_list;
      } else {
        _block = toList([update(added_attrs, removed_attrs)]);
      }
      let initial_child_changes = _block;
      let child = do_diff(
        prev.children,
        prev.keyed_children,
        next.children,
        next.keyed_children,
        empty_set(),
        0,
        0,
        0,
        node_index,
        child_path,
        initial_child_changes,
        empty_list,
        composed_mapper,
        events$1
      );
      let _block$1;
      let $1 = child.patch;
      if ($1 instanceof Patch && $1.removed === 0 && $1.changes.hasLength(0) && $1.children.hasLength(0)) {
        _block$1 = children;
      } else {
        _block$1 = prepend(child.patch, children);
      }
      let children$1 = _block$1;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path;
      loop$changes = changes;
      loop$children = children$1;
      loop$mapper = mapper;
      loop$events = child.events;
    } else if (old.atLeastLength(1) && old.head instanceof Text && new$7.atLeastLength(1) && new$7.head instanceof Text && old.head.content === new$7.head.content) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$7.head;
      let new$1 = new$7.tail;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path;
      loop$changes = changes;
      loop$children = children;
      loop$mapper = mapper;
      loop$events = events;
    } else if (old.atLeastLength(1) && old.head instanceof Text && new$7.atLeastLength(1) && new$7.head instanceof Text) {
      let old$1 = old.tail;
      let next = new$7.head;
      let new$1 = new$7.tail;
      let child = new$4(
        node_index,
        0,
        toList([replace_text(next.content)]),
        empty_list
      );
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path;
      loop$changes = changes;
      loop$children = prepend(child, children);
      loop$mapper = mapper;
      loop$events = events;
    } else if (old.atLeastLength(1) && old.head instanceof UnsafeInnerHtml && new$7.atLeastLength(1) && new$7.head instanceof UnsafeInnerHtml) {
      let prev = old.head;
      let old$1 = old.tail;
      let next = new$7.head;
      let new$1 = new$7.tail;
      let composed_mapper = compose_mapper(mapper, next.mapper);
      let child_path = add2(path, node_index, next.key);
      let $ = diff_attributes(
        false,
        child_path,
        composed_mapper,
        events,
        prev.attributes,
        next.attributes,
        empty_list,
        empty_list
      );
      let added_attrs = $.added;
      let removed_attrs = $.removed;
      let events$1 = $.events;
      let _block;
      if (added_attrs.hasLength(0) && removed_attrs.hasLength(0)) {
        _block = empty_list;
      } else {
        _block = toList([update(added_attrs, removed_attrs)]);
      }
      let child_changes = _block;
      let _block$1;
      let $1 = prev.inner_html === next.inner_html;
      if ($1) {
        _block$1 = child_changes;
      } else {
        _block$1 = prepend(
          replace_inner_html(next.inner_html),
          child_changes
        );
      }
      let child_changes$1 = _block$1;
      let _block$2;
      if (child_changes$1.hasLength(0)) {
        _block$2 = children;
      } else {
        _block$2 = prepend(
          new$4(node_index, 0, child_changes$1, toList([])),
          children
        );
      }
      let children$1 = _block$2;
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$1;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed;
      loop$node_index = node_index + 1;
      loop$patch_index = patch_index;
      loop$path = path;
      loop$changes = changes;
      loop$children = children$1;
      loop$mapper = mapper;
      loop$events = events$1;
    } else {
      let prev = old.head;
      let old_remaining = old.tail;
      let next = new$7.head;
      let new_remaining = new$7.tail;
      let prev_count = advance(prev);
      let next_count = advance(next);
      let change = replace2(node_index - moved_offset, prev_count, next);
      let _block;
      let _pipe = events;
      let _pipe$1 = remove_child(_pipe, path, node_index, prev);
      _block = add_child(_pipe$1, mapper, path, node_index, next);
      let events$1 = _block;
      loop$old = old_remaining;
      loop$old_keyed = old_keyed;
      loop$new = new_remaining;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset - prev_count + next_count;
      loop$removed = removed;
      loop$node_index = node_index + next_count;
      loop$patch_index = patch_index;
      loop$path = path;
      loop$changes = prepend(change, changes);
      loop$children = children;
      loop$mapper = mapper;
      loop$events = events$1;
    }
  }
}
function diff(events, old, new$7) {
  return do_diff(
    toList([old]),
    empty2(),
    toList([new$7]),
    empty2(),
    empty_set(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var Reconciler = class {
  offset = 0;
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  constructor(root3, dispatch, { useServerEvents = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch;
    this.#useServerEvents = useServerEvents;
  }
  mount(vdom) {
    appendChild(this.#root, this.#createElement(vdom));
  }
  #stack = [];
  push(patch) {
    const offset = this.offset;
    if (offset) {
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
          case move_kind:
            change.before = (change.before | 0) + offset;
            break;
          case remove_kind:
          case replace_kind:
            change.from = (change.from | 0) + offset;
            break;
        }
      });
      iterate(patch.children, (child) => {
        child.index = (child.index | 0) + offset;
      });
    }
    this.#stack.push({ node: this.#root, patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #reconcile() {
    const self = this;
    while (self.#stack.length) {
      const { node, patch } = self.#stack.pop();
      iterate(patch.changes, (change) => {
        switch (change.kind) {
          case insert_kind:
            self.#insert(node, change.children, change.before);
            break;
          case move_kind:
            self.#move(node, change.key, change.before, change.count);
            break;
          case remove_key_kind:
            self.#removeKey(node, change.key, change.count);
            break;
          case remove_kind:
            self.#remove(node, change.from, change.count);
            break;
          case replace_kind:
            self.#replace(node, change.from, change.count, change.with);
            break;
          case replace_text_kind:
            self.#replaceText(node, change.content);
            break;
          case replace_inner_html_kind:
            self.#replaceInnerHtml(node, change.inner_html);
            break;
          case update_kind:
            self.#update(node, change.added, change.removed);
            break;
        }
      });
      if (patch.removed) {
        self.#remove(
          node,
          node.childNodes.length - patch.removed,
          patch.removed
        );
      }
      iterate(patch.children, (child) => {
        self.#stack.push({ node: childAt(node, child.index), patch: child });
      });
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(node, children, before) {
    const fragment3 = createDocumentFragment();
    iterate(children, (child) => {
      const el = this.#createElement(child);
      addKeyedChild(node, el);
      appendChild(fragment3, el);
    });
    insertBefore(node, fragment3, childAt(node, before));
  }
  #move(node, key, before, count) {
    let el = getKeyedChild(node, key);
    const beforeEl = childAt(node, before);
    for (let i = 0; i < count && el !== null; ++i) {
      const next = el.nextSibling;
      if (SUPPORTS_MOVE_BEFORE) {
        node.moveBefore(el, beforeEl);
      } else {
        insertBefore(node, el, beforeEl);
      }
      el = next;
    }
  }
  #removeKey(node, key, count) {
    this.#removeFromChild(node, getKeyedChild(node, key), count);
  }
  #remove(node, from2, count) {
    this.#removeFromChild(node, childAt(node, from2), count);
  }
  #removeFromChild(parent, child, count) {
    while (count-- > 0 && child !== null) {
      const next = child.nextSibling;
      const key = child[meta].key;
      if (key) {
        parent[meta].keyedChildren.delete(key);
      }
      for (const [_, { timeout }] of child[meta].debouncers) {
        clearTimeout(timeout);
      }
      parent.removeChild(child);
      child = next;
    }
  }
  #replace(parent, from2, count, child) {
    this.#remove(parent, from2, count);
    const el = this.#createElement(child);
    addKeyedChild(parent, el);
    insertBefore(parent, el, childAt(parent, from2));
  }
  #replaceText(node, content) {
    node.data = content ?? "";
  }
  #replaceInnerHtml(node, inner_html) {
    node.innerHTML = inner_html ?? "";
  }
  #update(node, added, removed) {
    iterate(removed, (attribute3) => {
      const name = attribute3.name;
      if (node[meta].handlers.has(name)) {
        node.removeEventListener(name, handleEvent);
        node[meta].handlers.delete(name);
        if (node[meta].throttles.has(name)) {
          node[meta].throttles.delete(name);
        }
        if (node[meta].debouncers.has(name)) {
          clearTimeout(node[meta].debouncers.get(name).timeout);
          node[meta].debouncers.delete(name);
        }
      } else {
        node.removeAttribute(name);
        ATTRIBUTE_HOOKS[name]?.removed?.(node, name);
      }
    });
    iterate(added, (attribute3) => {
      this.#createAttribute(node, attribute3);
    });
  }
  // CONSTRUCTORS --------------------------------------------------------------
  #createElement(vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = createElement(vnode);
        this.#createAttributes(node, vnode);
        this.#insert(node, vnode.children, 0);
        return node;
      }
      case text_kind: {
        const node = createTextNode(vnode.content);
        initialiseMetadata(node, vnode.key);
        return node;
      }
      case fragment_kind: {
        const node = createDocumentFragment();
        const head = createTextNode();
        initialiseMetadata(head, vnode.key);
        appendChild(node, head);
        iterate(vnode.children, (child) => {
          appendChild(node, this.#createElement(child));
        });
        return node;
      }
      case unsafe_inner_html_kind: {
        const node = createElement(vnode);
        this.#createAttributes(node, vnode);
        this.#replaceInnerHtml(node, vnode.inner_html);
        return node;
      }
    }
  }
  #createAttributes(node, { attributes }) {
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #createAttribute(node, attribute3) {
    const nodeMeta = node[meta];
    switch (attribute3.kind) {
      case attribute_kind: {
        const name = attribute3.name;
        const value = attribute3.value ?? "";
        if (value !== node.getAttribute(name)) {
          node.setAttribute(name, value);
        }
        ATTRIBUTE_HOOKS[name]?.added?.(node, value);
        break;
      }
      case property_kind:
        node[attribute3.name] = attribute3.value;
        break;
      case event_kind: {
        if (!nodeMeta.handlers.has(attribute3.name)) {
          node.addEventListener(attribute3.name, handleEvent, {
            passive: !attribute3.prevent_default
          });
        }
        const prevent = attribute3.prevent_default;
        const stop = attribute3.stop_propagation;
        const immediate2 = attribute3.immediate;
        const include = Array.isArray(attribute3.include) ? attribute3.include : [];
        if (attribute3.limit?.kind === throttle_kind) {
          const throttle = nodeMeta.throttles.get(attribute3.name) ?? {
            last: 0,
            delay: attribute3.limit.delay
          };
          nodeMeta.throttles.set(attribute3.name, throttle);
        }
        if (attribute3.limit?.kind === debounce_kind) {
          const debounce = nodeMeta.debouncers.get(attribute3.name) ?? {
            timeout: null,
            delay: attribute3.limit.delay
          };
          nodeMeta.debouncers.set(attribute3.name, debounce);
        }
        nodeMeta.handlers.set(attribute3.name, (event2) => {
          if (prevent) event2.preventDefault();
          if (stop) event2.stopPropagation();
          const type = event2.type;
          let path = "";
          let pathNode = event2.currentTarget;
          while (pathNode !== this.#root) {
            const key = pathNode[meta].key;
            const parent = pathNode.parentNode;
            if (key) {
              path = `${separator_key}${key}${path}`;
            } else {
              const siblings = parent.childNodes;
              let index3 = [].indexOf.call(siblings, pathNode);
              if (parent === this.#root) {
                index3 -= this.offset;
              }
              path = `${separator_index}${index3}${path}`;
            }
            pathNode = parent;
          }
          path = path.slice(1);
          const data = this.#useServerEvents ? createServerEvent(event2, include) : event2;
          if (nodeMeta.throttles.has(type)) {
            const throttle = nodeMeta.throttles.get(type);
            const now = Date.now();
            const last = throttle.last || 0;
            if (now > last + throttle.delay) {
              throttle.last = now;
              this.#dispatch(data, path, type, immediate2);
            } else {
              event2.preventDefault();
            }
          } else if (nodeMeta.debouncers.has(type)) {
            const debounce = nodeMeta.debouncers.get(type);
            clearTimeout(debounce.timeout);
            debounce.timeout = setTimeout(() => {
              this.#dispatch(data, path, type, immediate2);
            }, debounce.delay);
          } else {
            this.#dispatch(data, path, type, immediate2);
          }
        });
        break;
      }
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.tail; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var appendChild = (node, child) => node.appendChild(child);
var insertBefore = (parent, node, referenceNode) => parent.insertBefore(node, referenceNode ?? null);
var createElement = ({ key, tag, namespace }) => {
  const node = document2.createElementNS(namespace || NAMESPACE_HTML, tag);
  initialiseMetadata(node, key);
  return node;
};
var createTextNode = (text4) => document2.createTextNode(text4 ?? "");
var createDocumentFragment = () => document2.createDocumentFragment();
var childAt = (node, at) => node.childNodes[at | 0];
var meta = Symbol("lustre");
var initialiseMetadata = (node, key = "") => {
  switch (node.nodeType) {
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      node[meta] = {
        key,
        keyedChildren: /* @__PURE__ */ new Map(),
        handlers: /* @__PURE__ */ new Map(),
        throttles: /* @__PURE__ */ new Map(),
        debouncers: /* @__PURE__ */ new Map()
      };
      break;
    case TEXT_NODE:
      node[meta] = { key, debouncers: /* @__PURE__ */ new Map() };
      break;
  }
};
var addKeyedChild = (node, child) => {
  if (child.nodeType === DOCUMENT_FRAGMENT_NODE) {
    for (child = child.firstChild; child; child = child.nextSibling) {
      addKeyedChild(node, child);
    }
    return;
  }
  const key = child[meta].key;
  if (key) {
    node[meta].keyedChildren.set(key, new WeakRef(child));
  }
};
var getKeyedChild = (node, key) => node[meta].keyedChildren.get(key).deref();
var handleEvent = (event2) => {
  const target = event2.currentTarget;
  const handler = target[meta].handlers.get(event2.type);
  if (event2.type === "submit") {
    event2.detail ??= {};
    event2.detail.formData = [...new FormData(event2.target).entries()];
  }
  handler(event2);
};
var createServerEvent = (event2, include = []) => {
  const data = {};
  if (event2.type === "input" || event2.type === "change") {
    include.push("target.value");
  }
  if (event2.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path = property3.split(".");
    for (let i = 0, input = event2, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input = input[path[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = (name) => {
  return {
    added(node) {
      node[name] = true;
    },
    removed(node) {
      node[name] = false;
    }
  };
};
var syncedAttribute = (name) => {
  return {
    added(node, value) {
      node[name] = value;
    }
  };
};
var ATTRIBUTE_HOOKS = {
  checked: syncedBooleanAttribute("checked"),
  selected: syncedBooleanAttribute("selected"),
  value: syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => node.focus?.());
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const vdom = virtualise_node(root3);
  if (vdom === null || vdom.children instanceof Empty) {
    const empty3 = empty_text_node();
    initialiseMetadata(empty3);
    root3.appendChild(empty3);
    return none2();
  } else if (vdom.children instanceof NonEmpty && vdom.children.tail instanceof Empty) {
    return vdom.children.head;
  } else {
    const head = empty_text_node();
    initialiseMetadata(head);
    root3.insertBefore(head, root3.firstChild);
    return fragment2(vdom.children);
  }
};
var empty_text_node = () => {
  return document2.createTextNode("");
};
var virtualise_node = (node) => {
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const key = node.getAttribute("data-lustre-key");
      initialiseMetadata(node, key);
      if (key) {
        node.removeAttribute("data-lustre-key");
      }
      const tag = node.localName;
      const namespace = node.namespaceURI;
      const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
      if (isHtmlElement && input_elements.includes(tag)) {
        virtualise_input_events(tag, node);
      }
      const attributes = virtualise_attributes(node);
      const children = virtualise_child_nodes(node);
      const vnode = isHtmlElement ? element2(tag, attributes, children) : namespaced(namespace, tag, attributes, children);
      return key ? to_keyed(key, vnode) : vnode;
    }
    case TEXT_NODE:
      initialiseMetadata(node);
      return text2(node.data);
    case DOCUMENT_FRAGMENT_NODE:
      initialiseMetadata(node);
      return node.childNodes.length > 0 ? fragment2(virtualise_child_nodes(node)) : null;
    default:
      return null;
  }
};
var input_elements = ["input", "select", "textarea"];
var virtualise_input_events = (tag, node) => {
  const value = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked) return;
  if (tag === "input" && node.type === "radio" && !checked) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value) return;
  queueMicrotask(() => {
    node.value = value;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document2.activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualise_child_nodes = (node) => {
  let children = empty_list;
  let child = node.lastChild;
  while (child) {
    const vnode = virtualise_node(child);
    const next = child.previousSibling;
    if (vnode) {
      children = new NonEmpty(vnode, children);
    } else {
      node.removeChild(child);
    }
    child = next;
  }
  return children;
};
var virtualise_attributes = (node) => {
  let index3 = node.attributes.length;
  let attributes = empty_list;
  while (index3-- > 0) {
    attributes = new NonEmpty(
      virtualise_attribute(node.attributes[index3]),
      attributes
    );
  }
  return attributes;
};
var virtualise_attribute = (attr) => {
  const name = attr.localName;
  const value = attr.value;
  return attribute2(name, value);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document2;
var is_reference_equal = (a2, b) => a2 === b;
var Runtime = class {
  constructor(root3, [model, effects], view2, update3) {
    this.root = root3;
    this.#model = model;
    this.#view = view2;
    this.#update = update3;
    this.#reconciler = new Reconciler(this.root, (event2, path, name) => {
      const [events, msg] = handle(this.#events, path, name, event2);
      this.#events = events;
      if (msg.isOk()) {
        this.dispatch(msg[0], false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$5();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  set offset(offset) {
    this.#reconciler.offset = offset;
  }
  dispatch(msg, immediate2 = false) {
    this.#shouldFlush ||= immediate2;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event2, data) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(
      new CustomEvent(event2, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate2) => this.dispatch(msg, immediate2),
    emit: (event2, data) => this.emit(event2, data),
    select: () => {
    },
    root: () => this.root
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next);
    this.#events = events;
    this.#vdom = next;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a2, b) {
  if (a2 instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a2;
  } else {
    return append(a2, b);
  }
}

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$5() {
  return new Events(
    empty2(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path, name) {
  return remove(handlers, event(path, name));
}
function remove_event(events, path, name) {
  let handlers = do_remove_event(events.handlers, path, name);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function remove_attributes(handlers, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        return do_remove_event(events, path, name);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path, name, event2) {
  let next_dispatched_paths = prepend(path, events.next_dispatched_paths);
  let _block;
  let _record = events;
  _block = new Events(
    _record.handlers,
    _record.dispatched_paths,
    next_dispatched_paths
  );
  let events$1 = _block;
  let $ = get(
    events$1.handlers,
    path + separator_event + name
  );
  if ($.isOk()) {
    let handler = $[0];
    return [events$1, run(event2, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path) {
  return matches(path, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path, name, handler) {
  return insert3(
    handlers,
    event(path, name),
    map3(handler, identity2(mapper))
  );
}
function add_event(events, mapper, path, name, handler) {
  let handlers = do_add_event(events.handlers, mapper, path, name, handler);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name = attribute3.name;
        let handler = attribute3.handler;
        return do_add_event(events, mapper, path, name, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = is_reference_equal(mapper, identity2);
  let $1 = is_reference_equal(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else if ($ && !$1) {
    return child_mapper;
  } else {
    return (msg) => {
      return mapper(child_mapper(msg));
    };
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children.hasLength(0)) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes);
    return do_remove_children(_pipe$1, path, 0, children);
  } else if (child instanceof Fragment) {
    let children = child.children;
    return do_remove_children(handlers, parent, child_index + 1, children);
  } else if (child instanceof UnsafeInnerHtml) {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    return remove_attributes(handlers, path, attributes);
  } else {
    return handlers;
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children.hasLength(0)) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path;
      loop$child_index = child_index + advance(child);
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Element) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children);
  } else if (child instanceof Fragment) {
    let children = child.children;
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let child_index$1 = child_index + 1;
    return do_add_children(
      handlers,
      composed_mapper,
      parent,
      child_index$1,
      children
    );
  } else if (child instanceof UnsafeInnerHtml) {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes);
  } else {
    return handlers;
  }
}
function add_child(events, mapper, parent, index3, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index3, child);
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}
function add_children(events, mapper, path, child_index, children) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path,
    child_index,
    children
  );
  let _record = events;
  return new Events(
    handlers,
    _record.dispatched_paths,
    _record.next_dispatched_paths
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function namespaced(namespace, tag, attributes, children) {
  return element(
    "",
    identity2,
    namespace,
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function text2(content) {
  return text("", identity2, content);
}
function none2() {
  return text("", identity2, "");
}
function count_fragment_children(loop$children, loop$count) {
  while (true) {
    let children = loop$children;
    let count = loop$count;
    if (children.hasLength(0)) {
      return count;
    } else if (children.atLeastLength(1) && children.head instanceof Fragment) {
      let children_count = children.head.children_count;
      let rest = children.tail;
      loop$children = rest;
      loop$count = count + children_count;
    } else {
      let rest = children.tail;
      loop$children = rest;
      loop$count = count + 1;
    }
  }
}
function fragment2(children) {
  return fragment(
    "",
    identity2,
    children,
    empty2(),
    count_fragment_children(children, 0)
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function article(attrs, children) {
  return element2("article", attrs, children);
}
function h1(attrs, children) {
  return element2("h1", attrs, children);
}
function h2(attrs, children) {
  return element2("h2", attrs, children);
}
function h3(attrs, children) {
  return element2("h3", attrs, children);
}
function main(attrs, children) {
  return element2("main", attrs, children);
}
function nav(attrs, children) {
  return element2("nav", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function li(attrs, children) {
  return element2("li", attrs, children);
}
function p(attrs, children) {
  return element2("p", attrs, children);
}
function ul(attrs, children) {
  return element2("ul", attrs, children);
}
function a(attrs, children) {
  return element2("a", attrs, children);
}
function img(attrs) {
  return element2("img", attrs, empty_list);
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name, data) {
    super();
    this.name = name;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, attributes, properties, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.attributes = attributes;
    this.properties = properties;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$6(options) {
  let init3 = new Config2(
    false,
    true,
    empty_dict(),
    empty_dict(),
    false,
    option_none,
    option_none,
    option_none
  );
  return fold(
    options,
    init3,
    (config, option) => {
      return option.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class _Spa {
  static start({ init: init3, update: update3, view: view2 }, selector, flags) {
    if (!is_browser()) return new Error(new NotABrowser());
    const root3 = selector instanceof HTMLElement ? selector : document2.querySelector(selector);
    if (!root3) return new Error(new ElementNotFound(selector));
    return new Ok(new _Spa(root3, init3(flags), update3, view2));
  }
  #runtime;
  constructor(root3, [init3, effects], update3, view2) {
    this.#runtime = new Runtime(root3, [init3, effects], view2, update3);
  }
  send(message) {
    switch (message.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message.name, message.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate2) {
    this.#runtime.dispatch(msg, immediate2);
  }
  emit(event2, data) {
    this.#runtime.emit(event2, data);
  }
};
var start = Spa.start;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update3, view2, config) {
    super();
    this.init = init3;
    this.update = update3;
    this.view = view2;
    this.config = config;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init3, update3, view2) {
  return new App(init3, update3, view2, new$6(empty_list));
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/modem/modem.ffi.mjs
var defaults = {
  handle_external_links: false,
  handle_internal_links: true
};
var initial_location = globalThis?.window?.location?.href;
var do_initial_uri = () => {
  if (!initial_location) {
    return new Error(void 0);
  } else {
    return new Ok(uri_from_url(new URL(initial_location)));
  }
};
var do_init = (dispatch, options = defaults) => {
  document.addEventListener("click", (event2) => {
    const a2 = find_anchor(event2.target);
    if (!a2) return;
    try {
      const url = new URL(a2.href);
      const uri = uri_from_url(url);
      const is_external = url.host !== window.location.host;
      if (!options.handle_external_links && is_external) return;
      if (!options.handle_internal_links && !is_external) return;
      event2.preventDefault();
      if (!is_external) {
        window.history.pushState({}, "", a2.href);
        window.requestAnimationFrame(() => {
          if (url.hash) {
            document.getElementById(url.hash.slice(1))?.scrollIntoView();
          }
        });
      }
      return dispatch(uri);
    } catch {
      return;
    }
  });
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    const uri = uri_from_url(url);
    window.requestAnimationFrame(() => {
      if (url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView();
      }
    });
    dispatch(uri);
  });
  window.addEventListener("modem-push", ({ detail }) => {
    dispatch(detail);
  });
  window.addEventListener("modem-replace", ({ detail }) => {
    dispatch(detail);
  });
};
var find_anchor = (el) => {
  if (!el || el.tagName === "BODY") {
    return null;
  } else if (el.tagName === "A") {
    return el;
  } else {
    return find_anchor(el.parentElement);
  }
};
var uri_from_url = (url) => {
  return new Uri(
    /* scheme   */
    url.protocol ? new Some(url.protocol.slice(0, -1)) : new None(),
    /* userinfo */
    new None(),
    /* host     */
    url.hostname ? new Some(url.hostname) : new None(),
    /* port     */
    url.port ? new Some(Number(url.port)) : new None(),
    /* path     */
    url.pathname,
    /* query    */
    url.search ? new Some(url.search.slice(1)) : new None(),
    /* fragment */
    url.hash ? new Some(url.hash.slice(1)) : new None()
  );
};

// build/dev/javascript/modem/modem.mjs
function init(handler) {
  return from(
    (dispatch) => {
      return guard(
        !is_browser(),
        void 0,
        () => {
          return do_init(
            (uri) => {
              let _pipe = uri;
              let _pipe$1 = handler(_pipe);
              return dispatch(_pipe$1);
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/app/app.mjs
var Model = class extends CustomType {
  constructor(posts2, route) {
    super();
    this.posts = posts2;
    this.route = route;
  }
};
var Post = class extends CustomType {
  constructor(id, title2, summary, text4) {
    super();
    this.id = id;
    this.title = title2;
    this.summary = summary;
    this.text = text4;
  }
};
var Index2 = class extends CustomType {
};
var Posts = class extends CustomType {
};
var PostById = class extends CustomType {
  constructor(id) {
    super();
    this.id = id;
  }
};
var About = class extends CustomType {
};
var Resume2 = class extends CustomType {
};
var NotFound = class extends CustomType {
  constructor(uri) {
    super();
    this.uri = uri;
  }
};
var UserNavigatedTo = class extends CustomType {
  constructor(route) {
    super();
    this.route = route;
  }
};
function parse_route(uri) {
  let $ = path_segments(uri.path);
  if ($.hasLength(0)) {
    return new Index2();
  } else if ($.hasLength(1) && $.head === "") {
    return new Index2();
  } else if ($.hasLength(1) && $.head === "posts") {
    return new Posts();
  } else if ($.hasLength(2) && $.head === "post") {
    let post_id = $.tail.head;
    let $1 = parse_int(post_id);
    if ($1.isOk()) {
      let post_id$1 = $1[0];
      return new PostById(post_id$1);
    } else {
      return new NotFound(uri);
    }
  } else if ($.hasLength(1) && $.head === "about") {
    return new About();
  } else {
    return new NotFound(uri);
  }
}
function href2(route) {
  let _block;
  if (route instanceof Index2) {
    _block = "/";
  } else if (route instanceof About) {
    _block = "https://github.com/ShahbozbekH";
  } else if (route instanceof Posts) {
    _block = "https://www.linkedin.com/in/shahbozhakimov/";
  } else if (route instanceof Resume2) {
    _block = "https://shahbozbekh.github.io/priv/static/media/HakimovShahbozbek.pdf";
  } else if (route instanceof PostById) {
    let post_id = route.id;
    _block = "/post/" + to_string(post_id);
  } else {
    _block = "/404";
  }
  let url = _block;
  return href(url);
}
function update2(model, msg) {
  {
    let route = msg.route;
    return [
      (() => {
        let _record = model;
        return new Model(_record.posts, route);
      })(),
      none()
    ];
  }
}
function view_header_link(target, current, text4) {
  let _block;
  if (current instanceof PostById && target instanceof Posts) {
    _block = true;
  } else {
    _block = isEqual(current, target);
  }
  let is_active = _block;
  return li(
    toList([
      classes(
        toList([
          ["border-transparent border-b-2 hover:border-purple-600", true],
          ["text-purple-600", is_active]
        ])
      )
    ]),
    toList([a(toList([href2(target)]), toList([text3(text4)]))])
  );
}
function title(title2) {
  return h2(
    toList([class$("text-3xl text-purple-800 font-light")]),
    toList([text3(title2)])
  );
}
function view_posts(model) {
  let _block;
  let _pipe = model.posts;
  let _pipe$1 = values(_pipe);
  let _pipe$2 = sort(
    _pipe$1,
    (a2, b) => {
      return compare(a2.id, b.id);
    }
  );
  _block = map(
    _pipe$2,
    (post) => {
      return article(
        toList([class$("mt-14")]),
        toList([
          h3(
            toList([class$("text-xl text-purple-600 font-light")]),
            toList([
              a(
                toList([
                  class$("hover:underline"),
                  href2(new PostById(post.id))
                ]),
                toList([text3(post.title)])
              )
            ])
          ),
          p(
            toList([class$("mt-1")]),
            toList([text3(post.summary)])
          )
        ])
      );
    }
  );
  let posts$1 = _block;
  return prepend(title("Posts"), posts$1);
}
function leading(text4) {
  return p(
    toList([class$("mt-8 text-lg")]),
    toList([text3(text4)])
  );
}
function paragraph(text4) {
  return p(
    toList([class$("mt-14")]),
    toList([text3(text4)])
  );
}
function view_resume() {
  return toList([
    title("Resume"),
    paragraph("You can find my resume here: "),
    a(
      toList([
        href2(new Resume2()),
        class$("text-purple-600 hover:underline cursor-pointer")
      ]),
      toList([text3("HakimovShahbozbek.pdf")])
    )
  ]);
}
function view_about() {
  return toList([
    title("Me"),
    paragraph(
      "I document the odd occurrences that catch my attention and rewrite my own\n       narrative along the way. I'm fine being referred to with pronouns."
    ),
    paragraph(
      "If you enjoy these glimpses into my mind, feel free to come back\n       semi-regularly. But not too regularly, you creep."
    )
  ]);
}
function view_not_found() {
  return toList([
    title("Not found"),
    paragraph(
      "You glimpse into the void and see -- nothing?\n       Well that was somewhat expected."
    )
  ]);
}
function link(target, title2) {
  return a(
    toList([
      href2(target),
      class$("text-purple-600 hover:underline cursor-pointer")
    ]),
    toList([text3(title2)])
  );
}
function view_index() {
  return toList([
    p(
      toList([class$("text-sm md:px-32")]),
      toList([
        text3(
          "Hello, I'm Shahbozbek Hakimov. This is my personal website for sharing my progress and thoughts. I hope to fill this space with interesting content soon. In the meantime, check out my resume "
        ),
        link(new Resume2(), "(or click here):")
      ])
    ),
    img(
      toList([
        class$("mx-auto"),
        src("http://shahbozbekh.github.io/priv/static/media/0.png")
      ])
    )
  ]);
}
function view_post(model, post_id) {
  let $ = map_get(model.posts, post_id);
  if (!$.isOk()) {
    return view_not_found();
  } else {
    let post = $[0];
    return toList([
      article(
        toList([]),
        toList([title(post.title), leading(post.summary), paragraph(post.text)])
      ),
      p(
        toList([class$("mt-14")]),
        toList([link(new Posts(), "<- Go back?")])
      )
    ]);
  }
}
function view(model) {
  return div(
    toList([class$("mx-auto max-w-3xl")]),
    toList([
      nav(
        toList([class$("flex justify-center items-center my-16")]),
        toList([
          h1(
            toList([
              class$("text-black-600 size-auto font-normal text-4xl")
            ]),
            toList([
              a(
                toList([href2(new Index2())]),
                toList([text3("Shahbozbek Hakimov")])
              ),
              ul(
                toList([
                  class$("flex justify-center space-x-8 text-xl")
                ]),
                toList([
                  div(
                    toList([
                      class$(
                        "text-blue-600 border-b-2 border-blue-600"
                      )
                    ]),
                    toList([
                      view_header_link(new Posts(), model.route, "LinkedIn")
                    ])
                  ),
                  div(
                    toList([
                      class$(
                        "text-black-600 border-b-2 border-black-600"
                      )
                    ]),
                    toList([
                      view_header_link(new About(), model.route, "Github")
                    ])
                  )
                ])
              ),
              a(
                toList([
                  class$(
                    "mx-auto flex justify-center max-w-9 mt-4 items-center animate-[spin_3s_linear_infinite]"
                  )
                ]),
                toList([
                  img(
                    toList([
                      src(
                        "http://shahbozbekh.github.io/priv/static/media/8star.png"
                      )
                    ])
                  )
                ])
              ),
              a(
                toList([
                  class$(
                    "mx-auto flex justify-center max-w-9 items-center rotate-[-38deg]"
                  )
                ]),
                toList([
                  img(
                    toList([
                      src(
                        "http://shahbozbekh.github.io/priv/static/media/crescent.png"
                      )
                    ])
                  )
                ])
              )
            ])
          )
        ])
      ),
      main(
        toList([class$("my-16")]),
        (() => {
          let $ = model.route;
          if ($ instanceof Index2) {
            return view_index();
          } else if ($ instanceof Posts) {
            return view_posts(model);
          } else if ($ instanceof PostById) {
            let post_id = $.id;
            return view_post(model, post_id);
          } else if ($ instanceof Resume2) {
            return view_resume();
          } else if ($ instanceof About) {
            return view_about();
          } else {
            return view_not_found();
          }
        })()
      ),
      div(
        toList([class$("")]),
        toList([
          div(
            toList([
              class$(
                "absolute top-[2.5px] left-[320.15px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C3C}")])
          ),
          div(
            toList([
              class$(
                "absolute -top-[61.5px] left-[174px] rotate-[48deg] invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([class$("")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[16px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[30px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[44px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[58px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[72px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[86px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[100px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[114px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[128px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[142px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[156px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[170px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[184px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[198px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[212px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[226px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute -top-[61.5px] left-[467.4px] -rotate-[48deg] invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([class$("")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[16px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[30px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[44px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[58px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[72px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[86px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[100px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[114px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[128px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[142px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[156px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[170px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[184px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[198px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[212px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[226px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[75px] left-[360px] font-bold invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([
                  class$(
                    "relative left-[1px] top-[26.5px] text-[0.5rem]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([class$("relative text-xl font-bold")]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[75px] left-[280px] font-bold invisible  xl:visible"
              )
            ]),
            toList([
              div(
                toList([
                  class$(
                    "relative left-[1px] top-[26.5px] text-[0.5rem]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative text-xl font-bold transform scaleX(-1)"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[12px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[22px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[32px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[42px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[52px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[62px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[72px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[82px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[92px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[102px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[112px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[122px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[132px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[142px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[152px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[162px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[172px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[182px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[192px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[202px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[212px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[222px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[232px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[242px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[252px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[262px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[272px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[282px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[292px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[302px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[312px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[322px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[332px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[342px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[352px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[362px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[372px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[382px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[392px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[402px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[412px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[422px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[432px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[442px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[452px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[462px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[472px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[482px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[492px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[502px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[512px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[522px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[532px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[542px] left-[320px] invisible xl:visible"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[546px] left-[320.15px] invisible xl:visible"
              )
            ]),
            toList([
              text3("\u{10C02}"),
              div(
                toList([]),
                toList([
                  div(
                    toList([
                      class$(
                        "relative bottom-[25px] left-[5px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[45px] left-[5px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[73.15px] right-[5.15px] -rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[94.15px] right-[5.15px] -rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[202px] left-[15px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[631px] left-[70px] rotate-[180deg]"
                      )
                    ]),
                    toList([text3("\u{10C43}")])
                  ),
                  div(
                    toList([
                      class$(
                        "absolute bottom-[718px] left-[140px] rotate-[180deg]"
                      )
                    ]),
                    toList([
                      div(
                        toList([
                          class$(
                            "relative bottom-[25px] left-[5px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[45px] left-[5px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[74px] right-[4px] -rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[94px] right-[4px] -rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[202px] left-[15px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[631px] left-[70px] rotate-[180deg]"
                          )
                        ]),
                        toList([text3("\u{10C43}")])
                      )
                    ])
                  )
                ])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute -top-[148.50px] left-[319.15px] rotate-[180deg] invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([
                  class$(
                    "relative bottom-[25px] left-[5px] rotate-[48deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[45px] left-[5px] rotate-[132deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[73px] right-[5px] -rotate-[48deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[93px] right-[5px] -rotate-[132deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[202px] left-[15px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[631px] left-[70px] rotate-[180deg]"
                  )
                ]),
                toList([text3("\u{10C43}")])
              ),
              div(
                toList([
                  class$(
                    "absolute bottom-[718px] left-[140px] rotate-[180deg]"
                  )
                ]),
                toList([
                  div(
                    toList([
                      class$(
                        "relative bottom-[25px] left-[5px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[45px] left-[5px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[74px] right-[4px] -rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[94px] right-[4px] -rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[202px] left-[15px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[631px] left-[70px] rotate-[180deg]"
                      )
                    ]),
                    toList([text3("\u{10C43}")])
                  )
                ])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[518px] left-[191px] rotate-[45deg] text-3xl invisible xl:visible"
              )
            ]),
            toList([
              text3("\u{10C2C}"),
              div(
                toList([class$("relative bottom-[55px] left-[5px]")]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[50px] right-[5px] rotate-[180deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[101.5px] left-[22px] rotate-[90deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[147px] right-[22px] rotate-[270deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[518px] left-[334px] rotate-[45deg] text-3xl invisible xl:visible"
              )
            ]),
            toList([
              text3("\u{10C2C}"),
              div(
                toList([
                  class$("relative bottom-[56.5px] left-[5px]")
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[50px] right-[5px] rotate-[180deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[101.5px] left-[22px] rotate-[90deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[147px] right-[22px] rotate-[270deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[552px] left-[320.15px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[562px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[572px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[582px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[592px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[602px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[612px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[622px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[632px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[642px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[652px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[662px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[672px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[682px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[692px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[702px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[712px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[722px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[732px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[742px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[752px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[762px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[772px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[782px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[792px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[802px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[812px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[822px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[832px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[842px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[852px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[862px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[872px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[882px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[892px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[902px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[912px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[922px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[932px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[942px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[952px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[962px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[972px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[982px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[992px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1002px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1012px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1022px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1032px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1042px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1052px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1062px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1072px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1082px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1092px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1102px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1112px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1122px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1132px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1142px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1152px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1162px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1172px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1182px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1192px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1202px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1212px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1222px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1232px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1242px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1252px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1262px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1272px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1282px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1292px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1302px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1312px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1322px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1332px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1342px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1352px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1362px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1372px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1382px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1392px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1402px] left-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          )
        ])
      ),
      div(
        toList([class$("")]),
        toList([
          div(
            toList([
              class$(
                "absolute top-[2.5px] right-[320.15px] invisible  xl:visible"
              )
            ]),
            toList([text3("\u{10C3C}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[12px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[22px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[32px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[42px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[52px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[62px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[72px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[82px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[92px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[102px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[112px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[122px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[132px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[142px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[152px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[162px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[172px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[182px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[192px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[202px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[212px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[222px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[232px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[242px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[252px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[262px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[272px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[282px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[292px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[302px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[312px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[322px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[332px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[342px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[352px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[362px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[372px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[382px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[392px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[402px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[412px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[422px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[432px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[442px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[452px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[462px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[472px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[482px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[492px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[502px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[512px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[522px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[532px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[542px] right-[320px] invisible xl:visible "
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[552px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[562px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[572px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[582px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[592px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[602px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[612px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[622px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[632px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[642px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[652px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[662px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[672px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[682px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[692px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[702px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[712px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[722px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[732px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[742px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[752px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[762px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[772px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[782px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[792px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[802px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[812px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[822px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[832px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[842px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[852px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[862px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[872px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[882px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[892px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[902px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[912px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[922px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[932px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[942px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[952px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[962px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[972px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[982px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[992px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1002px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1012px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1022px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1032px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1042px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1052px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1062px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1072px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1082px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1092px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1102px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1112px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1122px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1132px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1142px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1152px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1162px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1172px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1182px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1192px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1202px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1212px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1222px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1232px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1242px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1252px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1262px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1272px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1282px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1292px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1302px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1312px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1322px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1332px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1342px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1352px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1362px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1372px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1382px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1392px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute top-[1402px] right-[320px] invisible xl:visible rotate-[180deg]"
              )
            ]),
            toList([text3("\u{10C31}")])
          ),
          div(
            toList([
              class$(
                "absolute -top-[61.5px] right-[174px] -rotate-[48deg] invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([class$("")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[16px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[30px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[44px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[58px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[72px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([class$("relative -top-[86px] left-[0.01px]")]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[100px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[114px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[128px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[142px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[156px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[170px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[184px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[198px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[212px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              ),
              div(
                toList([
                  class$("relative -top-[226px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2D}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[75px] right-[280px] invisible font-bold invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([
                  class$(
                    "relative left-[1px] top-[26.5px] text-[0.5rem]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([class$("relative text-xl font-bold")]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[75px] right-[360px] invisible font-bold invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([
                  class$(
                    "relative left-[1px] top-[26.5px] text-[0.5rem]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative text-xl font-bold transform scaleX(-1)"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -right-[11px] -top-[17px] rotate-[90deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative left-[0px] -top-[34px] rotate-[180deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative -left-[10.75px] -top-[73px] rotate-[270deg] text-xl font-bold"
                  )
                ]),
                toList([text3("\u{10C10}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[400px] right-[400px] invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([
                  class$(
                    "relative rotate-[82deg] font-bold text-[1.0rem] bottom-[6px] right-[6.5px] "
                  )
                ]),
                toList([text3("\u{10C21}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[1.50rem] bottom-[45px] left-[1px] rotate-[40deg]"
                  )
                ]),
                toList([text3("\u{10C10}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[1.0rem] font-bold bottom-[68px] right-[17px] -rotate-[88deg]"
                  )
                ]),
                toList([text3("\u{10C21}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[0.5rem] bottom-[93px] left-[6px] rotate-[84deg]"
                  )
                ]),
                toList([text3("\u{10C28}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[0.4rem] bottom-[103px] left-[5px] rotate-[40deg]"
                  )
                ]),
                toList([text3("\u{10C28}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[0.4rem] bottom-[110px] left-[3px] rotate-[40deg]"
                  )
                ]),
                toList([text3("\u{10C28}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[0.9rem] bottom-[125px] right-[25px] -rotate-[90deg]"
                  )
                ]),
                toList([text3("\u{10C3D}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[0.8rem] bottom-[136px] right-[20px] -scale-x-100 scale-y-75"
                  )
                ]),
                toList([text3("\u{10C12}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[0.8rem] bottom-[155.5px] right-[8px] -scale-x-100 scale-y-75"
                  )
                ]),
                toList([text3("\u{10C12}")])
              ),
              div(
                toList([
                  class$(
                    "relative text-[0.3rem] bottom-[173.5px] right-[6.5px] "
                  )
                ]),
                toList([text3("\u{10C47}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute -top-[61.5px] right-[467.5px] rotate-[48deg] invisible  xl:visible"
              )
            ]),
            toList([
              div(
                toList([class$("")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[16px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[30px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[44px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[58px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[72px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([class$("relative -top-[86px] left-[0.01px]")]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[100px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[114px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[128px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[142px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[156px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[170px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[184px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[198px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[212px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              ),
              div(
                toList([
                  class$("relative -top-[226px] left-[0.01px]")
                ]),
                toList([text3("\u{10C2E}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[518px] right-[431px] rotate-[45deg] text-3xl invisible xl:visible"
              )
            ]),
            toList([
              text3("\u{10C2C}"),
              div(
                toList([
                  class$("relative bottom-[56.5px] left-[5px]")
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[50px] right-[5px] rotate-[180deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[101.5px] left-[22px] rotate-[90deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[147px] right-[22px] rotate-[270deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[518px] right-[289px] rotate-[45deg] text-3xl invisible xl:visible"
              )
            ]),
            toList([
              text3("\u{10C2C}"),
              div(
                toList([
                  class$("relative bottom-[56.5px] left-[5px]")
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[50px] right-[5px] rotate-[180deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[101.5px] left-[22px] rotate-[90deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[147px] right-[22px] rotate-[270deg]"
                  )
                ]),
                toList([text3("\u{10C3C}")])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute -top-[148.50px] right-[319.15px] rotate-[180deg] invisible xl:visible"
              )
            ]),
            toList([
              div(
                toList([
                  class$(
                    "relative bottom-[25px] left-[5px] rotate-[48deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[45px] left-[5px] rotate-[132deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[73px] right-[5px] -rotate-[48deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[93px] right-[5px] -rotate-[132deg]"
                  )
                ]),
                toList([text3("")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[202px] left-[15px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                  )
                ]),
                toList([text3("\u{10C31}")])
              ),
              div(
                toList([
                  class$(
                    "relative bottom-[631px] left-[70px] rotate-[180deg]"
                  )
                ]),
                toList([text3("\u{10C43}")])
              ),
              div(
                toList([
                  class$(
                    "absolute bottom-[718px] left-[140px] rotate-[180deg]"
                  )
                ]),
                toList([
                  div(
                    toList([
                      class$(
                        "relative bottom-[25px] left-[5px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[45px] left-[5px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[74px] right-[4px] -rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[94px] right-[4px] -rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[202px] left-[15px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[631px] left-[70px] rotate-[180deg]"
                      )
                    ]),
                    toList([text3("\u{10C43}")])
                  )
                ])
              )
            ])
          ),
          div(
            toList([
              class$(
                "absolute top-[546px] right-[319px] invisible xl:visible"
              )
            ]),
            toList([
              text3("\u{10C02}"),
              div(
                toList([]),
                toList([
                  div(
                    toList([
                      class$(
                        "relative bottom-[25px] left-[5px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[45px] left-[5px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[73.15px] right-[5.15px] -rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[94.15px] right-[5.15px] -rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[202px] left-[15px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                      )
                    ]),
                    toList([text3("\u{10C31}")])
                  ),
                  div(
                    toList([
                      class$(
                        "relative bottom-[631px] left-[70px] rotate-[180deg]"
                      )
                    ]),
                    toList([text3("\u{10C43}")])
                  ),
                  div(
                    toList([
                      class$(
                        "absolute bottom-[718px] left-[140px] rotate-[180deg]"
                      )
                    ]),
                    toList([
                      div(
                        toList([
                          class$(
                            "relative bottom-[25px] left-[5px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[45px] left-[5px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[74px] right-[4px] -rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[94px] right-[4px] -rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[112.5px] left-[10px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[149.5px] left-[10px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[155.75px] left-[15px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[202px] left-[15px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[199.25px] left-[20px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[254.50px] left-[20px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[242.75px] left-[25px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[306.75px] left-[25px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[286.25px] left-[30px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[359.25px] left-[30px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[329.75px] left-[35px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[411.75px] left-[35px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[373.25px] left-[40px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[464.25px] left-[40px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[416.75px] left-[45px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[516.75px] left-[45px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[460.25px] left-[50px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[569.25px] left-[50px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[503.75px] left-[55px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[621.75px] left-[55px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[547.25px] left-[60px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[674.25px] left-[60px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[590.75px] left-[65px] rotate-[132deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[726.75px] left-[65px] rotate-[48deg]"
                          )
                        ]),
                        toList([text3("\u{10C31}")])
                      ),
                      div(
                        toList([
                          class$(
                            "relative bottom-[631px] left-[70px] rotate-[180deg]"
                          )
                        ]),
                        toList([text3("\u{10C43}")])
                      )
                    ])
                  )
                ])
              )
            ])
          )
        ])
      )
    ])
  );
}
var posts = /* @__PURE__ */ toList([
  /* @__PURE__ */ new Post(
    1,
    "The Empty Chair",
    "A guide to uninvited furniture and its temporal implications",
    "\n      There's an empty chair in my home that wasn't there yesterday. When I sit\n      in it, I start to remember things that haven't happened yet. The chair is\n      getting closer to my bedroom each night, though I never caught it move.\n      Last night, I dreamt it was watching me sleep. This morning, it offered\n      me coffee.\n    "
  ),
  /* @__PURE__ */ new Post(
    2,
    "The Library of Unwritten Books",
    "Warning: Reading this may shorten your narrative arc",
    "\n      Between the shelves in the public library exists a thin space where\n      books that were never written somehow exist. Their pages change when you\n      blink. Forms shifting to match the souls blueprint. Librarians warn\n      against reading the final chapter of any unwritten book \u2013 those who do\n      find their own stories mysteriously concluding. Yourself is just another\n      draft to be rewritten.\n    "
  ),
  /* @__PURE__ */ new Post(
    3,
    "The Hum",
    "A frequency analysis of the collective forgetting",
    "\n      The citywide hum started Tuesday. Not everyone can hear it, but those who\n      can't are slowly being replaced by perfect copies who smile too widely.\n      The hum isn't sound \u2013 it's the universe forgetting our coordinates.\n      Reports suggest humming back in harmony might postpone whatever comes\n      next. Or perhaps accelerate it.\n    "
  )
]);
function init2(_) {
  let _block;
  let $ = do_initial_uri();
  if ($.isOk()) {
    let uri = $[0];
    _block = parse_route(uri);
  } else {
    _block = new Index2();
  }
  let route = _block;
  let _block$1;
  let _pipe = posts;
  let _pipe$1 = map(_pipe, (post) => {
    return [post.id, post];
  });
  _block$1 = from_list(_pipe$1);
  let posts$1 = _block$1;
  let model = new Model(posts$1, route);
  let effect = init(
    (uri) => {
      let _pipe$2 = uri;
      let _pipe$3 = parse_route(_pipe$2);
      return new UserNavigatedTo(_pipe$3);
    }
  );
  return [model, effect];
}
function main2() {
  let app = application(init2, update2, view);
  let $ = start3(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      24,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main2();
