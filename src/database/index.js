const fs = require('fs');
const Path = require('path');

// use sync io to avoid concurrency conflicts (io is rare)

class Database {

  constructor(fleetPath) {
    this.fleetPath = fleetPath;
    this.metaPath = Path.join(this.fleetPath, 'meta-data.json');
    this.printers = [];
    this.printersPath = Path.join(this.fleetPath, 'printers');

    if (!fs.existsSync(this.printersPath)) {
      fs.mkdirSync(this.printersPath);
    }

    fs.readdirSync(this.printersPath)
    .map(file => Path.join(this.printersPath, file))
    .filter(file => fs.statSync(file).isDirectory())
    .forEach(dir => {
      try {
        const printerMetaData = Path.join(dir, 'meta-data.json');
        this.printers.push(JSON.parse(fs.readFileSync(printerMetaData)));
      } catch (ex) {
        console.log(ex);
      }
    });

    if (fs.existsSync(this.metaPath)) {
      this.metaData = JSON.parse(fs.readFileSync(this.metaPath));
    }
    else {
      this.metaData = {};
    }
  }

  saveMetaData() {
    fs.writeFileSync(this.path, JSON.stringify(this.metaPath));
  }

  createPrinter() {
    let index = 1;
    let printerid = '';
    let printerPath = '';
    while (true) {
      printerid = `p${index++}`;
      if (this.printers.find(printer => printer.id === printerid)) {
        continue;
      }
      printerPath = Path.join(this.printersPath, printerid);
      if (fs.existsSync(printerPath)) {
        continue;
      }
      break;
    }
    fs.mkdirSync(printerPath);
    const printer = {
      id: printerid
    };
    fs.writeFileSync(Path.join(printerPath, 'meta-data.json'), JSON.stringify(printer));
    return printer;
  }

  updatePrinter(printerid, printer) {
    const dataPath = Path.join(this.printersPath, printerid, 'meta-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(printer));
  }

  getPrinters() {
    return this.printers;
  }

  getPrinterById(id) {
    return this.getPrinters().find(printer => printer.id === id);
  }

  getPrinterByPort(port) {
    return this.getPrinters().find(printer => printer.port === port);
  }

  getPrinterPath(printerid, fileName) {
    return Path.join(this.fleetPath, printerid, fileName);
  }

  readFromPrinter(printerid, fileName) {
    const filePath = Path.join(this.fleetPath, printerid, fileName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
  }

  writeToPrinter(printerid, fileName, content) {
    const filePath = Path.join(this.fleetPath, printerid, fileName);
    fs.writeFileSync(filePath, content);
  }

}

module.exports = Database;
