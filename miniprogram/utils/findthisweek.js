var util = require('findweekday.js')
var util1 = require('findyesterday.js')
const last_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


function findthisweek(date) {
  var year = date.year
  var month = date.month
  var day = date.day
  var today = {"year": year, "month": month, "day": day}
  var thisweek = {0: today}
  var weekday = util.findweekday(date)
  var daycount = 1

  while(weekday > 1) {
    thisweek[daycount] = util1.findyesterday(today)

    daycount = daycount + 1
    weekday = weekday - 1
    today = util1.findyesterday(today)
  }

  return thisweek
}

module.exports = {
  findthisweek: findthisweek
}