const util = require('../../../utils/util.js');
const user = require('../../../utils/user.js');
const date = require('../../../utils/date.js')

const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_daily_useage = 'daily_useage'
const registration_page = '../../user/userRegister/userRegister' // the url for the register page
const info_page = '../../user/userInfo/userInfo' // the url for the info page


Page({
    data: {
        currentTab: 0,
        flag: 0,
        category: {},
        item: {},
        h: 800,
        left_checked: false,
        btn_name: '确认余量',
        yesterday_useage: {}
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
        setInventory(this)
    },

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

    swiperChanged: function (e) {
        console.log('Switch navigation to: ', e.detail.current)
        if (this.data.currentTab != e.detail.current) {
            this.setData({
                currentTab: e.detail.current,
                flag: e.detail.current
            })
        }
    },

    formSubmit: function (e) {
        if (this.data.left_checked == false) {
            wx.showLoading({
                title: '上传中',
                mask: true
            })

            this.setData({
                left_checked: true,
                btn_name: '确认补货'
            })

            confirmUseage(this, e)
        }
        else {
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
                                                        console.error('failed to use cloud function dbChangeUser()', err)
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
                                                        console.error('failed to use cloud function dbChangeUser()', err)
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
                                                        console.error('failed to use cloud function dbChangeUser()', err)
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
                                                        console.error('failed to use cloud function dbChangeUser()', err)
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
        }
    },

    setState: function (nf, wa) {
        console.log('state nf: ', nf)
        console.log('state wa: ', wa)

        for (var i in nf) {
            var update_state_data = {
                state: 1
            }

            wx.cloud.callFunction({
                name: 'dbChangeUser',
                data: {
                    collection_name: 'stock',
                    update_data: update_state_data,
                    uid: i
                },
                success: res => {

                },
                fail: err => {
                    // if get a failed result
                    console.error('failed to use cloud function dbChangeUser()', err)
                }
            })

        }

        for (var i in wa) {
            var update_state_data = {
                state: 1
            }

            wx.cloud.callFunction({
                name: 'dbChangeUser',
                data: {
                    collection_name: 'stock',
                    update_data: update_state_data,
                    uid: i
                },
                success: res => {

                },
                fail: err => {
                    // if get a failed result
                    console.error('failed to use cloud function dbChangeUser()', err)
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


/**
 * Check the user's permission level, if it's too low to view this page,
 * navigate to the info page.
 * 
 * @method checkPermission
 */
function checkPermission() {
    if (app.globalData.permission_level < 1) {
        console.log('User permission level too low to view this page')
        app.globalData.permission_too_low = true
        wx.switchTab({
            url: info_page
        })
    }
}


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

    wx.stopPullDownRefresh()
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


function getYestderdayUseage(stock, today_left) {
    var y_useage = {}

    for (var i in today_left) {
        if (today_left[i] == "") {
            today_left[i] = stock[i].stock_value
        }
        else {
            today_left[i] = parseInt(today_left[i])
        }

        y_useage[i] = stock[i].stock_value - today_left[i]
        console.log(stock[i].item_name, ' Yesterday useage ', y_useage[i], ' = stock ', stock[i].stock_value, ' - today left ', today_left[i])
    }

    return y_useage
}


async function confirmUseage(page, e) {
    var stock = {}
    var item = page.data.item
    for (var i in item) {
        for (var j in item[i]) {
            stock[item[i][j]._id] = item[i][j]
        }
    }

    console.log('Yesterday useage: ')
    var y_useage = getYestderdayUseage(stock, e.detail.value)
    page.setData({
        yesterday_useage: y_useage
    })

    var yesterday = date.dateInformat(date.getYesterday(new Date()))

    await addNewUseage(y_useage, yesterday)
    console.log('Finish updating yesterday useage')

    var repetition = await checkRepetition(y_useage, yesterday)
    console.log('Useage repetition: ', repetition)

    if (Object.keys(repetition).length != 0) {
        // await merageUseage(repetition)
    }

    wx.hideLoading()
}


function addNewUseage(y_useage, yesterday) {
    return new Promise((resolve, reject) => {
        var total_add = Object.keys(y_useage).length
        var curr_add = 0

        for (var i in y_useage) {
            var add_useage_data = {}
            add_useage_data['item_id'] = i
            add_useage_data['date'] = yesterday
            add_useage_data['item_useage'] = y_useage[i]

            wx.cloud.callFunction({
                name: 'dbAdd',
                data: {
                    collection_name: db_daily_useage,
                    add_data: add_useage_data
                },
                success: res => {
                    curr_add = curr_add + 1
                    console.log('Updated item', curr_add, '/', total_add)
                    if (total_add == curr_add) {
                        resolve()
                    }
                },
                fail: err => {
                    // if get a failed result
                    console.error('Failed to use cloud function dbAdd()', err)
                    reject()
                }
            })
        }
    })
}


function checkRepetition(y_useage, yesterday) {
    return new Promise((resolve, reject) => {
        var total_item = Object.keys(y_useage).length
        var curr_item = 0
        var repetition = {}

        for (var i in y_useage) {
            db.collection(db_daily_useage)
                .where({
                    item_id: i,
                    date: yesterday
                })
                .get({
                    success: res => {
                        curr_item = curr_item + 1

                        if (res.data.length > 1) {
                            repetition[res.data[0].item_id] = res.data
                        }

                        console.log('Checked repetition ', curr_item, '/', total_item)

                        if (curr_item == total_item) {
                            resolve(repetition)
                        }
                    },
                    fail: err => {
                        console.log('Failed to search daily useage', err)
                        reject()
                    }
                })
        }
    })
}


function merageUseage(repetition) {
    return new Promise((resolve, reject) => {
        var total_merage = Object.keys(repetition).length
        var curr_merage = 0

        for (var i in repetition) {
            var total_del = item.length
            var curr_del = 0

            for (var j in i) {
                wx.cloud.callFunction({
                    name: 'dbRemove',
                    data: {
                        collection_name: db_daily_useage,
                        uid: j._id
                    },
                    success: res => {
                        curr_del = curr_del + 1
                        console.log('Delete item', curr_add, '/', total_add)
                        if (total_add == curr_add) {
                            resolve()
                        }
                    },
                    fail: err => {
                        // if get a failed result
                        console.error('Failed to use cloud function dbRemove()', err)
                        reject()
                    }
                })

            }
        }


    })
}


async function processMerage(item) {
    await deleteRepetition(item)
}


function deleteRepetition(item) {
    return new Promise((resolve, reject) => {
        var total_del = item.length
        var curr_del = 0

        for (var i in item) {
            wx.cloud.callFunction({
                name: 'dbRemove',
                data: {
                    collection_name: db_daily_useage,
                    uid: i._id
                },
                success: res => {
                    curr_del = curr_del + 1
                    console.log('Delete item', curr_add, '/', total_add)
                    if (total_add == curr_add) {
                        resolve()
                    }
                },
                fail: err => {
                    // if get a failed result
                    console.error('Failed to use cloud function dbRemove()', err)
                    reject()
                }
            })

        }
    })
}
