/**
 * The page to check the amount that every item is left in the inventory.
 * After the amount is checked, the usage records will be update to the database.
 * Managers of this app will receive a message about this checking.
 */
const date = require('../../../utils/date.js') // require the util of date
const inventory = require('../../../utils/inventory.js') // require the util of inventory
const pAction = require('../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection of users
const db_item = 'item' // the collection of items
const db_usage = { 'daily': 'daily_usage', 'weekly': 'weekly_usage', 'monthly': 'monthly_usage' } // the collections of usage
const db_left_log = 'left_log' // the collection of left logs


Page({
    data: {
        currentTab: 0, // the current tab for show
        flag: 0, // the tab title to be bloded
        category: {}, // the categories in the inventory
        category_amount: 0, // the amount of categories
        item: {}, // the items in the inventory
        item_amount: 0, // the amount of items
        h: 1200, // the height for the page
        usage: {} // the usage for the day
    },

    /***
     * When loading the page
     */
    onLoad: function () {

    },

    /***
     * When show the default page, set all inventory data
     */
    onShow: function () {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        // set the inventory data as the check left page
        inventory.setInventory(this, 'left')
    },

    /**
     * Tap the tab title to switch pages.
     * 
     * @method switchNav
     * @param{Object} e The data from the page tapping
     */
    switchNav: function (e) {
        pAction.switchNav(this, e)
    },

    /**
     * Swipe the page to switch pages.
     * 
     * @method swiperChanged
     * @param{Object} e The data from the page swiping
     */
    swiperChanged: function (e) {
        pAction.swiperChanged(this, e)
    },

    /**
     * When the confirm button is tapped, confirm and upload the usage data
     * 
     * @method formSubmit
     * @param{Object} e The data from the form submiting
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        // confirm and upload the usage data
        confirmUsage(this, e)
    },

    /**
     * When the user wants to share this miniapp
     */
    onShareAppMessage: function () {
        return {
            title: 'GT库存',
            desc: '国泰餐厅库存管理程序',
            path: 'pages/inventory/inventoryUpdate/inventoryUpdate'
        }
    }
})


/**
 * Calculate the usage. Find the right date for the usage upload.
 * Upload the usage records. Upload the left log for this action.
 * Send messages to all users who has high enough permission level.
 * 
 * @method confirmUsage
 * @param{Page} page The page
 * @param{Object} e The data from the form submiting
 */
async function confirmUsage(page, e) {
    // double check the check_left value in the database
    var check_left = await inventory.getCheckLeft()

    if(!check_left) {
        // if no one has done the check before
        var stock = {}
        var item = page.data.item
        // reformat the stock data
        for (var i in item) {
            for (var j in item[i]) {
                stock[item[i][j]._id] = item[i][j]
            }
        }

        // reformat the user input, change string to number
        var today_left_result = formatTodayLeft(stock, e.detail.value)
        var today_left = today_left_result.result
        if(!today_left_result.legal) {
            console.log('User input illegal')
            wx.hideLoading()
            wx.showToast({
                title: '输入错误',
                icon: 'none'
            })
        } else {
            console.log('Usage: ')
            // calculate the usage data
            var usage = getUsage(stock, today_left)
            page.setData({
                usage: usage
            })

            var today = new Date()
            // find target date to record usage
            var target_daily_date = date.dateInformat(date.dateInArray(today))
            var target_weekly_date = date.dateInformat(date.getThisWeek(today))
            var target_monthly_date = date.dateInformat(date.getThisMonth(date.dateInArray(today)))

            if (today.getHours() < 8) {
                target_daily_date = date.dateInformat(date.getYesterday(date.dateInArray(today)))

                if (today.getDay() == 1) {
                    var y_w = date.dateInformat(date.getYesterday(date.dateInArray(new Date(target_weekly_date))))
                    target_weekly_date = date.dateInformat(date.getThisWeek(new Date(y_w)))
                }

                if (today.getDate() == 1) {
                    var y_m = date.dateInformat(date.getYesterday(date.dateInArray(new Date(target_monthly_date))))
                    target_monthly_date = date.dateInformat(date.getThisMonth(date.dateInArray(new Date(y_m))))
                }
            }

            // get all the existed record for the date
            var daily_record = await getExistedUsage(target_daily_date, 'daily')
            var weekly_record = await getExistedUsage(target_weekly_date, 'weekly')
            var montly_record = await getExistedUsage(target_monthly_date, 'monthly')

            // update all the record
            var target_all_date = {}
            target_all_date['daily'] = target_daily_date
            target_all_date['weekly'] = target_weekly_date
            target_all_date['monthly'] = target_monthly_date

            var all_record = {}
            all_record['daily'] = daily_record
            all_record['weekly'] = weekly_record
            all_record['monthly'] = montly_record

            var update_result = await updateAllUsage(usage, all_record, target_all_date)
            console.log('Finish update all usage')

            await updateItem(today_left, usage)

            // Add a new left log to the collection
            await addLeftLog(today_left, update_result, stock, today)
            // update the check_left state
            await inventory.updateCheckLeft(true)
            // send messages
            sendCheckLeftMessage(today, usage)
            // navigate the user back to the previous page
            pAction.navigateBackUser('上传成功', 1)
        }
    } else {
        // navigate the user back to the previous page
        pAction.navigateBackUser('上传成功', 1)
    }
}


/**
 * Format today left value from string to number.
 * 
 * @method formatTodayLeft
 * @param{Object} stock The stock value
 * @param{Object} today_left The left value without formated
 * @return{Object} The formated today left value and whether the input is legal
 */
function formatTodayLeft(stock, today_left) {
    var formated_today_left = today_left
    var legal_input = true
    var format_result = {}

    for (var i in formated_today_left) {
        if (formated_today_left[i] == "") {
            formated_today_left[i] = stock[i].stock_value
        } else {
            formated_today_left[i] = parseFloat(formated_today_left[i])

            if (isNaN(formated_today_left[i]) || formated_today_left[i] > stock[i].stock_value) {
                formated_today_left[i] = stock[i].stock_value
                legal_input = false
            } else if (formated_today_left[i] < 0) {
                formated_today_left[i] = 0
                legal_input = false
            }
        }
    }

    format_result['legal'] = legal_input
    format_result['result'] = formated_today_left

    return format_result
}


/**
 * Return the usage value base on the stock value in the db and the left value user entered.
 * 
 * @method getUsage
 * @param{Object} stock the reformated stock data
 * @param{Object} today_left the left value user entered
 * @return{Object} the usage data
 */
function getUsage(stock, today_left) {
    var usage = {}

    for (var i in today_left) {
        usage[i] = stock[i].stock_value - today_left[i]
        console.log(stock[i].item_name, ' Usage ', usage[i], ' = stock ', stock[i].stock_value, ' - today left ', today_left[i])
    }

    return usage
}


/**
 * Return the existed usage data in the db, with targeted date and collection.
 * 
 * @method getExistedUsage
 * @param{String} target_date The target date to search in the db, in year-month-date
 * @param{String} usage_type The type of the usage collection to search in the db, in daily, weekly or monthly
 * @return{Promise} The search result in the target collection
 */
function getExistedUsage(target_date, usage_type) {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'dbGet',
            data: {
                collection_name: db_usage[usage_type],
                collection_limit: 100,
                collection_field: {},
                collection_where: {
                    date: target_date
                },
                collection_orderby_key: 'date',
                collection_orderby_order: 'desc'
            },
            success: res => {
                resolve(res.result)
            },
            fail: err => {
                console.error('Failed to get usage from database', err)
                reject()
            }
        })
    })
}


