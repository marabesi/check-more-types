require('lazy-ass');
global.check = require('check-types');
require('../check-more-types');

describe('check-more-types', function () {
  var root = typeof window === 'object' ? window : global;

  it('has check', function () {
    la(global.check);
    la(typeof check == 'object');
    la(check.object(check));
  });

  it('has extra checks', function () {
    la(check.fn(check.bit));
    la(check.fn(check.lowerCase));
  });

  describe('check.defined', function () {
    la(check.fn(check.bit));

    /** @sample check/defined */
    it('detects defined or not', function () {
      la(check.defined(0));
      la(check.defined(1));
      la(check.defined(true));
      la(check.defined(false));
      la(check.defined(null));
      la(check.defined(''));
      la(!check.defined());
      la(!check.defined(root.does_not_exist));
      la(!check.defined({}.does_not_exist));
    });

  });

  describe('check.bit', function () {
    la(check.fn(check.bit));

    /** @sample check/bit */
    it('detects 0/1', function () {
      la(check.bit(0));
      la(check.bit(1));
      la(!check.bit('1'));
      la(!check.bit(false));
    });

    it('passes', function () {
      la(check.bit(0));
      la(check.bit(1));
    });

    it('fails', function () {
      la(!check.bit('0'));
      la(!check.bit('1'));
      la(!check.bit(2));
      la(!check.bit(true));
      la(!check.bit(false));
    });
  });

  describe('check.unemptyArray', function () {
    la(check.fn(check.unemptyArray));

    /** @sample check/defined */
    it('detects unempty array or not', function () {
      la(!check.unemptyArray(null));
      la(!check.unemptyArray(1));
      la(!check.unemptyArray({}));
      la(!check.unemptyArray([]));
      la(!check.unemptyArray(root.does_not_exist));
      la(check.unemptyArray([1]));
      la(check.unemptyArray(['foo', 'bar']));
    });

  });

  describe('verify.all', function () {
    it('is a function', function () {
      la(check.fn(check.all));
      la(check.fn(check.verify.all));
    });

    xit('requires arguments', function () {
      expect(function () {
        check.all();
      }).toThrow();

      expect(function () {
        check.verify.all();
      }).toThrow();

      expect(function () {
        check.verify.all({});
      }).toThrow();

      expect(function () {
        check.verify.all({}, {});
      }).toThrow();
    });

    it('accepts empty objects', function () {
      expect(check.all({}, {})).toBe(true);
      expect(function () {
        check.verify.all({}, {}, 'empty objects');
      }).not.toThrow();
    });

    it('does nothing if everything is correct', function () {
      expect(function () {
        check.verify.all({
          foo: 'foo'
        }, {
          foo: check.unemptyString
        }, 'foo property');
      }).not.toThrow();
    });

    it('throws an error if a property does not pass', function () {
      expect(function () {
        check.verify.all({
          foo: 'foo'
        }, {
          foo: check.number
        }, 'foo property');
      }).toThrow();
    });

    it('fails if a predicate is not a function', function () {
      expect(function () {
        check.all({}, {
          foo: check.doesNotExistCheck
        });
      }).toThrow();
    });

    describe('check.all partial', function () {
      /** @sample check/all */
      it('checks an object', function () {
        function fooChecker(value) {
          return value === 'foo';
        }
        expect(check.all({ foo: 'foo' }, { foo: fooChecker })).toEqual(true);
      });

      /** @sample check/all */
      it('extra properties are allowed', function () {
        var obj = {
          foo: 'foo',
          bar: 'bar'
        };
        var predicates = {
          foo: check.unemptyString
        };
        expect(check.all(obj, predicates)).toEqual(true);
      });

      it('succeeds if there are extra properties', function () {
        expect(check.all({
          foo: 'foo',
          bar: 'bar'
        }, {
          foo: check.unemptyString
        })).toBe(true);
      });

      it('succeeds if there are extra false properties', function () {
        expect(check.all({
          foo: 'foo',
          bar: false
        }, {
          foo: check.unemptyString
        })).toBe(true);
      });
    });
  });

  describe('verify.ticker', function () {
    it('has functions', function () {
      expect(check.verify.ticker).toBeFunction();
      expect(check.ticker).toBeFunction();
    });

    /** @sample check/ticker */
    it('checks ticker', function () {
      var t = {
        ticker: 'BA',
        name: 'Bank of America',
        exchange: null
      };
      la(check.ticker(t));
      la(!check.ticker({ name: 'Just name'} ));
      // missing name
      la(!check.ticker({ ticker: 'NO'} ));
    });

    it('verifies ticker', function () {
      var t = {
        ticker: 'BA',
        name: 'Bank of America',
        exchange: null
      };
      expect(check.ticker(t)).toBe(true);
      check.verify.ticker(t);
    });

    it('throws exception if missing ticker', function () {
      expect(function () {
        check.verify.ticker({
          name: 'Bank of America',
          exchange: null
        });
      }).toThrow();
    });

    it('throws exception if missing name', function () {
      expect(function () {
        check.verify.ticker({
          ticker: 'BA',
          exchange: null
        });
      }).toThrow();
    });

    it('throws exception if missing exchange', function () {
      expect(function () {
        check.verify.ticker({
          ticker: 'BA',
          name: 'Bank of America'
        });
      }).toThrow();
    });

    it('throws exception if just ticker', function () {
      expect(function () {
        check.verify.ticker('BA');
      }).toThrow();
    });
  });

  describe('arrayOfStrings', function () {
    it('has check', function () {
      la(check.fn(check.arrayOfStrings));
      la(check.fn(check.verify.arrayOfStrings));
    });

    it('checks if strings are lower case', function () {
      la(check.arrayOfStrings(['foo', 'Foo']));
      la(!check.arrayOfStrings(['foo', 'Foo'], true));
      la(check.arrayOfStrings(['foo', 'bar'], true));
      la(!check.arrayOfStrings(['FOO', 'BAR'], true));
    });

    it('passes', function () {
      expect(check.arrayOfStrings([])).toBe(true);
      expect(check.arrayOfStrings(['foo'])).toBe(true);
      expect(check.arrayOfStrings(['foo', 'bar'])).toBe(true);

      expect(function () {
        check.verify.arrayOfStrings([]);
        check.verify.arrayOfStrings(['foo']);
        check.verify.arrayOfStrings(['foo', 'bar']);
      }).not.toThrow();
    });

    it('fails', function () {
      expect(function () {
        check.verify.arrayOfStrings('foo');
      }).toThrow();

      expect(function () {
        check.verify.arrayOfStrings([1]);
      }).toThrow();

      expect(function () {
        check.verify.arrayOfStrings(['foo', 1]);
      }).toThrow();
    });

    /** @sample check/arrayOfStrings */
    it('works', function () {
      la(check.arrayOfStrings(['foo', 'BAR']));
      la(!check.arrayOfStrings(['foo', 4]));
      // can check lower case
      la(!check.arrayOfStrings(['foo', 'Bar'], true));
      // lower case flag should be boolean
      la(check.arrayOfStrings(['foo', 'Bar'], 1));
    });

  });

  describe('arrayOfArraysOfStrings', function () {
    it('has check', function () {
      expect(check.arrayOfArraysOfStrings).toBeFunction();
      expect(check.verify.arrayOfArraysOfStrings).toBeFunction();
    });

    /** @sample check/arrayOfArraysOfStrings */
    it('checks if all strings are lower case', function () {
      la(check.arrayOfArraysOfStrings([['foo'], ['bar']]));
      la(check.arrayOfArraysOfStrings([['foo'], ['bar']], true));
      la(!check.arrayOfArraysOfStrings([['foo'], ['BAR']], true));
    });

    it('returns true', function () {
      expect(check.arrayOfArraysOfStrings([[]])).toBeTrue();
      expect(check.arrayOfArraysOfStrings([['foo'], ['bar']])).toBeTrue();
    });

    it('returns false', function () {
      expect(check.arrayOfArraysOfStrings([['foo', true]])).toBeFalse();
      expect(check.arrayOfArraysOfStrings([['foo'], ['bar'], [1]])).toBeFalse();
    });

    it('passes', function () {
      expect(function () {
        check.verify.arrayOfArraysOfStrings([[]]);
        check.verify.arrayOfArraysOfStrings([['foo']]);
        check.verify.arrayOfArraysOfStrings([['foo'], ['bar'], []]);
      }).not.toThrow();
    });

    it('fails', function () {
      expect(function () {
        check.verify.arrayOfArraysOfStrings('foo');
      }).toThrow();

      expect(function () {
        check.verify.arrayOfArraysOfStrings([1]);
      }).toThrow();

      expect(function () {
        check.verify.arrayOfArraysOfStrings(['foo', 1]);
      }).toThrow();

      expect(function () {
        check.verify.arrayOfArraysOfStrings([['foo', 1]]);
      }).toThrow();
    });
  });

  describe('array of date strings', function () {
    it('is a function', function () {
      expect(typeof check.arrayOfDateStrings).toEqual('function');
      expect(typeof check.verify.arrayOfDateStrings).toEqual('function');
    });

    it('passes', function () {
      expect(check.arrayOfDateStrings(['2000-12-01'])).toBe(true);
      expect(check.arrayOfDateStrings(['2000-12-01', '1999-01-25'])).toBe(true);

      check.verify.arrayOfDateStrings(['2000-12-01']);
      check.verify.arrayOfDateStrings(['2000-12-01', '1999-01-25']);
    });

    it('throws', function () {
      expect(function () {
        check.verify.arrayOfDateStrings('2012-01-10');
      }).toThrow();

      expect(function () {
        check.verify.arrayOfDateStrings(['2012-01-10', 10]);
      }).toThrow();

      expect(function () {
        check.verify.arrayOfDateStrings(['2012-01-10', '01/25/1990']);
      }).toThrow();
    });
  });

  describe('date checks', function () {
    it('has checks', function () {
      expect(typeof check.dateFormat).toEqual('function');
      expect(typeof check.verify.dateFormat).toEqual('function');
    });

    it('verify passes', function () {
      expect(check.dateFormat('2010-01-01')).toBe(true);

      expect(function () {
        check.verify.dateFormat('2010-01-01');
        check.verify.dateFormat('2010-01-02');
        check.verify.dateFormat('2010-12-31');
        check.verify.dateFormat('2015-12-31');
      }).not.toThrow();
    });

    /** @sample check/dateFormat */
    it('validates date format', function () {
      la(check.dateFormat('2010-03-20'));
      la(!check.dateFormat('2010-3-2'));
      la(!check.dateFormat('02/10/1999'));
    });

    it('verify throws', function () {
      expect(check.dateFormat('2010/01/01')).toBe(false);

      expect(function () {
        check.verify.dateFormat('yyyy-01-01');
      }).toThrow();

      expect(function () {
        check.verify.dateFormat('yyyy-mm-dd');
      }).toThrow();

      expect(function () {
        check.verify.dateFormat('14-01-01');
      }).toThrow();

      expect(function () {
        check.verify.dateFormat('01-01');
      }).toThrow();

      expect(function () {
        check.verify.dateFormat('01-01-2010');
      }).toThrow();

      expect(function () {
        check.verify.dateFormat('01/01/2010');
      }).toThrow();

      expect(function () {
        check.verify.dateFormat('2010/02/05');
      }).toThrow();
    });
  });

  describe('lowerCase', function () {
    /** @sample check/lowerCase */
    it('checks lower case', function () {
      la(check.lowerCase('foo bar'));
      la(check.lowerCase('*foo ^bar'));
      la(!check.lowerCase('fooBar'));
    });

    it('passes lower case with spaces', function () {
      expect(check.lowerCase('foo')).toBe(true);
      expect(check.lowerCase('foo bar')).toBe(true);
      expect(check.lowerCase('  foo bar  ')).toBe(true);
    });

    it('handles special chars', function () {
      expect(check.lowerCase('^tea')).toBe(true);
      expect(check.lowerCase('$tea')).toBe(true);
      expect(check.lowerCase('s&p 500')).toBe(true);
    });

    it('rejects upper case', function () {
      expect(check.lowerCase('Foo')).toBe(false);
      expect(check.lowerCase('FOO ')).toBe(false);
      expect(check.lowerCase('FOO BAR')).toBe(false);
      expect(check.lowerCase('foo bAr')).toBe(false);
    });

    it('returns true', function () {
      expect(check.lowerCase).toBeFunction('it is a function');
      expect(check.lowerCase('foo 2 []')).toBeTrue();
      expect(check.lowerCase('-_foo_ and another bar')).toBeTrue();
    });

    it('returns false', function () {
      expect(check.lowerCase('FoO')).toBeFalse();
    });

    it('returns false for non strings', function () {
      expect(check.lowerCase([])).toBeFalse();
      expect(check.lowerCase(7)).toBeFalse();
      expect(check.lowerCase({ foo: 'foo' })).toBeFalse();
    });
  });

  describe('has', function () {
    /** @sample check/has */
    it('checks property presense', function () {
      var obj = {
        foo: 'foo',
        bar: 0
      };
      la(check.has(obj, 'foo'));
      la(check.has(obj, 'bar'));
      la(!check.has(obj, 'baz'));
    });

    it('passes', function () {
      var o = {
        foo: '',
        bar: 'something',
        baz: 0
      };
      la(check.fn(check.has));
      la(check.has(o, 'foo'));
      la(check.has(o, 'bar'));
      la(check.has(o, 'baz'));
    });

    /** @example check/has */
    it('works for non-objects', function () {
      expect(check.has('str', 'length')).toBeTrue('string length');
      expect(check.has([], 'length')).toBeTrue('array length');
    });

    it('fails for invalid args', function () {
      la(!check.has(), 'no arguments');
      la(!check.has({}), 'no property name');
      la(!check.has({}, 99), 'invalid property name');
      la(!check.has({}, ''), 'empty property name');
    });

    it('fails for missing properties', function () {
      la(!check.has({}, 'foo'));
    });
  });
});
