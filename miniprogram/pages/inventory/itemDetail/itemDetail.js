/**
 * Show the detail info about the given item.
 */
const date = require('../../../utils/date.js') // require the util of date

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_item = 'item' // the collection of items
const db_usage = { 'daily': 'daily_usage', 'weekly': 'weekly_usage', 'monthly': 'monthly_usage' } // the collections of usage


Page({

    /**
     * Data for the page
     */
    data: {
        item_id: '', // the id of the selected item
        item_selected: {}, // the selected item
        usage: {} // the usage record of the item
    },

    /**
     * When the page is loaded, search the seleted item in the collection
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        this.setData({
            item_id: options.title
        })

        searchItem(this, options.title)
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
 * Search the item in the collection with the given id.
 * Then store the data in the page data.
 * 
 * @method searchItem
 * @param{Object} page The page
 * @param{String} item_id The collection id of the selected item
 */
async function searchItem(page, item_id) {
    var item = await getItem(item_id)
    page.setData({
        item_selected: item
    })

    var usage = await getUsage(item_id)
    page.setData({
        usage: usage
    })
    console.log('Get the usage of this item: ', usage)

    wx.hideLoading()
}


/**
 * Return the item info.
 * 
 * @method getItem
 * @param{String} item_id The item id
 * @return{Promise} The state of the function. Resolve when get the item info
 */
function getItem(item_id) {
    return new Promise((resolve, reject) => {
        db.collection(db_item)
            .where({
                _id: item_id
            })
            .get({
                success: res => {
                    console.log('View the item: ', res.data[0])
                    resolve(res.data[0])
                },
                fail: err => {
                    console.error('Failed to search the item', err)
                    reject()
                }
            })
    })
}


/**
 * Return the item usage info.
 * The usage record of today, yesterday, the day before yesterday,
 * this week, last week, this month and last month.
 * 
 * @method getUsage
 * @param{String} item_id The item id
 * @return{Promise} The state of the function. Resolve when get all usage records.
 */
function getUsage(item_id) {
    return new Promise((resolve, reject) => {
        var usage = {}
        var total_get = 7
        var curr_get = 0

        // get today usage
        var today = date.dateInformat(date.dateInArray(new Date()))
        
        db.collection(db_usage['daily'])
            .where({
                date: today,
                item_id: item_id
            })
            .get({
                success: res => {
                    var today_usage = 0
                    if(res.data.length != 0) {
                        today_usage = res.data[0].item_usage
                    }

                    usage['today'] = today_usage

                    curr_get = curr_get + 1
                    if(curr_get == total_get) {
                        resolve(usage)
                    }
                },
                fail: err => {
                    console.error('Failed to search today usage for the item ', err)
                    reject(usage)
                }
            })

        // get yesterday usage
        var yesterday = date.dateInformat(date.getYesterday(date.dateInArray(new Date(today))))

        db.collection(db_usage['daily'])
            .where({
                date: yesterday,
                item_id: item_id
            })
            .get({
                success: res => {
                    var yesterday_usage = 0
                    if (res.data.length != 0) {
                        yesterday_usage = res.data[0].item_usage
                    }

                    usage['yesterday'] = yesterday_usage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(usage)
                    }
                },
                fail: err => {
                    console.error('Failed to search yesterday usage for the item ', err)
                    reject(usage)
                }
            })

        // get the day before yesterday usage
        var day_before_yesterday = date.dateInformat(date.getYesterday(date.dateInArray(new Date(yesterday))))

        db.collection(db_usage['daily'])
            .where({
                date: day_before_yesterday,
                item_id: item_id
            })
            .get({
                success: res => {
                    var day_before_yesterday_usage = 0
                    if (res.data.length != 0) {
                        day_before_yesterday_usage = res.data[0].item_usage
                    }

                    usage['day_before_yesterday'] = day_before_yesterday_usage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(usage)
                    }
                },
                fail: err => {
                    console.error('Failed to search the day before yesterday usage for the item ', err)
                    reject(usage)
                }
            })

        // get this week usage
        var this_week = date.dateInformat(date.getThisWeek(new Date(today)))

        db.collection(db_usage['weekly'])
            .where({
                date: this_week,
                item_id: item_id
            })
            .get({
                success: res => {
                    var this_week_usage = 0
                    if (res.data.length != 0) {
                        this_week_usage = res.data[0].item_usage
                    }

                    usage['this_week'] = this_week_usage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(usage)
                    }
                },
                fail: err => {
                    console.error('Failed to search this week usage for the item ', err)
                    reject(usage)
                }
            })

        // get last week usage
        var last_week_last_day = date.dateInformat(date.getYesterday(date.dateInArray(new Date(this_week))))
        var last_week = date.dateInformat(date.getThisWeek(new Date(last_week_last_day)))

        db.collection(db_usage['weekly'])
            .where({
                date: last_week,
                item_id: item_id
            })
            .get({
                success: res => {
                    var last_week_usage = 0
                    if (res.data.length != 0) {
                        last_week_usage = res.data[0].item_usage
                    }

                    usage['last_week'] = last_week_usage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(usage)
                    }
                },
                fail: err => {
                    console.error('Failed to search last week usage for the item ', err)
                    reject(usage)
                }
            })
        
        // get this month usage
        var this_month = date.dateInformat(date.getThisMonth(date.dateInArray(new Date(today))))

        db.collection(db_usage['monthly'])
            .where({
                date: this_month,
                item_id: item_id
            })
            .get({
                success: res => {
                    var this_month_usage = 0
                    if (res.data.length != 0) {
                        this_month_usage = res.data[0].item_usage
                    }

                    usage['this_month'] = this_month_usage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(usage)
                    }
                },
                fail: err => {
                    console.error('Failed to search this month usage for the item ', err)
                    reject(usage)
                }
            })

        // get last month usage
        var last_month_last_day = date.dateInformat(date.getYesterday(date.dateInArray(new Date(this_month))))
        var last_month = date.dateInformat(date.getThisMonth(date.dateInArray(new Date(last_month_last_day))))

        db.collection(db_usage['monthly'])
            .where({
                date: last_month,
                item_id: item_id
            })
            .get({
                success: res => {
                    var last_month_usage = 0
                    if (res.data.length != 0) {
                        last_month_usage = res.data[0].item_usage
                    }

                    usage['last_month'] = last_month_usage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(usage)
                    }
                },
                fail: err => {
                    console.error('Failed to search last month usage for the item ', err)
                    reject(usage)
                }
            })
    })
}
