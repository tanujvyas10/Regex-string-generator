/**
 * Importing the types
 */
const types = require("./types");

/**
 * objects created for the categorized tokens
 */

const INTS = [{ type: types.RANGE, from: 48, to: 57 }];

const WORDS = [
  { type: types.CHAR, value: 95 },
  { type: types.RANGE, from: 97, to: 122 },
  { type: types.RANGE, from: 65, to: 90 },
  { type: types.RANGE, from: 48, to: 57 },
];

const WHITESPACE = [
  { type: types.CHAR, value: 9 },
  { type: types.CHAR, value: 10 },
  { type: types.CHAR, value: 11 },
  { type: types.CHAR, value: 12 },
  { type: types.CHAR, value: 13 },
  { type: types.CHAR, value: 32 },
  { type: types.CHAR, value: 160 },
  { type: types.CHAR, value: 5760 },
  { type: types.RANGE, from: 8192, to: 8202 },
  { type: types.CHAR, value: 8232 },
  { type: types.CHAR, value: 8233 },
  { type: types.CHAR, value: 8239 },
  { type: types.CHAR, value: 8287 },
  { type: types.CHAR, value: 12288 },
  { type: types.CHAR, value: 65279 },
];

const NOTANYCHAR = [
  { type: types.CHAR, value: 10 },
  { type: types.CHAR, value: 13 },
  { type: types.CHAR, value: 8232 },
  { type: types.CHAR, value: 8233 },
];

const words = { type: types.SET, set: WORDS, not: false };
const notWords = { type: types.SET, set: WORDS, not: true };
const ints = { type: types.SET, set: INTS, not: false };
const notInts = { type: types.SET, set: INTS, not: true };
const whitespace = { type: types.SET, set: WHITESPACE, not: false };
const notWhitespace = { type: types.SET, set: WHITESPACE, not: true };
const anyChar = { type: types.SET, set: NOTANYCHAR, not: true };

/**
 * Turns class into tokens
 * reads str until it encounters a ] not preceeded by a \
 */
const classTokenizer = function (str, regExpression) {
  let _a, _b, _c, _d, _e, _f, _g;
  let tokens = [],
    result,
    c;
  let regexp = /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(((?:\\)])|(((?:\\)?([^\]])))))|(\])|(?:\\)?([^])/g;
  while ((result = regexp.exec(str)) !== null) {
    let p =
      (_g =
        (_f =
          (_e =
            (_d =
              (_c =
                (_b =
                  (_a = result[1] && words) !== null && _a !== void 0
                    ? _a
                    : result[2] && ints) !== null && _b !== void 0
                  ? _b
                  : result[3] && whitespace) !== null && _c !== void 0
                ? _c
                : result[4] && notWords) !== null && _d !== void 0
              ? _d
              : result[5] && notInts) !== null && _e !== void 0
            ? _e
            : result[6] && notWhitespace) !== null && _f !== void 0
          ? _f
          : result[7] && {
              type: types.RANGE,
              from: (result[8] || result[9]).charCodeAt(0),
              to: (c = result[10]).charCodeAt(c.length - 1),
            }) !== null && _g !== void 0
        ? _g
        : (c = result[16]) && { type: types.CHAR, value: c.charCodeAt(0) };
    if (p) {
      tokens.push(p);
    } else {
      return [tokens, regexp.lastIndex];
    }
  }
  throw error(
    "Provided Regular Expression: /" +
      regExpression +
      "/: is Invalid (Unterminated character class)"
  );
};

/**
 * Tokenization of the regular expression taking place
 */
