const date = require('../../../utils/date.js')

const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection of users
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_info = 'info' // the collection of info
const db_useage = { 'daily': 'daily_useage', 'weekly': 'weekly_useage', 'monthly': 'monthly_useage' } // the collections of useage


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

        setInventory(this)
    },

    /**
     * When tap the tab title to switch page
     */
    switchNav: function (e) {
        var page = this;
        var id = parseInt(e.target.id);
        if (this.data.currentTab == id) {
            return false;
        } else {
            page.setData({ currentTab: id });
        }
        page.setData({ flag: id });
    },

    /**
     * When swipe the page to switch
     */
    swiperChanged: function (e) {
        console.log('Switch navigation to: ', e.detail.current)
        if (this.data.currentTab != e.detail.current) {
            this.setData({
                currentTab: e.detail.current,
                flag: e.detail.current
            })
        }
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
 * Set all the categories and items data in the inventory.
 * 
 * @method setInventory
 * @param{Page} page The page
 */
async function setInventory(page) {
    var categories = await getCategory()
    for (var c in categories) {
        categories[c]['nav_order'] = parseInt(c)
    }

    page.setData({
        category: categories
    })
    console.log('Get all the categories: ', page.data.category)

    var items = await getItem(page, categories)

    page.setData({
        item: items
    })

    wx.hideLoading()
}


/**
 * Get all the categories in the database.
 * 
 * @method getCategory
 */
function getCategory() {
    return new Promise((resolve, reject) => {
        db.collection(db_category)
            .field({
                _id: true,
                category_order: true,
                category_name: true,
                item_amount: true
            })
            .orderBy('category_order', 'asc')
            .get({
                success: res => {
                    resolve(res.data)
                },
                fail: err => {
                    console.error('Failed to get categories from database', err)
                    reject()
                }
            })
    })
}


/**
 * Get all the items in the database.
 * 
 * @method getItem
 * @param{Object} categories All the categories
 */
function getItem(page, categories) {
    return new Promise((resolve, reject) => {
        var total_category = categories.length
        var curr_category = 0
        var t = {}

        var height = 200
        var sum = 0

        for (var i in categories) {
            db.collection(db_item)
                .where({
                    category_id: categories[i]._id
                })
                .orderBy('item_order', 'asc')
                .get({
                    success: res => {
                        curr_category = curr_category + 1
                        console.log('Get items ', curr_category, '/', total_category)

                        if (res.data.length != 0) {
                            var category_order = 0
                            for (var j in categories) {
                                if (categories[j]._id == res.data[0].category_id) {
                                    category_order = categories[j].category_order
                                }
                            }
                            t[category_order] = res.data

                            if (res.data.length > sum) {
                                sum = res.data.length
                            }
                        }

                        if (curr_category == total_category) {
                            height = height + sum * 150

                            if (page.data.h < height) {
                                page.setData({
                                    h: height
                                })
                            }

                            console.log('Get all the items: ', t)
                            resolve(t)
                        }
                    },
                    fail: err => {
                        console.error('Failed to search items', err)
                        reject()
                    }
                })
        }
    })
}


/**
 * Calculate the useage. Find the right date for the useage upload. Upload the data.
 * 
 * @method confirmUseage
 */
async function confirmUseage(page, e) {
    // double check the check_left value in the database
    var check_left = await getCheckLeft()

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
        
        console.log('Useage: ')
        // calculate the useage data
        var useage = getUseage(stock, e.detail.value)
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

        // after uploading all the result, update the check_left value
        if(update_result) {
            //await updateCheckLeft()
        }

        sendCheckLeftMessage(today, useage)

        navigateBackLevel()

    } else {
        navigateBackLevel()
    }
}

/**
 * Get whether the left in the inventory has been checked.
 * 
 * @method getCheckLeft
 */
function getCheckLeft() {
    return new Promise((resolve, reject) => {
        db.collection(db_info)
            .field({
                check_left: true
            })
            .get({
                success: res => {
                    resolve(res.data[0].check_left)
                },
                fail: err => {
                    console.error('Failed to get check_left from database', err)
                    reject()
                }
            })
    })
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
        if (today_left[i] == "") {
            today_left[i] = stock[i].stock_value
        }
        else {
            today_left[i] = parseInt(today_left[i])
        }

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

        // for daily, weekly and monthly collection
        for(var i in target_date) {
            console.log('Start to update to ', i, ' usage on: ', target_date[i])

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

                    if (new_useage > 0) {
                        // if the useage data needs to update
                        var update_useage_data = {}
                        update_useage_data['item_useage'] = existed_useage + new_useage

                        // update the existed record with a new useage data
                        wx.cloud.callFunction({
                            name: 'dbChangeUser',
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
                                    resolve(true)
                                }
                            },
                            fail: err => {
                                // if get a failed result
                                console.error('Failed to use cloud function dbChangeUser()', err)
                                reject(false)
                            }
                        })
                    } else {
                        // if the useage data did not changed
                        curr_update = curr_update + 1
                        console.log('Update useage ', curr_update, '/', total_update)

                        if (curr_update == total_update) {
                            resolve(true)
                        }
                    }

                } else {
                    // if there is no record in the collection with the target date
                    var add_useage_data = {}
                    add_useage_data['item_id'] = k
                    add_useage_data['date'] = target_date[i]
                    add_useage_data['item_useage'] = useage[k]

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
                                resolve(true)
                            }
                        },
                        fail: err => {
                            // if get a failed result
                            console.error('Failed to use cloud function dbAdd()', err)
                            reject(false)
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
            name: 'dbChangeUser',
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
                console.error('Failed to use cloud function dbChangeUser()', err)
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

    var message = '余量统计完成\n'
    message = message + '统计人: ' + app.globalData.true_name

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
                            name: 'sendMessage',
                            data: {
                                openid: user_res.data[u].user_openid,
                                time: time,
                                detail: message
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


/**
 * Hide the loading. Show users a success message, then navigate them back to the previous page.
 * 
 * @method navigateBackLevel
 */
function navigateBackLevel() {
    wx.hideLoading()

    wx.showToast({
        title: '上传成功',
        duration: 1500,
        complete: function (res) {
            setTimeout(function () {
                wx.navigateBack()
            }, 1500)
        }
    })
}
