/**
 * The page to prediction the refill value and refill the inventory.
 * After the amount is entered, update the item stock in the database.
 * Managers of this app will receive a message about this refill.
 */
const date = require('../../../utils/date.js') // require the util of date
const inventory = require('../../../utils/inventory.js') // require the util of inventory
const pAction = require('../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection of users
const db_item = 'item' // the collection of items
const db_refill_log = 'refill_log' // the collection of refill logs


Page({
    data: {
        currentTab: 0, // the current tab for show
        flag: 0, // the tab title to be bloded
        category: {}, // the categories in the inventory
        category_amount: 0, // the amount of categories
        item: {}, // the items in the inventory
        item_amount: 0, // the amount of items
        h: 1200 // the height for the page
    },

    /***
     * When loading the page, set all inventory data
     */
    onLoad: function () {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        // set the inventory data as the refill page
        inventory.setInventory(this, 'refill')
    },

    /***
     * When show the default page
     */
    onShow: function () {
        
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
     * When the confirm button is tapped, confirm and upload the refill
     * 
     * @method formSubmit
     * @param{Object} e The data from the form submiting
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        // confirm and upload the refill data
        confirmRefill(this, e.detail.value)
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
 * Check whether the user input is legal.
 * Then update the item stock value. Add a new refill log.
 * Send messages to users with high enough permission level.
 * 
 * @method confirmRefill
 * @param{Page} page The page
 * @param{Object} user_input The user input of refilling
 */
async function confirmRefill(page, user_input) {
    var today = new Date()
    // double check the check_left value in the database
    var check_left = await inventory.getCheckLeft()

    if(check_left) {
        // if someone has done the check before
        var item = page.data.item
        var formated_item = {}
        for (var i in item) {
            for (var j in item[i]) {
                formated_item[item[i][j]._id] = item[i][j]
            }
        }

        var legal_input = true
        var formated_input = {}
        for (var i in user_input) {
            if (user_input[i] == "") {
                // if the input is empty
                formated_input[i] = 0
            } else {
                formated_input[i] = parseInt(user_input[i])

                if (isNaN(formated_input[i]) || formated_input[i] < 0) {
                    // if the input is not a number or the input smaller than 0
                    formated_input[i] = 0
                    legal_input = false
                } else if (formated_input[i] + formated_item[i].stock_value > formated_item[i].max_capacity) {
                    // if the input larger than the prediction value
                    formated_input[i] = formated_item[i].prediction_value
                    legal_input = false
                }
            }
        }

        if(!legal_input) {
            // if there is illegal input
            console.log('User input illegal')
            wx.hideLoading()
            wx.showToast({
                title: '输入错误',
                icon: 'none'
            })
        } else {
            var update_result = await updateItem(formated_input, formated_item)
            await addRefillLog(formated_input, formated_item, today)
            await inventory.updateCheckLeft(false)

            sendConfirmRefillMessage(today, update_result)

            pAction.navigateBackUser('上传成功', 1)
        }
    } else {
        pAction.navigateBackUser('上传成功', 1)
    }
}


/**
 * Update the stock value of each item with the user refill.
 * For items that refill is not equal to the prediction value, state of the item will be warning.
 * 
 * @method updateItem
 * @param{Object} refill The refill of items
 * @param{Object} item The formated item
 */
function updateItem(refill, item) {
    return new Promise((resolve, reject) => {
        var total_amount = 0
        var warning_amount = 0

        var total_update = Object.keys(refill).length
        var curr_update = 0

        for(var i in refill) {
            total_amount = total_amount + 1

            var update_item_data = {}
            if(refill[i] != 0) {
                update_item_data['stock_value'] = item[i].stock_value + refill[i]
            }
            if (refill[i] < item[i].prediction_value) {
                update_item_data['item_state'] = 1
                warning_amount = warning_amount + 1
            }

            if(Object.keys(update_item_data).length > 0) {
                wx.cloud.callFunction({
                    name: 'dbUpdate',
                    data: {
                        collection_name: db_item,
                        update_data: update_item_data,
                        uid: i
                    },
                    success: res => {
                        curr_update = curr_update + 1
                        console.log('Update item stock ', curr_update, '/', total_update)

                        if (curr_update == total_update) {
                            // if all the updates have been done
                            var update_result = {}
                            update_result['total'] = total_amount
                            update_result['warning'] = warning_amount
                            resolve(update_result)
                        }
                    },
                    fail: err => {
                        // if get a failed result
                        console.error('Failed to use cloud function dbUpdate()', err)
                        var update_result = {}
                        update_result['total'] = total_amount
                        update_result['warning'] = warning_amount
                        reject(update_result)
                    }
                })
            } else {
                curr_update = curr_update + 1
                console.log('Update item stock ', curr_update, '/', total_update)

                if (curr_update == total_update) {
                    // if all the updates have been done
                    var update_result = {}
                    update_result['total'] = total_amount
                    update_result['warning'] = warning_amount
                    resolve(update_result)
                }
            }
        }
    })
}


/**
 * Update the refill to a log collection.
 * 
 * @method addRefillLog
 * @param{Object} refill The refill
 * @param{Object} item The formated item
 * @param{Date} today The date of today
 * @return{Promise} The state of the function
 */
function addRefillLog(refill, item, today) {
    return new Promise((resolve, reject) => {
        var formated_stock = {}
        for(var i in item) {
            formated_stock[i] = {}
            formated_stock[i]['item_name'] = item[i].item_name
            formated_stock[i]['stock_value'] = item[i].stock_value + refill[i]
        }

        var formated_refill = {}
        for (var i in item) {
            formated_refill[i] = {}
            formated_refill[i]['item_name'] = item[i].item_name
            formated_refill[i]['refill_value'] = refill[i]
            formated_refill[i]['prediction_value'] = item[i].prediction_value
        }

        var refill_log = {}
        refill_log['stock'] = formated_stock
        refill_log['refill'] = formated_refill

        var add_log_data = {}
        add_log_data['date'] = date.formatTime(today)
        add_log_data['user_uid'] = app.globalData.uid
        add_log_data['user_true_name'] = app.globalData.true_name
        add_log_data['log_info'] = refill_log

        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_refill_log,
                add_data: add_log_data
            },
            success: res => {
                // return the result if successed
                console.log('Add a new refill log')
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
 * Send the refill message to all the user with permission level higher than 2.
 * 
 * @method sendConfirmRefillMessage
 * @param{Date} today Date of today
 * @param{Object} update_result The result of refilling
 */
function sendConfirmRefillMessage(today, update_result) {
    var time = date.formatTime(today)
    var total_amount = update_result.total
    var warning_amount = update_result.warning

    console.log('Send confirm refill message to uses with permission level greater than 1')

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
                console.log('Send confirm refill message to: ', user_res.result[u].true_name)
                wx.cloud.callFunction({
                    name: 'sendRefillMessage',
                    data: {
                        openid: user_res.result[u].user_openid,
                        time: time,
                        user: app.globalData.true_name,
                        normal_amount: total_amount - warning_amount,
                        warning_amount: warning_amount,
                        comment: '具体信息请查看补货确认记录'
                    },
                    success: message_res => {

                    },
                    fail: message_err => {
                        // if get a failed result
                        console.error('Failed to use cloud function sendRefillMessage()', message_err)
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
