function dateInArray(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  var time = {"year": year, "month": month, "day": day,
   "hour": hour, "minute": minute, "second": second}

  return time
}

module.exports = {
  dateInArray: dateInArray
}