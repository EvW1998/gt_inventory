const last_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


/**
 * Return a formated date and time.
 * 
 * @method formatTime
 * @param{Date} date The date needs to be formated
 * @return{String} The formated date and time
 */
function formatTime(date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}


/**
 * Return a formated number.
 * 
 * @method formatNumber
 * @param{Number} n The number
 * @return{String} The formated number
 */
function formatNumber(n) {
    n = n.toString()
    // Add a 0 at the beginning, if the number only has one digit
    return n[1] ? n : '0' + n
}


/**
 * Return a formated date in an array.
 * 
 * @method dateInArray
 * @param{Date} date The date
 * @return{Object} An array has date info
 */
function dateInArray(date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()

    var time = {
        "year": year, "month": month, "day": day,
        "hour": hour, "minute": minute, "second": second
    }

    return time
}


/**
 * Return a formated date in a string.
 * 
 * @method dateInformat
 * @param{Object} date_in_array The date
 * @return{String} A string has date info
 */
function dateInformat(date_in_array) {
    var formated_month = date_in_array.month.toString()
    if (date_in_array.month < 10) {
        formated_month = '0' + formated_month
    }

    var formated_day = date_in_array.day.toString()
    if (date_in_array.day < 10) {
        formated_day = '0' + formated_day
    }

    var formated_date = date_in_array.year.toString() + '-' + formated_month + '-' + formated_day

    return formated_date
}


/**
 * Return the yesterday date in an array.
 * 
 * @method getYesterday
 * @param{Object} date_in_array The current date
 * @return{Object} An array with yesterday date
 */
function getYesterday(date_in_array) {
    var yesterday_year = date_in_array.year
    var yesterday_month = date_in_array.month
    var yesterday_day = date_in_array.day

    if (yesterday_day == 1) {
        yesterday_month = previousMonth(yesterday_month)

        if (yesterday_month == 12) {
            yesterday_year = yesterday_year - 1
        }

        if (yesterday_year % 4 == 0 && yesterday_month == 2) {
            yesterday_day = 29
        } else {
            yesterday_day = last_day[yesterday_month - 1]
        }
    } else {
        yesterday_day = yesterday_day - 1
    }

    var yesterday = { "year": yesterday_year, "month": yesterday_month, "day": yesterday_day }

    return yesterday
}


/**
 * Return the previous month.
 * 
 * @method previousMonth
 * @param{Number} month
 * @return{Number} The previous month
 */
function previousMonth(month) {
    var new_month = month

    if (month == 1) {
        new_month = 12
    } else {
        new_month = new_month - 1
    }

    return new_month
}


/**
 * Return the monday of this week of the date.
 * 
 * @method getThisWeek
 * @param{Date} The date
 * @return{Object} An array with the the monday of this week of the date
 */
function getThisWeek(date) {
    var weekday = date.getDay()

    if(weekday == 0) {
        weekday = 7
    }

    var this_week = dateInArray(date)

    while(weekday > 1) {
        this_week = getYesterday(this_week)
        weekday = weekday - 1
    }

    return this_week
}


/**
 * Return the first day of this month of the date.
 * 
 * @method getThisMonth
 * @param{Object} date_in_array The date in an array
 * @return{Object} An array of the first day of this month of the date
 */
function getThisMonth(date_in_array) {
    var this_month = date_in_array

    this_month.day = 1
    
    return this_month
}


module.exports = {
    formatTime: formatTime,
    dateInArray: dateInArray,
    dateInformat: dateInformat,
    getYesterday: getYesterday,
    getThisWeek: getThisWeek,
    getThisMonth: getThisMonth
}
