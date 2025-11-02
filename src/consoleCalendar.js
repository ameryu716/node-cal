import { URLCSV } from "./urlcsv.js"
import chalk from 'chalk'
import * as fs from 'fs'

export class ConsoleCalendar {
  #year
  #month
  #is_holiday_data_refresh
  constructor(year, month, is_holiday_data_refresh = false) {
    this.#year = year
    this.#month = month
    this.#is_holiday_data_refresh = is_holiday_data_refresh
  }

  // 祝日データ取得
  #getHolidayMap = async (target_year, target_month, refresh = false) => {
    const url_csv = new URLCSV()
    const dir_name = import.meta.dirname + '/downloads/'
    const json_path = dir_name + 'holiday.json'
    // 祝日データが保存されてないか、リフレッシュする場合はURLからCSVをロードし、JSON変換する。
    if (refresh || !fs.existsSync(json_path)) {
      console.log('🔄 CSV fetch from gov... 🗓️')
      if (!fs.existsSync(dir_name)) {
        fs.mkdirSync(dir_name)
      }
      // 👇名前気持ち悪すぎだろ...
      const csv_url = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv'
      const char_code = "shift-jis"
      await url_csv.fetchAsJson(csv_url, char_code, json_path)
    }
    // JSONファイルから祝日データを取得
    const holiday_map = url_csv.loadHolidayJson(json_path)
    // 指定範囲内の祝日データを取る
    const in_range_holidays = [...holiday_map.keys()]
      .filter(date_key => {
        const [year, month, date] = date_key.split('/')
        return year == target_year && month == target_month
      })
      .map(date_key => {
        const mapData = holiday_map.get(date_key)
        return [date_key, mapData]
      })

    return new Map(in_range_holidays)
  }

  // 月末の日を取得
  #getEndDayOfMonth = (date) => {
    // 安全な月末の取得：年・月を明示して new Date(year, month+1, 0) とする
    const y = date.getFullYear()
    const m = date.getMonth()
    return new Date(y, m + 1, 0)
  }

  // 月初の日を取得
  #getStartDayOfMonth = (year, month) => {
    // 安全に年月日を指定して生成（month は 0-based）
    return new Date(Number(year), Number(month), 1)
  }

  // 埋め字
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

  // カレンダー作る！
  #generateCalendar = async (_year = null, _month = null, is_holiday_data_refresh = false) => {
    if (_year === null) {
      _year = (new Date()).getFullYear()
    }
    const target_year = Number(_year)
    if (_month === null) {
      _month = (new Date()).getMonth()
    } else {
      _month = Number(_month) - 1
    }
    const target_month = {
      code: Number(_month),
      text: Number(_month) + 1
    }
    const holiday_map = await this.#getHolidayMap(target_year, target_month.text, is_holiday_data_refresh)

    const today = new Date()
    const start_date = this.#getStartDayOfMonth(target_year, target_month.code)
    // 月初日に合わせる
    const weekdays_list = ['日', '月', '火', '水', '木', '金', '土']

    const days_in_month = this.#getEndDayOfMonth(start_date).getDate()
    // それぞれが日付としての数値を持つ配列
    const month_day_numbers = Array(days_in_month).fill(0).map((_, i) => i + 1)
    // 1日までの曜日のセルは空白
    const empty_cells = Array(start_date.getDay()).fill(`  `)
    const combined = [
      ...empty_cells,
      ...month_day_numbers,
    ]
    // 週ごとに分割された日付数値配列
    const trimed_day_by_weeks = this.#sliceByNumber(combined, 7)
    const contents = [
      `　　  ${target_year}年${target_month.text}月  　　`,
      weekdays_list.join(' '),
      ...trimed_day_by_weeks
        .map(this_week_days => {
          return this_week_days
            .map((day_number, _i) => {
              // 桁違いによる文字数を揃える
              const day_string = this.#dateEngraving(day_number)
              // isToday
              if (
                day_number === today.getDate() &&
                target_month.code === today.getMonth() &&
                target_year === today.getFullYear()
              ) {
                return chalk.yellowBright(day_string)
              }
              // isSunday
              if (_i === 0) return chalk.redBright(day_string)
              // isSaturday
              if (_i === 6) return chalk.blueBright(day_string)
              // isHoliday
              if (holiday_map.has(`${target_year}/${target_month.text}/${day_number}`)) {
                return chalk.redBright(day_string)
              }
              return day_string
            })
            .join(' ')
        })
    ]

    return {
      lines: contents,
      outPutString: contents.join('\n'),
    }
  }

  // コンソールに出力
  output = async () => {
    const calendar = await this.#generateCalendar(this.#year, this.#month, this.#is_holiday_data_refresh)
    console.log(calendar.outPutString)
  }
}