/**
 * Update all the usage in daily, weekly and monthly collection with the given target date.
 * 
 * @method updateAllUsage
 * @param{Object} usage The usage data
 * @param{Object} record The existed record in daily, weekly and monthly collection with the given target date
 * @param{Object} target_date The target date for daily, weekly and monthly collection
 * @return{Promise} The state of the function
 */
function updateAllUsage(usage, record, target_date) {
    return new Promise((resolve, reject) => {
        var total_update = Object.keys(usage).length * 3
        var curr_update = 0

        var left_log = {}

        // for daily, weekly and monthly collection
        for(var i in target_date) {
            console.log('Start to update to ', i, ' usage on: ', target_date[i])
            left_log[i] = {}
            left_log[i]['date'] = target_date[i]
            left_log[i]['detail'] = {}

            // reorganize the record data under the current collection
            var formed_record = {}

            for (var j in record[i]) {
                formed_record[record[i][j].item_id] = record[i][j]
            }

            // for each usage data in the form
            for (var k in usage) {
                if (k in formed_record) {
                    // if a record existed in the collection with the target date
                    var existed_usage = formed_record[k].item_usage
                    var new_usage = usage[k]

                    left_log[i]['detail'][k] = existed_usage + new_usage

                    if (new_usage > 0) {
                        // if the usage data needs to update
                        var update_usage_data = {}
                        update_usage_data['item_usage'] = existed_usage + new_usage

                        // update the existed record with a new usage data
                        wx.cloud.callFunction({
                            name: 'dbUpdate',
                            data: {
                                collection_name: db_usage[i],
                                update_data: update_usage_data,
                                uid: formed_record[k]._id
                            },
                            success: res => {
                                curr_update = curr_update + 1
                                console.log('Update usage ', curr_update, '/', total_update)

                                if (curr_update == total_update) {
                                    // if all the updates have been done
                                    resolve(left_log)
                                }
                            },
                            fail: err => {
                                // if get a failed result
                                console.error('Failed to use cloud function dbUpdate()', err)
                                reject(left_log)
                            }
                        })
                    } else {
                        // if the usage data did not changed
                        curr_update = curr_update + 1
                        console.log('Update usage ', curr_update, '/', total_update)

                        if (curr_update == total_update) {
                            resolve(left_log)
                        }
                    }

                } else {
                    // if there is no record in the collection with the target date
                    var add_usage_data = {}
                    add_usage_data['item_id'] = k
                    add_usage_data['date'] = target_date[i]
                    add_usage_data['item_usage'] = usage[k]
                    add_usage_data['usage_type'] = db_usage[i]

                    left_log[i]['detail'][k] = usage[k]

                    // add a new record to the collection
                    wx.cloud.callFunction({
                        name: 'dbAdd',
                        data: {
                            collection_name: db_usage[i],
                            add_data: add_usage_data
                        },
                        success: res => {
                            curr_update = curr_update + 1
                            console.log('Add usage ', curr_update, '/', total_update)

                            if (curr_update == total_update) {
                                // if all the updates have been done
                                resolve(left_log)
                            }
                        },
                        fail: err => {
                            // if get a failed result
                            console.error('Failed to use cloud function dbAdd()', err)
                            reject(left_log)
                        }
                    })
                }
            }
        }
    })
}


