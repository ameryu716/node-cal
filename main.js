import { ConsoleCalendar } from "./src/consoleCalendar.js";

const [_engine, _process, ...args] = process.argv;
const [year, month, is_holiday_data_refresh] = args
const calendar = new ConsoleCalendar(year, month, Boolean(is_holiday_data_refresh))
calendar.output()
