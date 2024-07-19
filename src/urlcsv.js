import * as fs from 'fs'
// const fs = require('fs')

export class URLCSV {
  async * #makeTextFileLineIterator(fileURL, charCode) {
    const utf8Decoder = new TextDecoder(charCode);
    const response = await fetch(fileURL);
    const reader = response.body.getReader();
    let { value: chunk, done: readerDone } = await reader.read();
    chunk = chunk ? utf8Decoder.decode(chunk) : "";

    const newline = /\r?\n/gm;
    let startIndex = 0;

    while (true) {
      const result = newline.exec(chunk);
      if (!result) {
        if (readerDone) break;
        const remainder = chunk.substr(startIndex);
        ({ value: chunk, done: readerDone } = await reader.read());
        chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : "");
        startIndex = newline.lastIndex = 0;
        continue;
      }
      yield chunk.substring(startIndex, result.index);
      startIndex = newline.lastIndex;
    }

    if (startIndex < chunk.length) {
      // Last line didn't end in a newline char
      yield chunk.substr(startIndex);
    }
  }

  async fetch(fileUrl, charCode) {
    const lines = []
    for await (const line of this.#makeTextFileLineIterator(fileUrl, charCode)) {
      lines.push(line)
    }
    // console.table(lines)
    return lines
  }

  async fetchAsJson(fileUrl, charCode, path) {
    const holidayCsvData = await this.fetch(fileUrl, charCode)
    holidayCsvData.shift()
    const holidayDataObject = holidayCsvData
      .reduce((result, line) => {
        const [dateName, holidayName] = line.split(',')
        result[dateName] = holidayName
        return result
      }, {})
    fs.writeFileSync(path, JSON.stringify(holidayDataObject));
  }

  loadHolidayJson(path) {
    const holidayJson = fs.readFileSync(path);
    const holidayObject = JSON.parse(holidayJson)

    const dateMap = Object.keys(holidayObject)
      .map(key => {
        const holidayName = holidayObject[key]
        const [year, month, date] = key.split('/')

        return [key, {
          holidayName,
          year: Number(year),
          month: Number(month),
          date: Number(date),
        }]
      })

    return new Map(dateMap)
  }
}