/**
 * Update the stock value for items.
 * 
 * @method updateItem
 * @param{Object} today_left The formated today left value
 * @param{usage} usage The usage data
 * @return{Promise} The state of the function
 */
function updateItem(today_left, usage) {
    return new Promise((resolve, reject) => {
        var total_update = Object.keys(today_left).length
        var curr_update = 0

        for(var i in today_left) {
            if(usage[i] != 0) {
                // if the stock value changed
                var update_item_data = {}
                update_item_data['stock_value'] = today_left[i]

                wx.cloud.callFunction({
                    name: 'dbUpdate',
                    data: {
                        collection_name: db_item,
                        update_data: update_item_data,
                        uid: i
                    },
                    success: res => {
                        curr_update = curr_update + 1
                        console.log('Update stock value ', curr_update, '/', total_update)

                        if (curr_update == total_update) {
                            // if all the updates have been done
                            resolve()
                        }
                    },
                    fail: err => {
                        // if get a failed result
                        console.error('Failed to use cloud function dbUpdate()', err)
                        reject()
                    }
                })
            } else {
                curr_update = curr_update + 1
                console.log('Update stock value ', curr_update, '/', total_update)

                if (curr_update == total_update) {
                    // if all the updates have been done
                    resolve()
                }
            }
        }
    })
}


