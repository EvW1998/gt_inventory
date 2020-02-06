const date = require('../../../utils/date.js')
const inventory = require('../../../utils/inventory.js')
const pAction = require('../../../utils/pageAction.js')

const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection of users
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_info = 'info' // the collection of info
const db_useage = { 'daily': 'daily_useage', 'weekly': 'weekly_useage', 'monthly': 'monthly_useage' } // the collections of useage
const db_left_log = 'left_log' // the collection of left logs

Page({
    data: {
        currentTab: 0, // the current tab for show
        flag: 0, // the tab title to be bloded
        category: {}, // the categories in the inventory
        item: {}, // the items in the inventory
        h: 1200, // the height for the page
        useage: {} // the useage for the day
    },

    /***
     *   When loading the page
     */
    onLoad: function () {

    },

    /***
     *   When show the default page, set all inventory data
     */
    onShow: function () {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        inventory.setInventory(this, 'left')
    },

    /**
     * When tap the tab title to switch page
     */
    switchNav: function (e) {
        pAction.switchNav(this, e)
    },

    /**
     * When swipe the page to switch
     */
    swiperChanged: function (e) {
        pAction.swiperChanged(this, e)
    },

    /**
     * When the form of check left is filled, and the confirm button is tapped
     * 
     * @method formSubmit
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        // confirm and upload the useage data
        confirmUseage(this, e)
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
 * Calculate the useage. Find the right date for the useage upload. Upload the data.
 * 
 * @method confirmUseage
 */
async function confirmUseage(page, e) {
    // double check the check_left value in the database
    var check_left = await inventory.getCheckLeft()

    if(!check_left) {
        // if no one has done the check before
        var stock = {}
        var item = page.data.item
        // reorganize the stock data
        for (var i in item) {
            for (var j in item[i]) {
                stock[item[i][j]._id] = item[i][j]
            }
        }

        var today_left = formatedTodayLeft(stock, e.detail.value)

        console.log('Useage: ')
        // calculate the useage data
        var useage = getUseage(stock, today_left)
        page.setData({
            useage: useage
        })

        var today = new Date()
        // find target date to record useage
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
        var daily_record = await getExistedUseage(target_daily_date, 'daily')
        var weekly_record = await getExistedUseage(target_weekly_date, 'weekly')
        var montly_record = await getExistedUseage(target_monthly_date, 'monthly')

        // update all the record
        var target_all_date = {}
        target_all_date['daily'] = target_daily_date
        target_all_date['weekly'] = target_weekly_date
        target_all_date['monthly'] = target_monthly_date

        var all_record = {}
        all_record['daily'] = daily_record
        all_record['weekly'] = weekly_record
        all_record['monthly'] = montly_record
 
        var update_result = await updateAllUseage(useage, all_record, target_all_date)
        console.log('Finish update all useage')

        await updateItem(today_left, useage)
        await updateLeftLog(today_left, update_result, stock, today)
        await inventory.updateCheckLeft(true)
        
        sendCheckLeftMessage(today, useage)

        pAction.navigateBackUser('上传成功', 1)

    } else {
        pAction.navigateBackUser('上传成功', 1)
    }
}


/**
 * Format today left value from string to number.
 * 
 * @method formatedTodayLeft
 * @param{Object} stock The stock value
 * @param{Object} today_left The left value without formated
 * @return{Object} The formated today left value
 */
function formatedTodayLeft(stock, today_left) {
    var formated_today_left = today_left
    for (var i in formated_today_left) {
        if (formated_today_left[i] == "") {
            formated_today_left[i] = stock[i].stock_value
        }
        else {
            formated_today_left[i] = parseInt(formated_today_left[i])
        }
    }

    return formated_today_left
}


/**
 * Return the useage value base on the stock value in the db and the left value user entered.
 * 
 * @method getUseage
 * @param{Object} stock the reorganize stock data
 * @param{Object} today_left the left value user entered
 * @return{Object} the useage data
 */
function getUseage(stock, today_left) {
    var useage = {}

    for (var i in today_left) {
        useage[i] = stock[i].stock_value - today_left[i]
        console.log(stock[i].item_name, ' Useage ', useage[i], ' = stock ', stock[i].stock_value, ' - today left ', today_left[i])
    }

    return useage
}


/**
 * Return the existed useage data in the db, with targeted date and collection.
 * 
 * @method getExistedUseage
 * @param{String} target_date The target date to search in the db, in year-month-date
 * @param{String} useage_type The type of the useage collection to search in the db, in daily, weekly or monthly
 * @return{Promise} The search result in the target collection
 */
function getExistedUseage(target_date, useage_type) {
    return new Promise((resolve, reject) => {
        db.collection(db_useage[useage_type])
            .where({
                date: target_date
            })
            .field({
                _id: true,
                date: true,
                item_id: true,
                item_useage: true
            })
            .get({
                success: res => {
                    resolve(res.data)
                },
                fail: err => {
                    console.error('Failed to get weekly useage from database', err)
                    reject()
                }
            })
    })
}


/**
 * Update all the useage in daily, weekly and monthly collection with the given target date.
 * 
 * @method updateAllUseage
 * @param{Object} useage The useage data
 * @param{Object} record The existed record in daily, weekly and monthly collection with the given target date
 * @param{Object} target_date The target date for daily, weekly and monthly collection
 * @return{Promise} The state of the function
 */
function updateAllUseage(useage, record, target_date) {
    return new Promise((resolve, reject) => {
        var total_update = Object.keys(useage).length * 3
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

            // for each useage data in the form
            for (var k in useage) {
                if (k in formed_record) {
                    // if a record existed in the collection with the target date
                    var existed_useage = formed_record[k].item_useage
                    var new_useage = useage[k]

                    left_log[i]['detail'][k] = existed_useage + new_useage

                    if (new_useage > 0) {
                        // if the useage data needs to update
                        var update_useage_data = {}
                        update_useage_data['item_useage'] = existed_useage + new_useage

                        // update the existed record with a new useage data
                        wx.cloud.callFunction({
                            name: 'dbUpdate',
                            data: {
                                collection_name: db_useage[i],
                                update_data: update_useage_data,
                                uid: formed_record[k]._id
                            },
                            success: res => {
                                curr_update = curr_update + 1
                                console.log('Update useage ', curr_update, '/', total_update)

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
                        // if the useage data did not changed
                        curr_update = curr_update + 1
                        console.log('Update useage ', curr_update, '/', total_update)

                        if (curr_update == total_update) {
                            resolve(left_log)
                        }
                    }

                } else {
                    // if there is no record in the collection with the target date
                    var add_useage_data = {}
                    add_useage_data['item_id'] = k
                    add_useage_data['date'] = target_date[i]
                    add_useage_data['item_useage'] = useage[k]
                    add_useage_data['useage_type'] = db_useage[i]

                    left_log[i]['detail'][k] = useage[k]

                    // add a new record to the collection
                    wx.cloud.callFunction({
                        name: 'dbAdd',
                        data: {
                            collection_name: db_useage[i],
                            add_data: add_useage_data
                        },
                        success: res => {
                            curr_update = curr_update + 1
                            console.log('Add useage ', curr_update, '/', total_update)

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
 * Update the check_left value in the info collection
 * 
 * @method updateCheckLeft
 */
function updateCheckLeft() {
    return new Promise((resolve, reject) => {
        var update_info_data = {'check_left': true}

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_info,
                update_data: update_info_data,
                uid: app.globalData.info_id
            },
            success: res => {
                console.log('Update check left info success')
                resolve()
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbUpdate()', err)
                reject()
            }
        })
    })
}


/**
 * Update the stock value for items.
 * 
 * @method updateItem
 * @param{Object} today_left The formated today left value
 * @param{useage} useage The useage data
 * @return{Promise} The state of the function
 */
function updateItem(today_left, useage) {
    return new Promise((resolve, reject) => {
        var total_update = Object.keys(today_left).length
        var curr_update = 0

        for(var i in today_left) {
            if(useage[i] != 0) {
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
 * @method updateLeftLog
 * @param{Object} today_left The today left value
 * @param{Object} update_result The update result value
 * @param{Object} item The formated item value
 * @param{Date} today The date of today
 * @return{Promise} The state of the function
 */
function updateLeftLog(today_left, update_result, item, today) {
    return new Promise((resolve, reject) => {
        var stock_info = {}
        for(var i in today_left) {
            stock_info[i] = {}
            stock_info[i]['item_name'] = item[i].item_name
            stock_info[i]['stock_value'] = today_left[i]
        }

        var useage_info = {}
        for(var i in update_result) {
            useage_info[i] = {}
            useage_info[i]['date'] = update_result[i]['date']
            useage_info[i]['detail'] = {}

            for(var j in update_result[i]['detail']) {
                useage_info[i]['detail'][j] = {}
                useage_info[i]['detail'][j]['item_name'] = item[j].item_name
                useage_info[i]['detail'][j]['useage'] = update_result[i]['detail'][j]
            }
        }

        var log_info = {}
        log_info['stock'] = stock_info
        log_info['useage'] = useage_info

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
 */
function sendCheckLeftMessage(today, useage) {
    var time = date.formatTime(today)
    var total_amount = 0
    var not_checked_amount = 0

    for(var i in useage) {
        total_amount = total_amount + 1

        if(useage[i] == 0) {
            not_checked_amount = not_checked_amount + 1
        }
    }

    for(var i = 2; i < 4; i++) {
        console.log('Send confirm left message to uses with permission level: ', i)
        
        db.collection(db_user)
            .where({
                permission_level: i
            })
            .get({
                success: user_res => {
                    for (var u in user_res.data) {
                        console.log('Send confirm left message to: ', user_res.data[u].true_name)
                        wx.cloud.callFunction({
                            name: 'sendCheckMessage',
                            data: {
                                openid: user_res.data[u].user_openid,
                                time: time,
                                user: app.globalData.true_name,
                                normal_amount: total_amount - not_checked_amount,
                                unfilled_amount: not_checked_amount,
                                comment: '具体信息请查看余量确认记录'
                            },
                            success: res => {
                    
                            },
                            fail: err => {
                                // if get a failed result
                                console.error('failed to use cloud function sendMessage()', err)
                            }
                        })
                    }
                },
                fail: user_err => {
                    // if get a failed result
                    console.error('failed to search users in the collection', user_err)
                }
            })
    }
}
