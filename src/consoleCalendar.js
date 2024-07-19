import { URLCSV } from "./urlcsv.js";
import chalk from 'chalk';

export class ConsoleCalendar {
  #year
  #month
  constructor(year, month) {
    this.#year = year
    this.#month = month
  }

  #getHolidayMap = async (targetYear, targetMonth) => {
    const url_csv = new URLCSV()
    const csvTexts = await url_csv.fetch('https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv', "shift-jis");
    const splitDateData = csvTexts
      .map(line => {
        const [dateData, holidayName] = line.split(',')
        const [year, month, date] = dateData.split('/')

        return [dateData, {
          holidayName,
          year: Number(year),
          month: Number(month),
          date: Number(date),
        }]
      })
      .filter(mapLine => mapLine[1].year === targetYear && mapLine[1].month === targetMonth)

    return new Map(splitDateData)
  }

  // 月末の日を取得
  #getEndDayOfMonth = (date) => {
    const _d = new Date(date)
    _d.setMonth(_d.getMonth() + 1)
    _d.setDate(0)
    return _d
  }

  // 月初の日を取得
  #getStartDayOfMonth = (year, month) => {
    const date = new Date()
    date.setFullYear(year)
    date.setMonth(month)
    date.setDate(1)
    return date
  }

  #dateEngraving = (dateNumber) => {
    const _s = String(dateNumber)
    if (_s.length === 1) {
      return ` ${_s}`
    }
    if (_s.length === 2) {
      return _s
    }
    throw new Error('Invalid Length.')
  }

  // 配列を任意の数で分割
  #sliceByNumber = (array, number) => {
    const length = Math.ceil(array.length / number)
    return new Array(length).fill().map((_, i) =>
      array.slice(i * number, (i + 1) * number)
    )
  }

  #generateCalendar = async (_year = null, _month = null) => {
    if (_year === null) {
      _year = (new Date()).getFullYear()
    }
    const targetYear = Number(_year)
    if (_month === null) {
      _month = (new Date()).getMonth()
    } else {
      _month = Number(_month) - 1
    }
    const targetMonth = {
      code: Number(_month),
      text: Number(_month) + 1
    }
    const holidayMap = await this.#getHolidayMap(targetYear, targetMonth.text)

    const today = new Date()
    const startDate = this.#getStartDayOfMonth(targetYear, targetMonth.code)
    // 月初日に合わせる
    const weekdaysList = ['日', '月', '火', '水', '木', '金', '土']

    const daysInMonth = this.#getEndDayOfMonth(startDate).getDate()
    // それぞれが日付としての数値を持つ配列
    const monthDayNumbers = Array(daysInMonth).fill(0).map((_, i) => i + 1)
    // 1日までの曜日のセルは空白
    const emptyCells = Array(startDate.getDay()).fill(`  `)
    const combined = [
      ...emptyCells,
      ...monthDayNumbers,
    ]
    // 週ごとに分割された日付数値配列
    const trimedDayByWeeks = this.#sliceByNumber(combined, 7)
    const contents = [
      `　　  ${targetYear}年${targetMonth.text}月  　　`,
      weekdaysList.join(' '),
      ...trimedDayByWeeks
        .map(thisWeekDays => {
          return thisWeekDays
            .map((dayNumber, _i) => {
              // 桁違いによる文字数を揃える
              const dayString = this.#dateEngraving(dayNumber)
              if (_i === 0) return chalk.red(dayString)
              if (_i === 6) return chalk.blue(dayString)
              // holiday
              if (holidayMap.has(`${targetYear}/${targetMonth.text}/${dayNumber}`)) {
                return chalk.red(dayString)
              }
              // isToday
              if (
                dayNumber === today.getDate() &&
                targetMonth.code === today.getMonth() &&
                targetYear === today.getFullYear()
              ) {
                return chalk.yellow(dayString)
              }
              return dayString
            })
            .join(' ')
        })
    ]

    return {
      lines: contents,
      outPutString: contents.join('\n'),
    }
  }

  output = async () => {
    const calendar = await this.#generateCalendar(this.#year, this.#month)
    console.log(calendar.outPutString);
  }
}