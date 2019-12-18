const last_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function findyesterday(date) {
  var year = date.year
  var month = date.month
  var day = date.day

  var new_year = year
  var new_month = month
  var new_day = day

  if(day == 1) {
    new_month = previousMonth(month)

    if(new_month == 12) {
      new_year = year - 1
    }

    if(new_year % 4 == 0 && new_month == 2) {
      new_day = 29
    } else {
      new_day = last_day[new_month - 1]
    }
  } else {
    new_day = new_day - 1
  }

  var yes = {"year": new_year, "month": new_month, "day": new_day}

  return yes
}

function previousMonth(m) {
  var new_month = m

  if(m == 1) {
    new_month = 12
  } else {
    new_month = new_month - 1
  }

  return new_month
}

module.exports = {
  findyesterday: findyesterday
}