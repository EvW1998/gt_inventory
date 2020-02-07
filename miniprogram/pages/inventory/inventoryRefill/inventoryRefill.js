const date = require('../../../utils/date.js')
const inventory = require('../../../utils/inventory.js')
const pAction = require('../../../utils/pageAction.js')

const app = getApp()
const db = wx.cloud.database()
const db_user = 'user'
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_info = 'info' // the collection of info
const db_usage = { 'daily': 'daily_usage', 'weekly': 'weekly_usage', 'monthly': 'monthly_usage' } // the collections of usage
const db_refill_log = 'refill_log'


Page({
    data: {
        currentTab: 0, // the current tab for show
        flag: 0, // the tab title to be bloded
        category: {}, // the categories in the inventory
        item: {}, // the items in the inventory
        h: 1200 // the height for the page
    },

    /***
     *   When loading the page
     */
    onLoad: function () {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        inventory.setInventory(this, 'refill')
    },

    /***
     *   When show the default page, set all inventory data
     */
    onShow: function () {
        
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

    formSubmit: function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

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


async function confirmRefill(page, user_input) {
    var today = new Date()
    var check_left = inventory.getCheckLeft()

    if(check_left) {
        var formated_input = {}
        for (var i in user_input) {
            formated_input[i] = parseInt(user_input[i])
            if (isNaN(formated_input[i])) {
                formated_input[i] = 0
            }
        }

        var item = page.data.item
        var formated_item = {}
        for (var i in item) {
            for (var j in item[i]) {
                formated_item[item[i][j]._id] = item[i][j]
            }
        }

        var update_result = await updateItem(formated_input, formated_item)
        await addRefillLog(formated_input, formated_item, today)
        await inventory.updateCheckLeft(false)

        sendConfirmRefillMessage(today, update_result)

        pAction.navigateBackUser('上传成功', 1)
    } else {
        pAction.navigateBackUser('上传成功', 1)
    }
}


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
 * Send the confrim left message to all the user with permission level higher than 2.
 * 
 * @method sendRefillMessage
 */
function sendConfirmRefillMessage(today, update_result) {
    var time = date.formatTime(today)
    var total_amount = update_result.total
    var warning_amount = update_result.warning

    for (var i = 2; i < 4; i++) {
        console.log('Send confirm refill message to uses with permission level: ', i)

        db.collection(db_user)
            .where({
                permission_level: i
            })
            .get({
                success: user_res => {
                    for (var u in user_res.data) {
                        console.log('Send confirm refill message to: ', user_res.data[u].true_name)
                        wx.cloud.callFunction({
                            name: 'sendRefillMessage',
                            data: {
                                openid: user_res.data[u].user_openid,
                                time: time,
                                user: app.globalData.true_name,
                                normal_amount: total_amount - warning_amount,
                                warning_amount: warning_amount,
                                comment: '具体信息请查看补货确认记录'
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
