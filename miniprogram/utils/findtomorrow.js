const last_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function findtomorrow(date) {
  var year = date.year
  var month = date.month
  var day = date.day

  var new_year = year
  var new_month = month
  var new_day = day

  if(year % 4 == 0 && month == 2) {
    if(day == 28) {
      return { "year": new_year, "month": new_month, "day": 29}
    }
    if(day == 29) {
      return { "year": new_year, "month": 3, "day": 1 }
    }
  }

  if (day == last_day[month - 1]) {
    new_month = nextMonth(month)

    if (new_month == 1) {
      new_year = year + 1
    }
  
    new_day = 1
  
  } else {
    new_day = new_day + 1
  }

  var tom = { "year": new_year, "month": new_month, "day": new_day }

  return tom
}

function newMonth(m) {
  var new_month = m

  if (m == 12) {
    new_month = 1
  } else {
    new_month = new_month + 1
  }

  return new_month
}

module.exports = {
  findtomorrow: findtomorrow
}