/**
 * Update the check left to a log collection.
 * 
 * @method addLeftLog
 * @param{Object} today_left The today left value
 * @param{Object} update_result The update result value
 * @param{Object} item The formated item value
 * @param{Date} today The date of today
 * @return{Promise} The state of the function
 */
function addLeftLog(today_left, update_result, item, today) {
    return new Promise((resolve, reject) => {
        var stock_info = {}
        for(var i in today_left) {
            stock_info[i] = {}
            stock_info[i]['item_name'] = item[i].item_name
            stock_info[i]['stock_value'] = today_left[i]
        }

        var usage_info = {}
        for(var i in update_result) {
            usage_info[i] = {}
            usage_info[i]['date'] = update_result[i]['date']
            usage_info[i]['detail'] = {}

            for(var j in update_result[i]['detail']) {
                usage_info[i]['detail'][j] = {}
                usage_info[i]['detail'][j]['item_name'] = item[j].item_name
                usage_info[i]['detail'][j]['usage'] = update_result[i]['detail'][j]
            }
        }

        var log_info = {}
        log_info['stock'] = stock_info
        log_info['usage'] = usage_info

        var add_log_data = {}
        add_log_data['date'] = date.formatTime(today)
        add_log_data['user_uid'] = app.globalData.uid
        add_log_data['user_true_name'] = app.globalData.true_name
        add_log_data['log_info'] = log_info

        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_left_log,
                add_data: add_log_data
            },
            success: res => {
                // return the result if successed
                console.log('Add a new check left log')
                resolve()
            },
            fail: err => {
                // if failed to use cloud function dbAdd
                console.error('Failed to use cloud function dbAdd()', err)
                reject()
            }
        })
    })
}


/**
 * Send the confrim left message to all the user with permission level higher than 2.
 * 
 * @method sendCheckLeftMessage
 * @param{Date} today Date of today
 * @param{Object} usage The usage record
 */
function sendCheckLeftMessage(today, usage) {
    var time = date.formatTime(today)
    var total_amount = 0
    var not_checked_amount = 0

    for(var i in usage) {
        total_amount = total_amount + 1

        if(usage[i] == 0) {
            not_checked_amount = not_checked_amount + 1
        }
    }

    console.log('Send confirm left message to uses with permission level greater than 1')

    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_user,
            collection_limit: 100,
            collection_field: {},
            collection_gt: true,
            collection_where_key: 'permission_level',
            collection_gt_value: 1,
            collection_orderby_key: 'permission_level',
            collection_orderby_order: 'desc'
        },
        success: user_res => {
            for (var u in user_res.result) {
                console.log('Send confirm left message to: ', user_res.result[u].true_name)
                wx.cloud.callFunction({
                    name: 'sendCheckMessage',
                    data: {
                        openid: user_res.result[u].user_openid,
                        time: time,
                        user: app.globalData.true_name,
                        normal_amount: total_amount - not_checked_amount,
                        unfilled_amount: not_checked_amount,
                        comment: '具体信息请查看余量确认记录'
                    },
                    success: message_res => {

                    },
                    fail: message_err => {
                        // if get a failed result
                        console.error('failed to use cloud function sendCheckMessage()', message_err)
                    }
                })
            }
        },
        fail: user_err => {
            // if get a failed result
            console.error('Failed to search users in the collection', user_err)
        }
    })
}
