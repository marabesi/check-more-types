'use strict'

/**
  Custom JavaScript assertions and predicates
  Created by Kensho https://github.com/kensho
  Copyright @ 2014 Kensho https://www.kensho.com/
  License: MIT

  @module check
*/

if (typeof Function.prototype.bind !== 'function') {
  throw new Error('Missing Function.prototype.bind, please load es5-shim first')
}

var curry2 = require('./utils').curry2
var low = require('./low-level')
var mid = require('./mid-level')

function every (predicateResults) {
  var property, value
  for (property in predicateResults) {
    if (predicateResults.hasOwnProperty(property)) {
      value = predicateResults[property]

      if (low.isObject(value) && every(value) === false) {
        return false
      }

      if (value === false) {
        return false
      }
    }
  }
  return true
}

function map (things, predicates) {
  var property
  var result = {}
  var predicate
  for (property in predicates) {
    if (predicates.hasOwnProperty(property)) {
      predicate = predicates[property]

      if (low.isFn(predicate)) {
        result[property] = predicate(things[property])
      } else if (low.isObject(predicate)) {
        result[property] = map(things[property], predicate)
      }
    }
  }

  return result
}

var check = {
  maybe: {},
  verify: {},
  not: {},
  every: every,
  map: map
}

/**
Checks if given string is already in lower case
@method lowerCase
*/
function lowerCase (str) {
  return check.string(str) &&
  str.toLowerCase() === str
}

/**
Returns true if the argument is an array with at least one value
@method unemptyArray
*/
function unemptyArray (a) {
  return check.array(a) && a.length > 0
}

/**
Returns true if each item in the array passes the predicate
@method arrayOf
@param rule Predicate function
@param a Array to check
*/
function arrayOf (rule, a) {
  return check.array(a) && a.every(rule)
}

/**
Returns items from array that do not passes the predicate
@method badItems
@param rule Predicate function
@param a Array with items
*/
function badItems (rule, a) {
  check.verify.array(a, 'expected array to find bad items')
  return a.filter(notModifier(rule))
}

/**
Returns true if given array only has strings
@method arrayOfStrings
@param a Array to check
@param checkLowerCase Checks if all strings are lowercase
*/
function arrayOfStrings (a, checkLowerCase) {
  var v = check.array(a) && a.every(check.string)
  if (v && check.bool(checkLowerCase) && checkLowerCase) {
    return a.every(check.lowerCase)
  }
  return v
}

/**
Returns true if given argument is array of arrays of strings
@method arrayOfArraysOfStrings
@param a Array to check
@param checkLowerCase Checks if all strings are lowercase
*/
function arrayOfArraysOfStrings (a, checkLowerCase) {
  return check.array(a) && a.every(function (arr) {
    return check.arrayOfStrings(arr, checkLowerCase)
  })
}

/**
  Checks if object passes all rules in predicates.

  check.all({ foo: 'foo' }, { foo: check.string }, 'wrong object')

  This is a composition of check.every(check.map ...) calls
  https://github.com/philbooth/check-types.js#batch-operations

  @method all
  @param {object} object object to check
  @param {object} predicates rules to check. Usually one per property.
  @public
  @returns true or false
*/
function all (obj, predicates) {
  check.verify.fn(check.every, 'missing check.every method')
  check.verify.fn(check.map, 'missing check.map method')

  check.verify.object(obj, 'missing object to check')
  check.verify.object(predicates, 'missing predicates object')
  Object.keys(predicates).forEach(function (property) {
    if (!check.fn(predicates[property])) {
      throw new Error('not a predicate function for ' + property + ' but ' + predicates[property])
    }
  })
  return check.every(check.map(obj, predicates))
}

/**
  Checks given object against predicates object
  @method schema
*/
function schema (predicates, obj) {
  return all(obj, predicates)
}

/** Checks if given function raises an error

  @method raises
*/
function raises (fn, errorValidator) {
  check.verify.fn(fn, 'expected function that raises')
  try {
    fn()
  } catch (err) {
    if (typeof errorValidator === 'undefined') {
      return true
    }
    if (typeof errorValidator === 'function') {
      return errorValidator(err)
    }
    return false
  }
  // error has not been raised
  return false
}

/**
  Returns true if given value is ''
  @method emptyString
*/
function emptyString (a) {
  return a === ''
}

/**
  Returns true if given value is [], {} or ''
  @method empty
*/
function empty (a) {
  var hasLength = typeof a === 'string' ||
  Array.isArray(a)
  if (hasLength) {
    return !a.length
  }
  if (a instanceof Object) {
    return !Object.keys(a).length
  }
  return false
}

