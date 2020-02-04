var date = require('date.js')

const app = getApp()
const db = wx.cloud.database()
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_info = 'info' // the collection of info
const db_sale = 'sale' // the collection of sale
const db_daily_useage = 'daily_useage' // the collection of daily useage


/**
 * Set all the categories and items data in the inventory.
 * 
 * @method setInventory
 * @param{Page} page The page
 * @param{String} type The type, whether main, left or refill
 */
async function setInventory(page, type) {
    if (type == 'main') {
        var cl = await getCheckLeft()
        page.setData({
            check_left: cl
        })
        app.globalData.check_left = cl
        console.log('Left has been checked: ', cl)
    }

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

    if (type == 'main') {
        wx.stopPullDownRefresh()
    } else if(type == 'refill') {
        var yesterday_sale = await getYesterdaySale()
        var today_sale = await getTodaySale()

        var yesterday_useage = await getYesterdayUseage()

        setPerdiction(page, yesterday_sale, yesterday_useage, today_sale)

        wx.hideLoading()
    } 
    else {
        wx.hideLoading()
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

        var height = 400
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


function getYesterdaySale(page) {
    return new Promise((resolve, reject) => {
        var yesterday = date.dateInformat(date.getYesterday(date.dateInArray(new Date())))

        db.collection(db_sale)
            .where({
                sale_date: yesterday
            })
            .get({
                success: res => {
                    var yesterday_sale = 0
                    if(res.data.length == 0) {
                        console.log('No sale data of yesterday: ', yesterday)
                    } else {
                        yesterday_sale = res.data[0].sale_value
                        console.log('Get yesterday ', yesterday, ' sale data: ', res.data[0].sale_value)
                    }
                    resolve(yesterday_sale)
                },
                fail: err => {
                    console.error('Failed to search yesterday sale data', err)
                    reject(0)
                }
            })
    })
}


function getTodaySale(page) {
    return new Promise((resolve, reject) => {
        var today = date.dateInformat(date.dateInArray(new Date()))

        db.collection(db_sale)
            .where({
                sale_date: today
            })
            .get({
                success: res => {
                    var today_sale = 0
                    if (res.data.length == 0) {
                        console.log('No sale data of today: ', today)
                    } else {
                        today_sale = res.data[0].sale_value
                        console.log('Get today ', today, ' sale data: ', res.data[0].sale_value)
                    }
                    resolve(today_sale)
                },
                fail: err => {
                    console.error('Failed to search today sale data', err)
                    reject(0)
                }
            })
    })
}


function getYesterdayUseage(page) {
    return new Promise((resolve, reject) => {
        var yesterday = date.dateInformat(date.getYesterday(date.dateInArray(new Date())))
        var yesterday_useage = {}

        db.collection(db_daily_useage)
            .where({
                date: yesterday
            })
            .get({
                success: res => {
                    for(var i in res.data) {
                        yesterday_useage[res.data[i].item_id] = res.data[i]
                    }
                    console.log('Get yesterday useage: ', yesterday_useage)
                    resolve(yesterday_useage)
                },
                fail: err => {
                    console.error('Failed to search today sale data', err)
                    reject(yesterday_useage)
                }
            })
    })
}


function setPerdiction(page, yesterday_sale, yesterday_useage, today_sale) {
    var item = page.data.item
    
    if(yesterday_sale == 0 || today_sale == 0) {
        for (var i in item) {
            for (var j in item[i]) {
                item[i][j]['perdiction_value'] = item[i][j].base_number
            }
        }
    } else {
        var ratio = today_sale / yesterday_sale
        for (var i in item) {
            for (var j in item[i]) {
                var today_perdiction = yesterday_useage[item[i][j]._id].item_useage * ratio
                today_perdiction = Math.ceil(today_perdiction)
                item[i][j]['perdiction_value'] = today_perdiction
            }
        }
    }

    console.log('Finish prediction of today', item)

    page.setData({
        item: item
    })
}


/**
 * Update the check_left value in the info collection
 * 
 * @method updateCheckLeft
 * @param{Boolean} state The new state of check_left
 */
function updateCheckLeft(state) {
    return new Promise((resolve, reject) => {
        var update_info_data = { 'check_left': state }

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


module.exports = {
    setInventory: setInventory,
    getCheckLeft: getCheckLeft,
    updateCheckLeft: updateCheckLeft
}
