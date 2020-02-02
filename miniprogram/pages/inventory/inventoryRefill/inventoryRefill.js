const util = require('../../../utils/util.js');
const user = require('../../../utils/user.js');
const date = require('../../../utils/date.js')
const inventory = require('../../../utils/inventory.js')
const pAction = require('../../../utils/pageAction.js')

const app = getApp()
const db = wx.cloud.database()
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

        inventory.setInventory(this, 'sub')
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

        var total = 0
        var normal = 0
        var warning = 0
        var not_filled = 0
        var today_filled = e.detail.value
        var new_stock_value = this.data.stock_value
        var new_warning_item = {}
        var new_notfilled_item = {}

        for (var i in today_filled) {
            total = total + 1

            if (today_filled[i] == "" || today_filled[i] == "0") {
                today_filled[i] = 0
                not_filled = not_filled + 1

                new_notfilled_item[i] = 0
            }
            else {
                today_filled[i] = parseInt(today_filled[i])
            }

            new_stock_value[i] = new_stock_value[i] - this.data.yesterday_cost[i] + today_filled[i]

            if (today_filled[i] < this.data.yesterday_cost[i]) {
                warning = warning + 1

                new_warning_item[i] = this.data.yesterday_cost[i] - today_filled[i]
            }
        }

        this.setData({
            stock_value: new_stock_value,
        })

        normal = total - warning - not_filled

        console.log(total, normal, warning, not_filled)

        var new_notfilled_name = {}
        var new_warning_name = {}

        for (var i in new_notfilled_item) {
            db.collection('stock')
                .where({
                    submenu_id: i
                })
                .get({
                    success: res => {
                        new_notfilled_name[res.data[0]._id] = { '_id': res.data[0]._id, 'value': 0 }

                        if (Object.keys(new_notfilled_name).length == not_filled &&
                            Object.keys(new_warning_name).length == warning) {
                            this.setData({
                                notfilled_item: new_notfilled_name,
                                warning_item: new_warning_name

                            })

                            console.log('Not filled: ', this.data.notfilled_item)
                            console.log('Warning: ', this.data.warning_item)

                            var time = util.formatTime(new Date())
                            var detail = ''

                            detail = detail + '异常补货' + warning.toString() + '项\n' + '未补货' + not_filled.toString() + '项'

                            this.setState(this.data.notfilled_item, this.data.warning_item)

                            db.collection('user')
                                .where({
                                    permission_level: 2
                                })
                                .get({
                                    success: res1 => {
                                        for (var u in res1.data) {
                                            wx.cloud.callFunction({
                                                name: 'sendMessage',
                                                data: {
                                                    openid: res1.data[u].user_openid,
                                                    time: time,
                                                    detail: detail
                                                },
                                                success: res => {
                                                    console.log(res)

                                                    wx.hideLoading()

                                                },
                                                fail: err => {
                                                    // if get a failed result
                                                    console.error('failed to use cloud function sendMessage()', err)
                                                    wx.hideLoading()
                                                }
                                            })
                                        }
                                    }
                                })

                            db.collection('user')
                                .where({
                                    permission_level: 3
                                })
                                .get({
                                    success: res1 => {
                                        for (var u in res1.data) {
                                            wx.cloud.callFunction({
                                                name: 'sendMessage',
                                                data: {
                                                    openid: res1.data[u].user_openid,
                                                    time: time,
                                                    detail: detail
                                                },
                                                success: res => {
                                                    console.log(res)

                                                    wx.hideLoading()

                                                },
                                                fail: err => {
                                                    // if get a failed result
                                                    console.error('failed to use cloud function sendMessage()', err)
                                                    wx.hideLoading()
                                                }
                                            })
                                        }
                                    }
                                })


                        }
                    }
                })
        }

        for (var j in new_warning_item) {
            db.collection('stock')
                .where({
                    submenu_id: j
                })
                .get({
                    success: res => {
                        new_warning_name[res.data[0]._id] = {
                            '_id': res.data[0]._id,
                            'value': today_filled[res.data[0]._id]
                        }

                        if (Object.keys(new_notfilled_name).length == not_filled &&
                            Object.keys(new_warning_name).length == warning) {
                            this.setData({
                                notfilled_item: new_notfilled_name,
                                warning_item: new_warning_name
                            })

                            console.log('Not filled: ', this.data.notfilled_item)
                            console.log('Warning: ', this.data.warning_item)

                            var time = util.formatTime(new Date())
                            var detail = ''

                            detail = detail + '异常补货' + warning.toString() + '项\n' + '未补货' + not_filled.toString() + '项'

                            this.setState(this.data.notfilled_item, this.data.warning_item)


                            db.collection('user')
                                .where({
                                    permission_level: 2
                                })
                                .get({
                                    success: res1 => {
                                        for (var u in res1.data) {
                                            wx.cloud.callFunction({
                                                name: 'sendMessage',
                                                data: {
                                                    openid: res1.data[u].user_openid,
                                                    time: time,
                                                    detail: detail
                                                },
                                                success: res => {
                                                    console.log(res)

                                                    wx.hideLoading()

                                                },
                                                fail: err => {
                                                    // if get a failed result
                                                    console.error('failed to use cloud function sendMessage()', err)
                                                    wx.hideLoading()
                                                }
                                            })
                                        }
                                    }
                                })

                            db.collection('user')
                                .where({
                                    permission_level: 3
                                })
                                .get({
                                    success: res1 => {
                                        for (var u in res1.data) {
                                            wx.cloud.callFunction({
                                                name: 'sendMessage',
                                                data: {
                                                    openid: res1.data[u].user_openid,
                                                    time: time,
                                                    detail: detail
                                                },
                                                success: res => {
                                                    console.log(res)

                                                    wx.hideLoading()

                                                },
                                                fail: err => {
                                                    // if get a failed result
                                                    console.error('failed to use cloud function sendMessage()', err)
                                                    wx.hideLoading()
                                                }
                                            })
                                        }
                                    }
                                })


                        }
                    }
                })
        }

        this.setData({
            left_checked: false,
            btn_name: '确认余量'
        })

    },

    setState: function (nf, wa) {
        console.log('state nf: ', nf)
        console.log('state wa: ', wa)

        for (var i in nf) {
            var update_state_data = {
                state: 1
            }

            wx.cloud.callFunction({
                name: 'dbUpdate',
                data: {
                    collection_name: 'stock',
                    update_data: update_state_data,
                    uid: i
                },
                success: res => {

                },
                fail: err => {
                    // if get a failed result
                    console.error('failed to use cloud function dbUpdate()', err)
                }
            })

        }

        for (var i in wa) {
            var update_state_data = {
                state: 1
            }

            wx.cloud.callFunction({
                name: 'dbUpdate',
                data: {
                    collection_name: 'stock',
                    update_data: update_state_data,
                    uid: i
                },
                success: res => {

                },
                fail: err => {
                    // if get a failed result
                    console.error('failed to use cloud function dbUpdate()', err)
                }
            })
        }
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