/**
  Returns true if given value has .length and it is not zero, or has properties
  @method unempty
*/
function unempty (a) {
  var hasLength = typeof a === 'string' ||
  Array.isArray(a)
  if (hasLength) {
    return a.length
  }
  if (a instanceof Object) {
    return Object.keys(a).length
  }
  return true
}

function isPortNumber (x) {
  return check.positive(x) && x <= 65535
}

function isSystemPortNumber (x) {
  return check.positive(x) && x <= 1024
}

function isUserPortNumber (x) {
  return isPortNumber(x) && x > 1024
}

/**
  Returns true if 0 <= value <= 1
  @method unit
*/
function unit (value) {
  return check.number(value) &&
  value >= 0.0 && value <= 1.0
}

var rgb = /^#(?:[0-9a-fA-F]{3}){1,2}$/
/**
  Returns true if value is hex RGB between '#000000' and '#FFFFFF'
  @method hexRgb
*/
function hexRgb (value) {
  return check.string(value) &&
  rgb.test(value)
}

// typical git SHA commit id is 40 digit hex string, like
// 3b819803cdf2225ca1338beb17e0c506fdeedefc
var shaReg = /^[0-9a-f]{40}$/

/**
  Returns true if the given string is 40 digit SHA commit id
  @method commitId
*/
function commitId (id) {
  return check.string(id) &&
  id.length === 40 &&
  shaReg.test(id)
}

// when using git log --oneline short ids are displayed, first 7 characters
var shortShaReg = /^[0-9a-f]{7}$/

/**
  Returns true if the given string is short 7 character SHA id part
  @method shortCommitId
*/
function shortCommitId (id) {
  return check.string(id) &&
  id.length === 7 &&
  shortShaReg.test(id)
}

//
// helper methods
//

if (!check.defend) {
  var checkPredicates = function checksPredicates (fn, predicates, args) {
    check.verify.fn(fn, 'expected a function')
    check.verify.array(predicates, 'expected list of predicates')
    check.verify.defined(args, 'missing args')

    var k = 0 // iterates over predicates
    var j = 0 // iterates over arguments
    var n = predicates.length

    for (k = 0; k < n; k += 1) {
      var predicate = predicates[k]
      if (!check.fn(predicate)) {
        continue
      }

      if (!predicate(args[j])) {
        var msg = 'Argument ' + (j + 1) + ': ' + args[j] + ' does not pass predicate'
        if (low.unemptyString(predicates[k + 1])) {
          msg += ': ' + predicates[k + 1]
        }
        throw new Error(msg)
      }

      j += 1
    }
    return fn.apply(null, args)
  }

  check.defend = function defend (fn) {
    var predicates = Array.prototype.slice.call(arguments, 1)
    return function () {
      return checkPredicates(fn, predicates, arguments)
    }
  }
}

/**
  Combines multiple predicate functions to produce new OR predicate
  @method or
*/
function or () {
  var predicates = Array.prototype.slice.call(arguments, 0)
  if (!predicates.length) {
    throw new Error('empty list of arguments to or')
  }

  return function orCheck () {
    var values = Array.prototype.slice.call(arguments, 0)
    return predicates.some(function (predicate) {
      try {
        return check.fn(predicate) ? predicate.apply(null, values) : Boolean(predicate)
      } catch (err) {
        // treat exceptions as false
        return false
      }
    })
  }
}

/**
  Combines multiple predicate functions to produce new AND predicate
  @method or
*/
function and () {
  var predicates = Array.prototype.slice.call(arguments, 0)
  if (!predicates.length) {
    throw new Error('empty list of arguments to or')
  }

  return function orCheck () {
    var values = Array.prototype.slice.call(arguments, 0)
    return predicates.every(function (predicate) {
      return check.fn(predicate) ? predicate.apply(null, values) : Boolean(predicate)
    })
  }
}

/**
* Public modifier `not`.
*
* Negates `predicate`.
* copied from check-types.js
*/
function notModifier (predicate) {
  return function () {
    return !predicate.apply(null, arguments)
  }
}

