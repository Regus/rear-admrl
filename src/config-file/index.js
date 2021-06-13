const fsp = require('fs').promises;
const Path = require('path');
const tokenize = require('./tokenize');
const detokenize = require('./detokenize');


const whitespace = /\s/;

class ConfigFile {

  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    const content = (await fsp.readFile(this.filePath)).toString();

    this.tokens = tokenize(content);
  }

  async save() {
    const content = detokenize(this.tokens);
    await fsp.writeFile(this.filePath, content);
  }

  findSegmentIndex(name) {
    const segmentName = /^\[(\w+)\]\s*$/gm;
    return this.segments.findIndex(seg => {
      const match = segmentName.exec(seg);
      return match && match[1] === name;
    });
  }

  findSegment(name) {
    const index = this.findSegmentIndex(name);
    if (index >= 0) {
      return this.segments[index];
    }
    return undefined;
  }

  getValue(segment, name) {
    let segmentFound = false;
    for (let i = 0; i < this.tokens.length; i++) {
      let token = this.tokens[i];
      if (segmentFound && token[0] === '[') { // next segment start => not found in segment
        return undefined;
      }
      else if (token === `[${segment}]`) {
        segmentFound = true;
      }
      else if (token === `${name}:`) {
        const values = [];
        while (++i < this.tokens.length) {
          token = this.tokens[i];
          if (whitespace.test(token[0])) {
            if (token !== '\n') {
              values.push(token.trim());
            }
          }
          else if (token[0] !== '#') {
            break;
          }
        }
        if (values.length > 1) {
          return values;
        }
        return values[0];
      }
    }
  }

  setValue(segment, name, value) {
    let segmentFound = false;
    for (let i = 0; i < this.tokens.length; i++) {
      let token = this.tokens[i];
      if (segmentFound && token[0] === '[') {
        while (this.tokens[--i] === '\n' || this.tokens[i][0] === '#') {}
        if (Array.isArray(value)) {
          this.tokens.splice(i + 1, 0, ...value.map(value => ` ${value}`));
        }
        else {
          this.tokens.splice(i + 1, 0, ` ${value}`);
        }
        this.tokens.splice(i + 1, 0, `${name}: `);
        break;
      }
      else if (token === `[${segment}]`) {
        segmentFound = true;
      }
      else if (token === `${name}:`) {
        while (this.tokens[i + 1] && (this.tokens[i + 1][0] === '#' || whitespace.test(this.tokens[i + 1][0]) && this.tokens[i + 1] !== '\n')) {
          this.tokens.splice(i + 1, 1);
        }
        if (Array.isArray(value)) {
          this.tokens.splice(i + 1, 0, ...value.map(value => ` ${value}`));
        }
        else {
          this.tokens.splice(i + 1, 0, ` ${value}`);
        }
        break;
      }
    }

    if (!segmentFound) {
      this.tokens.push(`[${segment}]`);
      this.tokens.push(`${name}: `);
      if (Array.isArray(value)) {
        this.tokens.push(...value.map(value => ` ${value}`));
      }
      else {
        this.tokens.push(` ${value}`);
      }

    }

  }



}

module.exports = ConfigFile;
