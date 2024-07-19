import { ConsoleCalendar } from "./src/consoleCalendar.js";

const [_engine, _process, ...args] = process.argv;
const [year, month] = args
const calendar = new ConsoleCalendar(year, month)
calendar.output()