if (!check.mixin) {
  /** Adds new predicate to all objects
  @method mixin */
  check.mixin = function mixin (fn, name) {
    if (low.isString(fn) && low.isFn(name)) {
      var tmp = fn
      fn = name
      name = tmp
    }

    if (!low.isFn(fn)) {
      throw new Error('expected predicate function for name ' + name)
    }
    if (!low.unemptyString(name)) {
      name = fn.name
    }
    if (!low.unemptyString(name)) {
      throw new Error('predicate function missing name\n' + fn.toString())
    }

    function registerPredicate (obj, name, fn) {
      if (!low.isObject(obj)) {
        throw new Error('missing object ' + obj)
      }
      if (!low.unemptyString(name)) {
        throw new Error('missing name')
      }
      if (!low.isFn(fn)) {
        throw new Error('missing function')
      }

      if (!obj[name]) {
        obj[name] = fn
      }
    }

    /**
     * Public modifier `maybe`.
     *
     * Returns `true` if `predicate` is  `null` or `undefined`,
     * otherwise propagates the return value from `predicate`.
     * copied from check-types.js
     */
    function maybeModifier (predicate) {
      return function () {
        if (!check.defined(arguments[0]) || check.nulled(arguments[0])) {
          return true
        }
        return predicate.apply(null, arguments)
      }
    }

    /**
     * Public modifier `verify`.
     *
     * Throws if `predicate` returns `false`.
     * copied from check-types.js
     */
    function verifyModifier (predicate, defaultMessage) {
      return function () {
        var message
        if (predicate.apply(null, arguments) === false) {
          message = arguments[arguments.length - 1]
          throw new Error(low.unemptyString(message) ? message : defaultMessage)
        }
      }
    }

    registerPredicate(check, name, fn)
    registerPredicate(check.maybe, name, maybeModifier(fn))
    registerPredicate(check.not, name, notModifier(fn))
    registerPredicate(check.verify, name, verifyModifier(fn, name + ' failed'))
  }
}

if (!check.then) {
  /**
    Executes given function only if condition is truthy.
    @method then
  */
  check.then = function then (condition, fn) {
    return function () {
      var ok = typeof condition === 'function' ? condition.apply(null, arguments) : condition
      if (ok) {
        return fn.apply(null, arguments)
      }
    }
  }
}

var promiseSchema = {
  then: low.isFn
}

// work around reserved keywords checks
promiseSchema['catch'] = low.isFn

var hasPromiseApi = schema.bind(null, promiseSchema)

/**
  Returns true if argument implements promise api (.then, .catch, .finally)
  @method promise
*/
function isPromise (p) {
  return check.object(p) && hasPromiseApi(p)
}

/**
  Shallow strict comparison
  @method equal
*/
function equal (a, b) {
  return a === b
}

/**
  Really simple email sanity check
  @method email
*/
function email (s) {
  return low.isString(s) &&
  /^.+@.+\..+$/.test(s)
}

// TODO just mix in all low and mid level predicates
// new predicates to be added to check object. Use object to preserve names
var predicates = {
  email: email,
  nulled: low.isNull,
  fn: low.isFn,
  string: low.isString,
  unemptyString: low.unemptyString,
  object: low.isObject,
  number: low.isNumber,
  array: Array.isArray,
  positiveNumber: low.positiveNumber,
  negativeNumber: low.negativeNumber,
  // a couple of aliases
  positive: low.positiveNumber,
  negative: low.negativeNumber,
  defined: low.defined,
  same: low.same,
  allSame: mid.allSame,
  bit: low.bit,
  bool: low.bool,
  has: low.has,
  lowerCase: lowerCase,
  unemptyArray: unemptyArray,
  arrayOfStrings: arrayOfStrings,
  arrayOfArraysOfStrings: arrayOfArraysOfStrings,
  all: all,
  schema: curry2(schema),
  raises: raises,
  empty: empty,
  found: mid.found,
  emptyString: emptyString,
  unempty: unempty,
  unit: unit,
  hexRgb: hexRgb,
  sameLength: mid.sameLength,
  commitId: commitId,
  shortCommitId: shortCommitId,
  index: mid.index,
  git: mid.git,
  arrayOf: arrayOf,
  badItems: badItems,
  oneOf: curry2(mid.oneOf, true),
  promise: isPromise,
  validDate: low.validDate,
  equal: curry2(equal),
  or: or,
  and: and,
  primitive: low.primitive,
  zero: low.zero,
  date: low.isDate,
  regexp: low.isRegExp,
  instance: low.instance,
  emptyObject: low.isEmptyObject,
  length: curry2(low.hasLength),
  floatNumber: low.isFloat,
  intNumber: low.isInteger,
  startsWith: mid.startsWith,
  webUrl: mid.webUrl,
  url: mid.webUrl,
  semver: mid.semver,
  type: curry2(mid.type),
  http: mid.http,
  https: mid.https,
  secure: mid.https,
  error: low.isError,
  port: isPortNumber,
  systemPort: isSystemPortNumber,
  userPort: isUserPortNumber,
  contains: mid.contains
}

Object.keys(predicates).forEach(function (name) {
  check.mixin(predicates[name], name)
})

check.VERSION = '{{ packageVersion }}'

module.exports = check