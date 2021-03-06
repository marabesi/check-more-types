/* global describe, it, beforeEach, la, check */
describe('check-more-types', function () {
  var root = typeof window === 'object' ? window : global

  it('has check', function () {
    la(check)
    la(typeof check === 'object')
    la(check.object(check))
  })

  it('has no global check (does not pollute)', function () {
    la(root, 'has root')
  // la(!root.check, 'has no root.check')
  })

  describe('check/promise', function () {
    it('checks objects api', function () {
      var p = {
        then: function () {},
        catch: function () {},
        finally: function () {}
      }
      la(check.promise(p), 'promise passes')
    })

    it('does not pass some values', function () {
      la(!check.promise({}), 'empty object is not a promise')
      la(!check.promise('foo'), 'string is not a promise')
      la(!check.promise(), 'undefined value is not a promise')
    })

    it('does not throw exception when passed array', function () {
      la(!check.promise([]))
    })

    if (typeof Promise !== 'undefined') {
      /* global Promise */
      it('works for native ES6 Promises', function () {
        var p = Promise.resolve(42)
        la(check.promise(p), 'native Promise is detected')
      })
    }
  })

  describe('check/then', function () {
    var done = false
    function doIt () { done = true }

    beforeEach(function () {
      done = false
    })

    it('executes given function if condition is true', function () {
      la(!done, '!done initially')
      var safeDo = check.then(true, doIt)
      la(check.fn(safeDo), 'returns a new function')
      safeDo()
      la(done, 'safeDo was executed')
    })

    it('does not execute function if condition is false', function () {
      la(!done, '!done initially')
      var safeDo = check.then(false, doIt)
      safeDo()
      la(!done, 'safeDo was NOT executed')
    })

    it('can evaluate predicate function', function () {
      function isTrue () { return true }
      var safeDo = check.then(isTrue, doIt)
      safeDo()
      la(done)
    })

    it('can evaluate predicate function (returns false)', function () {
      function isFalse () { return false }
      var safeDo = check.then(isFalse, doIt)
      safeDo()
      la(!done)
    })

    it('can evaluate condition based on arguments', function () {
      function is3 (a) {
        return a === 3
      }
      var safeDo = check.then(is3, doIt)
      safeDo()
      la(!done, 'argument was not 3')

      safeDo(3)
      la(done, 'argument was 3')
    })

    it('handles multiple arguments', function () {
      function sumIs10 (a, b) { return a + b === 10 }
      var safeDo = check.then(sumIs10, doIt)
      safeDo(4, 6)
      la(done, 'executed')
      done = false
      safeDo(4, 4)
      la(!done, 'sum was not 10')
    })

    it('check.then', function () {
      function isSum10 (a, b) { return a + b === 10 }
      function sum (a, b) { return a + b }
      var onlyAddTo10 = check.then(isSum10, sum)
      // isSum10 returns true for these arguments
      // then sum is executed
      la(onlyAddTo10(3, 7) === 10)

      la(onlyAddTo10(1, 2) === undefined)
    // sum is never called because isSum10 condition is false
    })
  })

  describe('verify.all', function () {
    it('is a function', function () {
      la(check.fn(check.all))
      la(check.fn(check.verify.all))
    })

    it('requires arguments', function () {
      la(check.raises(function () {
        check.all()
      }))

      la(check.raises(function () {
        check.verify.all()
      }))

      la(check.raises(function () {
        check.verify.all({})
      }))
    })

    it('accepts empty objects', function () {
      la(check.all({}, {}))
      check.verify.all({}, {}, 'empty objects')
    })

    it('does nothing if everything is correct', function () {
      check.verify.all({
        foo: 'foo'
      }, {
        foo: check.unemptyString
      }, 'foo property')
    })

    it('throws an error if a property does not pass', function () {
      la(check.raises(function () {
        check.verify.all({
          foo: 'foo'
        }, {
          foo: check.number
        }, 'foo property')
      }))
    })

    it('fails if a predicate is not a function', function () {
      la(check.raises(function () {
        check.all({}, {
          foo: check.doesNotExistCheck
        })
      }))
    })

    describe('check.all partial', function () {
      it('check.all', function () {
        var obj = {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz'
        }
        var predicates = {
          foo: check.unemptyString,
          bar: function (value) {
            return value === 'bar'
          }
        }
        la(check.all(obj, predicates))
      })

      /** @sample check/all */
      it('checks an object', function () {
        function fooChecker (value) {
          return value === 'foo'
        }
        la(check.all({ foo: 'foo' }, { foo: fooChecker }))
      })

      /** @sample check/all */
      it('extra properties are allowed', function () {
        var obj = {
          foo: 'foo',
          bar: 'bar'
        }
        var predicates = {
          foo: check.unemptyString
        }
        la(check.all(obj, predicates))
      })

      it('succeeds if there are extra properties', function () {
        la(check.all({
          foo: 'foo',
          bar: 'bar'
        }, {
          foo: check.unemptyString
        }))
      })

      it('succeeds if there are extra false properties', function () {
        la(check.all({
          foo: 'foo',
          bar: false
        }, {
          foo: check.unemptyString
        }))
      })
    })
  })

  describe('maybe modifier', function () {
    it('default maybe from check-types.js', function () {
      la(check.object(check.maybe), 'check.maybe is an object')
      la(check.fn(check.maybe.fn), 'check.maybe.fn function')
      la(check.maybe.fn(), 'undefined is maybe a function')
      la(check.maybe.fn(null), 'null is maybe a function')
    })

    it('check.maybe.bit', function () {
      la(check.fn(check.maybe.bit), 'check.maybe.bit function')
      la(check.maybe.bit(1))
      la(check.maybe.bit())
      la(check.maybe.bit(null))
      la(!check.maybe.bit(4))
    })

    it('check.maybe other functions', function () {
      la(check.maybe.bool())
      la(!check.maybe.bool('true'))
    })

    it('check.maybe', function () {
      la(check.maybe.bool(), 'undefined is maybe bool')
      la(!check.maybe.bool('true'))
      var empty
      la(check.maybe.lowerCase(empty))
      la(check.maybe.unemptyArray())
      la(!check.maybe.unemptyArray([]))
      la(check.maybe.unemptyArray(['foo', 'bar']))
    })
  })

  describe('not modifier', function () {
    it('default not from check-types.js', function () {
      la(check.object(check.not), 'check.not is an object')
      la(check.fn(check.not.fn), 'check.maybe.fn function')
      la(check.not.fn(), 'undefined is not a function')
      la(check.not.fn(null), 'null is not a function')
    })

    it('check.not.bit', function () {
      la(check.fn(check.not.bit), 'check.not.bit function')
      la(!check.not.bit(1), '! 1 is not a bit')
      la(check.not.bit())
      la(check.not.bit(null))
      la(check.not.bit(4), '4 is not a bit')
    })

    it('check.not other functions', function () {
      la(check.not.bool())
      la(check.not.bool('true'))
      la(!check.not.bool(true))
    })

    it('check.not', function () {
      la(check.not.bool(4), '4 is not bool')
      la(check.not.bool('true'), 'string true is not a bool')
      la(!check.not.bool(true), 'true is a bool')
    })
  })

  describe('adding custom predicate', function () {
    it('check.mixin(predicate)', function () {
      la(!check.foo, 'there is no check.foo')
      // new predicate to be added. Should have function name
      function foo (a) {
        return a === 'foo'
      }
      check.mixin(foo)
      la(check.fn(check.foo), 'foo has been added to check')
      la(check.fn(check.maybe.foo), 'foo has been added to check.maybe')
      la(check.fn(check.not.foo), 'foo has been added to check.not')
      la(check.foo('foo'))
      la(check.maybe.foo('foo'))
      la(check.not.foo('bar'))

      // you can provide name
      function isBar (a) {
        return a === 'bar'
      }
      check.mixin(isBar, 'bar')
      la(check.bar('bar'))
      la(!check.bar('anything else'))

      // does NOT overwrite predicate if already exists
      la(check.bar === isBar, 'predicate has been registered')
      check.mixin(foo, 'bar')
      la(check.bar === isBar, 'old check predicate remains')
      delete check.foo
      delete check.bar
    })

    it('check.mixin(predicate, name)', function () {
      function isBar (a) {
        return a === 'bar'
      }
      check.mixin(isBar, 'bar')
      la(check.bar('bar'))
      la(!check.bar('anything else'))
      // supports modifiers
      la(check.maybe.bar())
      la(check.maybe.bar('bar'))
      la(check.not.bar('foo'))
      la(!check.not.bar('bar'))
    })

    it('check.mixin(name, predicate)', function () {
      function isItFoo (a) {
        return a === 'foo'
      }
      check.mixin('isItFooA', isItFoo)
      la(check.isItFooA('foo'), 'it is not foo')
    })

    it('check.mixin(predicate)', function () {
      // will use function name if just passed a function
      function isBar (a) {
        return a === 'bar'
      }
      check.mixin(isBar)
      la(check.isBar('bar'))
    })

    it('check.mixin does not override', function () {
      function isFoo (a) {
        return a === 'foo'
      }
      function isBar (a) {
        return a === 'bar'
      }
      check.mixin(isFoo, 'isFoo')
      la(check.isFoo === isFoo, 'predicate has been registered')
      check.mixin(isBar, 'isFoo')
      la(check.isFoo === isFoo, 'old check predicate remains')
    })
  })

  describe('check.verify extras', function () {
    it('has extra methods', function () {
      la(check.object(check.verify))
      la(check.fn(check.verify.lowerCase))
    })

    it('check.verify', function () {
      check.verify.arrayOfStrings(['foo', 'bar'])
      check.verify.bit(1)

      function nonStrings () {
        check.verify.arrayOfStrings(['Foo', 1])
      }

      la(check.raises(nonStrings))

      function nonLowerCase () {
        check.verify.lowerCase('Foo')
      }

      la(check.raises(nonLowerCase))
    })
  })

  describe('defend', function () {
    it('protects a function without predicates', function () {
      la(check.fn(check.defend))
      function add (a, b) { return a + b }
      var safeAdd = check.defend(add)
      la(check.fn(safeAdd), 'returns defended function')
      la(safeAdd !== add, 'it is not the same function')
      la(add(2, 3) === 5, 'original function works')
      la(safeAdd(2, 3) === 5, 'protected function works')
    })

    it('protects a function', function () {
      function add (a, b) { return a + b }
      var safeAdd = check.defend(add, check.number, check.number)
      la(add('foo', 2) === 'foo2',
        'adding string to number works just fine')
      la(check.raises(safeAdd.bind(null, 'foo', 2), function (err) {
        console.log(err)
        return /foo/.test(err.message)
      }), 'trying to add string to number breaks')
    })

    it('protects optional arguments', function () {
      function add (a, b) {
        if (typeof b === 'undefined') {
          return 'foo'
        }
        return a + b
      }
      la(add(2) === 'foo')
      var safeAdd = check.defend(add, check.number, check.maybe.number)
      la(safeAdd(2, 3) === 5)
      la(safeAdd(2) === 'foo')
    })

    it('can have string messages', function () {
      function add (a, b) { return a + b }
      la(add('foo', 2) === 'foo2')

      var safeAdd = check.defend(add,
        check.number, 'a should be a number')
      la(safeAdd(2, 3) === 5, '2 + 3 === 5')

      function addStringToNumber () {
        return safeAdd('foo', 2)
      }
      function checkException (err) {
        la(check.defined(err), 'got error object')
        la(/foo/.test(err.message),
          'has offending argument value', err.message)
        la(/a should be a number/.test(err.message),
          'has defensive message', err.message)
        return true
      }
      la(check.raises(addStringToNumber, checkException),
        'defends against string instead of number')
    })

    // API doc examples
    it('check.defend(fn, predicates)', function () {
      function add (a, b) { return a + b }
      var safeAdd = check.defend(add, check.number, check.number)
      la(add('foo', 2) === 'foo2', 'adding string to number works just fine')
      // calling safeAdd('foo', 2) raises an exception
      la(check.raises(safeAdd.bind(null, 'foo', 2)))
    })

    it('check.defend in module pattern', function () {
      var add = (function () {
        // inner private function without any argument checks
        function add (a, b) {
          return a + b
        }
        // return defended function
        return check.defend(add, check.number, check.number)
      }())
      la(add(2, 3) === 5)
      // trying to call with non-numbers raises an exception
      function callAddWithNonNumbers () {
        return add('foo', 'bar')
      }
      la(check.raises(callAddWithNonNumbers))
    })

    it('check.defend with messages', function () {
      function add (a, b) { return a + b }
      var safeAdd = check.defend(add,
        check.number, 'a should be a number',
        check.string, 'b should be a string')
      la(safeAdd(2, 'foo') === '2foo')

      function addNumbers () {
        return safeAdd(2, 3)
      }
      function checkException (err) {
        la(err.message === 'Argument 2: 3 does not pass predicate: b should be a string')
        return true
      }
      la(check.raises(addNumbers, checkException))
    })
  })
})
