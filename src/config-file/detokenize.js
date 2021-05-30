

const whitespace = /\s/;


const detokenize = (tokens) => {
  let text = '';
  let inValue = false;
  let multiValue = false;
  let blankCount = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token[0] === '#') {
      if (inValue) {
        text += '\n' + token;
        multiValue = true;
      }
      else {
        text += token + '\n';
      }
      blankCount = 0;
    }
    else if (token[0] === '[') {
      if (inValue) {
        text += '\n';
      }
      if (blankCount === 0) {
        text += '\n';
      }
      text += token + '\n';
      inValue = false;
      blankCount = 0;
    }
    else if (token === '\n') {
      blankCount++;
      text += token;
    }
    else if (whitespace.test(token[0])) {
      if (inValue) {
        if (!multiValue) {
          const nextToken = tokens[i + 1];
          if (nextToken && whitespace.test(nextToken[0]) && nextToken !== '\n') {
            multiValue = true;
          }
        }
        if (multiValue) {
          text += '\n';
        }
        text += token;
        blankCount = 0;
      }
      else {
        throw new Error('value without key');
      }
    }
    else {
      if (inValue) {
        text += '\n';
      }
      text += token;
      inValue = true;
      multiValue = false;
      blankCount = 0;
    }
  };
  text += '\n';
  return text;
}


module.exports = detokenize;