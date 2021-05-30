

const whitespace = /\s/;


const tokenize = (text) => {
  const tokens = [];
  let token = '';

  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    let c = chars[i];
    if (c === '#') {
      token += c;
      while (++i < chars.length) {
        c = chars[i];
        if (c === '\n') {
          tokens.push(token);
          token = '';
          break;
        }
        token += c;
      }
    }
    else if (c === '[') {
      token += c;
      while (++i < chars.length) {
        c = chars[i];
        token += c;
        if (c === ']') {
          tokens.push(token);
          token = '';
          while (++i < chars.length && chars[i] !== '\n') {}
          break;
        }
      }
    }
    else if (c === '\n') {
      tokens.push('\n');
    }
    else if (whitespace.test(c)) {
      token += c;
      while (++i < chars.length) {
        c = chars[i];
        if (c === '\n') {
          tokens.push(token);
          token = '';
          break;
        }
        token += c;
      }
    }
    else {
      token += c;
      while (++i < chars.length) {
        c = chars[i];
        token += c;
        if (c === ':') {
          tokens.push(token);
          token = '';
          break;
        }
      }
      while (++i < chars.length) {
        c = chars[i];
        if (c === '\n') {
          if (!whitespace.test(token[0])) {
            token = ' ' + token;
          }
          if (token.trim().length > 0) {
            tokens.push(token);
          }
          token = '';
          break;
        }
        token += c;
      }
    }
  }
  return tokens;
}


module.exports = tokenize;