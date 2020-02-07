const cloud = require('wx-server-sdk')

const last_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const db_sale = 'sale'
const collection_sale = db.collection(db_sale)
const db_daily_usage = 'daily_usage'
const collection_daily_usage = db.collection(db_daily_usage)

exports.main = async (event, context) => {
    try {
        // get yesterday sale data
        var yesterday = dateInformat(getYesterday(dateInArray(new Date())))
        var yesterday_sale_result = await collection_sale.where({ sale_date: yesterday }).get()

        var yesterday_sale = 0
        if (yesterday_sale_result.data.length == 0) {
            console.log('No sale data of yesterday: ', yesterday)
        } else {
            yesterday_sale = yesterday_sale_result.data[0].sale_value
            console.log('Get yesterday ', yesterday, ' sale data: ', yesterday_sale_result.data[0].sale_value)
        }

        // get today sale data
        var today = dateInformat(dateInArray(new Date()))
        var today_sale_result = await collection_sale.where({ sale_date: today }).get()

        var today_sale = 0
        if (today_sale_result.data.length == 0) {
            console.log('No sale data of today: ', today)
        } else {
            today_sale = today_sale_result.data[0].sale_value
            console.log('Get today ', today, ' sale data: ', today_sale_result.data[0].sale_value)
        }

        // get yesterday usage data
        var yesterday_usage = {}
        var yesterday_usage_result = await collection_daily_usage.where({ date: yesterday }).get()
        for (var i in yesterday_usage_result.data) {
            yesterday_usage[yesterday_usage_result.data[i].item_id] = yesterday_usage_result.data[i]
        }
        console.log('Get yesterday usage: ', yesterday_usage)

        var item = event.item

        if (yesterday_sale == 0 || today_sale == 0) {
            for (var i in item) {
                for (var j in item[i]) {
                    item[i][j]['prediction_value'] = item[i][j].base_number

                    var after_refill = item[i][j].prediction_value + item[i][j].stock_value

                    if (after_refill > item[i][j].max_capacity) {
                        var new_prediction = item[i][j].max_capacity - item[i][j].stock_value
                        item[i][j]['prediction_value'] = new_prediction
                    }
                }
            }
        } else {
            var ratio = today_sale / yesterday_sale

            for (var i in item) {
                for (var j in item[i]) {
                    var today_prediction = item[i][j].base_number

                    if (typeof (yesterday_usage[item[i][j]._id]) != 'undefined') {
                        today_prediction = yesterday_usage[item[i][j]._id].item_usage * ratio
                        today_prediction = Math.ceil(today_prediction)
                    }

                    item[i][j]['prediction_value'] = today_prediction

                    var after_refill = item[i][j].prediction_value + item[i][j].stock_value

                    if (after_refill > item[i][j].max_capacity) {
                        var new_prediction = item[i][j].max_capacity - item[i][j].stock_value
                        item[i][j]['prediction_value'] = new_prediction
                    }
                }
            }
        }

        console.log('Finish prediction of today', item)

        return item

    } catch (e) {
        console.log(e)
        return e
    }
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

function getYesterdaySale() {
    //return new Promise((resolve, reject) => {
    var yesterday = dateInformat(getYesterday(dateInArray(new Date())))

    db.collection(db_sale)
        .where({
            sale_date: yesterday
        })
        .get({
            success: res => {
                var yesterday_sale = 0
                if (res.data.length == 0) {
                    console.log('No sale data of yesterday: ', yesterday)
                } else {
                    yesterday_sale = res.data[0].sale_value
                    console.log('Get yesterday ', yesterday, ' sale data: ', res.data[0].sale_value)
                }
                //resolve(yesterday_sale)
            },
            fail: err => {
                console.error('Failed to search yesterday sale data', err)
                //reject(0)
            }
        })
    //})
}
