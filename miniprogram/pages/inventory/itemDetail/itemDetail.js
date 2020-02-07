/**
 * Update the selected item or delete it
 */
const date = require('../../../utils/date.js')

const app = getApp()
const db = wx.cloud.database()
const db_item = 'item' // the collection of items
const db_useage = { 'daily': 'daily_useage', 'weekly': 'weekly_useage', 'monthly': 'monthly_useage' } // the collections of useage


Page({

    /**
     * Data for the page
     */
    data: {
        item_id: '', // the id of the selected item
        item_selected: {},
        useage: {}
    },

    /**
     * When the app loads the page
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

    /***
     *  When the user wants to share this miniapp
     */
    onShareAppMessage: function () {
        return {
            title: 'GT库存',
            desc: '国泰餐厅库存管理程序',
            path: '/usersetting/usersetting'
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

    var useage = await getUseage(item_id)
    page.setData({
        useage: useage
    })
    console.log('Get the useage of this item: ', useage)

    wx.hideLoading()
}


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


function getUseage(item_id) {
    return new Promise((resolve, reject) => {
        var useage = {}
        var total_get = 7
        var curr_get = 0

        // get today useage
        var today = date.dateInformat(date.dateInArray(new Date()))
        
        db.collection(db_useage['daily'])
            .where({
                date: today,
                item_id: item_id
            })
            .get({
                success: res => {
                    var today_useage = 0
                    if(res.data.length != 0) {
                        today_useage = res.data[0].item_useage
                    }

                    useage['today'] = today_useage

                    curr_get = curr_get + 1
                    if(curr_get == total_get) {
                        resolve(useage)
                    }
                },
                fail: err => {
                    console.error('Failed to search today useage for the item ', err)
                    reject(useage)
                }
            })

        // get yesterday useage
        var yesterday = date.dateInformat(date.getYesterday(date.dateInArray(new Date(today))))

        db.collection(db_useage['daily'])
            .where({
                date: yesterday,
                item_id: item_id
            })
            .get({
                success: res => {
                    var yesterday_useage = 0
                    if (res.data.length != 0) {
                        yesterday_useage = res.data[0].item_useage
                    }

                    useage['yesterday'] = yesterday_useage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(useage)
                    }
                },
                fail: err => {
                    console.error('Failed to search yesterday useage for the item ', err)
                    reject(useage)
                }
            })

        // get the day before yesterday useage
        var day_before_yesterday = date.dateInformat(date.getYesterday(date.dateInArray(new Date(yesterday))))

        db.collection(db_useage['daily'])
            .where({
                date: day_before_yesterday,
                item_id: item_id
            })
            .get({
                success: res => {
                    var day_before_yesterday_useage = 0
                    if (res.data.length != 0) {
                        day_before_yesterday_useage = res.data[0].item_useage
                    }

                    useage['day_before_yesterday'] = day_before_yesterday_useage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(useage)
                    }
                },
                fail: err => {
                    console.error('Failed to search the day before yesterday useage for the item ', err)
                    reject(useage)
                }
            })

        // get this week useage
        var this_week = date.dateInformat(date.getThisWeek(new Date(today)))

        db.collection(db_useage['weekly'])
            .where({
                date: this_week,
                item_id: item_id
            })
            .get({
                success: res => {
                    var this_week_useage = 0
                    if (res.data.length != 0) {
                        this_week_useage = res.data[0].item_useage
                    }

                    useage['this_week'] = this_week_useage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(useage)
                    }
                },
                fail: err => {
                    console.error('Failed to search this week useage for the item ', err)
                    reject(useage)
                }
            })

        // get last week useage
        var last_week_last_day = date.dateInformat(date.getYesterday(date.dateInArray(new Date(this_week))))
        var last_week = date.dateInformat(date.getThisWeek(new Date(last_week_last_day)))

        db.collection(db_useage['weekly'])
            .where({
                date: last_week,
                item_id: item_id
            })
            .get({
                success: res => {
                    var last_week_useage = 0
                    if (res.data.length != 0) {
                        last_week_useage = res.data[0].item_useage
                    }

                    useage['last_week'] = last_week_useage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(useage)
                    }
                },
                fail: err => {
                    console.error('Failed to search last week useage for the item ', err)
                    reject(useage)
                }
            })
        
        // get this month useage
        var this_month = date.dateInformat(date.getThisMonth(date.dateInArray(new Date(today))))

        db.collection(db_useage['monthly'])
            .where({
                date: this_month,
                item_id: item_id
            })
            .get({
                success: res => {
                    var this_month_useage = 0
                    if (res.data.length != 0) {
                        this_month_useage = res.data[0].item_useage
                    }

                    useage['this_month'] = this_month_useage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(useage)
                    }
                },
                fail: err => {
                    console.error('Failed to search this month useage for the item ', err)
                    reject(useage)
                }
            })

        // get last month useage
        var last_month_last_day = date.dateInformat(date.getYesterday(date.dateInArray(new Date(this_month))))
        var last_month = date.dateInformat(date.getThisMonth(date.dateInArray(new Date(last_month_last_day))))

        db.collection(db_useage['monthly'])
            .where({
                date: last_month,
                item_id: item_id
            })
            .get({
                success: res => {
                    var last_month_useage = 0
                    if (res.data.length != 0) {
                        last_month_useage = res.data[0].item_useage
                    }

                    useage['last_month'] = last_month_useage

                    curr_get = curr_get + 1
                    if (curr_get == total_get) {
                        resolve(useage)
                    }
                },
                fail: err => {
                    console.error('Failed to search last month useage for the item ', err)
                    reject(useage)
                }
            })
    })
}
