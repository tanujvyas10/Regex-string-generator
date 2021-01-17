const DRange = require("drange");
const tokenizer= require('./Tokenizer')
const types = require('./types')
/**
 *
 * There can be a scenerio where the repetitional token has its max set to Infinite,
 * In that case, our generator should only generate upto min + 50 entities
 *  (Just to avoid unwanted long string generation).
 *
 */
let max = 50;

/**
 * DefaultRange varies from 32(space) to 126(~) for our regexp(regular expression)
 */
let defaultRange = new DRange(32, 126);

/**
 * Random Integer generator between x and y
 */
const randomInteger = function (x, y) {
  return x + Math.floor(Math.random() * (1 + y - x));
};

/**
 * Randomly value selector from array.
 */
const randomSelect = function (arr) {
  if (arr instanceof DRange) {
    return arr.index(randomInteger(0, arr.length - 1));
  }
  return arr[randomInteger(0, arr.length - 1)];
};

/**
 *  Expansion of token for the given range random selecting
 */

const expandSet = function (regexToken) {
  switch (regexToken.type) {
    case types.CHAR:
      return new DRange(regexToken.value);
    case types.RANGE:
      return new DRange(regexToken.from, regexToken.to);
    default:
      let tempDRange = new DRange();
      for (let i = 0; i < regexToken.set.length; i++) {
        let rangeSet = expandSet(regexToken.set[i]);
        tempDRange.add(rangeSet);
      }

      let tempRange = defaultRange.clone();
      if (regexToken.not) {
        return tempRange.subtract(tempDRange);
      } else {
        return tempRange.intersect(tempDRange);
      }
  }
};

/**
 * Convert unicode to character 
 */


 const unicodeToChar = function(unicode){
   return String.fromCharCode(unicode);
 }


/**
 * Regex string generator function
 */

const generator = function (regexTokens) {
  let stack, len, extendedSet, strRes, i;
  max = 50;
  switch (regexTokens.type) {
    case types.ROOT:
    case types.GROUP:
      strRes = "";
      if (regexTokens.followedBy || regexTokens.notFollowedBy) {
        return "";
      }

      stack = regexTokens.options
        ? randomSelect(regexTokens.options)
        : regexTokens.stack;

      len = stack.length;

      for (i = 0; i < len; i++) {
        strRes += generator(stack[i]);
      }

      return strRes;

    case types.POSITION:
      return "";

    case types.SET:
      extendedSet = expandSet(regexTokens);
      if (!extendedSet.length) {
        return "";
      }
      
      return unicodeToChar(randomSelect(extendedSet));

    case types.CHAR:
      return unicodeToChar(regexTokens.value);

    case types.REPETITION:
      strRes = "";

      let tempMin = regexTokens.min;
      let tempMax =
        regexTokens.max === Infinity ? tempMin + max : regexTokens.max;
      let n = randomInteger(tempMin, tempMax);

      for (i = 0; i < n; i++) {
        strRes += generator(regexTokens.value);
      }

      return strRes;
  }
};

function Generate(regexp, n) {
  if (typeof regexp !== "string") {
    throw Error(
      "The input expression should be a string/regexp.Please try again"
    );
  }

  let result = [];
  let strLen = regexp.length;
  if (regexp[0] === "/" && regexp[strLen - 1] === "/")
    regexp = regexp.substr(1, strLen - 2);

  let regexTokens = tokenizer(regexp);
  for (let i = 0; i < n; i++) {
    result.push(generator(regexTokens));
  }

  return result;
}
module.exports = Generate;
