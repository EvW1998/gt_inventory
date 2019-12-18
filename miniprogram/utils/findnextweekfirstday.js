var util = require('findweekday.js')
var util1 = require('findtomorrow.js')

function findnextweekfirstday(date) {
  var year = date.year
  var month = date.month
  var day = date.day
  var weekday = util.findweekday(date)
  var tomrr = date

  do {
    tomrr = util1.findtomorrow(tomrr)
    weekday = weekday + 1

  } while (weekday != 8)

  return tomrr
}



module.exports = {
  findnextweekfirstday: findnextweekfirstday
}