const last_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function findweekday(date) {
  var startweekday = 2
  var year = date.year
  var month = date.month
  var day = date.day

  var daycount = daytobegin(date) + startweekday
  var weekday = daycount % 7
  if(weekday == 0) {
    weekday = 7
  }

  return weekday
}

function daytobegin(date) {
  var count = 0
  var year = date.year
  var month = date.month
  var day = date.day

  count = count + day - 1

  for(var i = 1; i < month; i++) {
    count = count + last_day[i]
  }

  if(year % 4 == 0 && month > 2) {
    count = count + 1
  }

  for(var i = 2019; i < 2019; i++) {
    count = count + 365

    if(i % 4 == 0) {
      count = count + 1
    }
  }

  return count
}


module.exports = {
  findweekday: findweekday
}