const tokenizer = (regExpression) => {
  let i = 0,
    c;
  let start = { type: types.ROOT, stack: [] };

  /**
   * Record of the end group and end stack
   */
  let endStack = start;
  let end = start.stack;
  let groupStack = [];



  /**
   * Iterate through each character in the regular expression.
   *  */
  while (i < regExpression.length) {
    switch ((c = regExpression[i++])) {
      /**
       * If there is any character except \n
       */
      case ".":
        end.push(anyChar);
        break;

      case "[": {
        /**
         * Checking for the '^
         */
        let not;
        if (regExpression[i] === "^") {
          not = true;
          i++;
        } else {
          not = false;
        }

        /**
         * Get all the classToken
         */
        let tempExp = regExpression.slice(i);
        let classTokens = classTokenizer(tempExp, regExpression);
        /**
         * Increment the index by length of the classToken
         */
        i += classTokens[1];
        end.push({
          type: types.SET,
          set: classTokens[0],
          not,
        });

        break;
      }

      /**
       * Pushing the group in the stack
       */
      case "(": {
        /*
         *Creation of a new group
         */

        let group = {
          type: types.GROUP,
          stack: [],
          remember: true,
        };

        /**
         * Special quantier 0 or 1 (special kind of group)
         */
        if (regExpression[i] === "?") {
          c = regExpression[i + 1];
          i += 2;
          group.remember = false;
        }

        /**
         * Insert the group stack in main group stack
         */
        end.push(group);

        /**
         * Enter the end stack in the group stack for make sure when the group is closing
         */
        groupStack.push(endStack);

        /**
         * Making the endStack the current group
         */
        endStack = group;
        end = group.stack;

        break;
      }

      /**
       * Removing the group from the stack
       */
      case ")":
        /**
         * If the groupStack length is zero it meas that the braces combinations were not matching
         */
        if (groupStack.length === 0) {
          throw new SyntaxError(
            ` ${regExpression} has Unmatched ) at  ${i - 1} index`
          );
        }
        endStack = groupStack.pop();

        /**
         * if the following group has a PIPE ('|' symbolize)
         * we need to revert it the the last stack
         */
        end = endStack.options
          ? endStack.options[endStack.options.length - 1]
          : endStack.stack;

        break;

      /**
       * case of pipe to signifies more options/ alternate options
       */
      case "|": {
        /**
         * creating an array with the consideration of it as a first pipe (option)
         */
        if (!endStack.options) {
          endStack.options = [endStack.stack];
          delete endStack.stack;
        }
        /**
         * create a new stack where we will the other options remaining
         */
        let stack = [];
        endStack.options.push(stack);
        end = stack;

        break;
      }

      /**
       * For the repetition case, last element of the last stack need to remove
       */
      case "{": {
        /**
         * Searching for the match of sliced regular expression
         * start from i
         */
        let result = /^(\d+)(,(\d+)?)?\}/.exec(regExpression.slice(i));
        let min, max;
        if (result !== null) {
          min = parseInt(result[1], 10);
          max = result[2]
            ? result[3]
              ? parseInt(result[3], 10)
              : Infinity
            : min;
          i += result[0].length;

          end.push({
            type: types.REPETITION,
            min,
            max,
            value: end.pop(),
          });
        } else {
          end.push({
            type: types.CHAR,
            value: 123,
          });
        }

        break;
      }

      /**
       * 0 or 1 quantifier case
       */
      case "?":
        end.push({
          type: types.REPETITION,
          min: 0,
          max: 1,
          value: end.pop(),
        });
        break;

      /**
       * 1 or more quantifier case
       */

      case "+":
        end.push({
          type: types.REPETITION,
          min: 1,
          max: Infinity,
          value: end.pop(),
        });

        break;

      /**
       * 0 or more quantifier
       */
      case "*":
        end.push({
          type: types.REPETITION,
          min: 0,
          max: Infinity,
          value: end.pop(),
        });

        break;

      case "^":
        end.push({ type: types.POSITION, value: "^" });
        break;

      /**
       * If the characters are not from the following
       * "[]{}()?+*^"
       * then it will be consider as the character so
       * save the character code value at 0 index
       */
      default:
        end.push({
          type: types.CHAR,
          value: c.charCodeAt(0),
        });
    }
  }

  /**
   * Checking if the groups are not closed
   */
  if (groupStack.length !== 0) {
    throw error(
      `The expression /${regExpression}/ donot have a closing group. Hence Invalid!`
    );
  }

  return start;
};

module.exports = tokenizer;
