var util = require('findweekday.js')
var util1 = require('findyesterday.js')
var util2 = require('findthisweek.js')
const last_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function findlastweek(date) {
  var thisweek = util2.findthisweek(date)
  var firstday_thisweek = {}

  for(var i in thisweek) {
    firstday_thisweek = thisweek[i]
  }

  var lastday_lastweek = util1.findyesterday(firstday_thisweek)
  var lastweek = util2.findthisweek(lastday_lastweek)

  return lastweek
}

module.exports = {
  findlastweek: findlastweek
}