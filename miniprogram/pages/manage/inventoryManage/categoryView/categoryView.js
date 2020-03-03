/**
 * The page to show all the category in the category collection.
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories

const categorySetting_page = '../categorySetting/categorySetting' // the page url of the category setting
const categoryAdd_page = '../categoryAdd/categoryAdd' // the page url of adding a new category


Page({

    /**
     * Data for this page
     */
    data: {
        search_state: 'searching', // the state of the searching promotion events
        categories: [], // the categories in the database
        category_amount: 0, // the amount of categories
        selected_category: {}, // the selected category for removing
        show_tip: false, // whether to show the tip of promotion events
        show_remove: false, // whether to show the dialog to remove a promotion event
        categorySetting_page: categorySetting_page, // the page url of the category setting
        categoryAdd_page: categoryAdd_page // the page url of adding a new category
    },

    /**
     * When load the page
     */
    onLoad: function () {
        
    },

    /**
     * When show the page, get all category info
     */
    onShow: function () {
        setAllCategoryrInfo(this)
    },

    /**
     * When the use pulls down to refresh,
     * call onShow to update categories info.
     */
    onPullDownRefresh: function () {
        setAllCategoryrInfo(this)
    },

    onUnload: function () {
        wx.removeStorageSync('categories')
    },

    /**
     * When tapping, show the tip or hide the tip
     * 
     * @method tipChange
     */
    tipChange: function (e) {
        if (this.data.show_tip) {
            this.setData({
                show_tip: false
            })
        } else {
            this.setData({
                show_tip: true
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
 * Set all the category info into the page data.
 * 
 * @method setAllCategoryrInfo
 * @param{Page} page The page
 */
function setAllCategoryrInfo(page) {
    var collection_where = {}
    collection_where['restaurant_id'] = app.globalData.restaurant_id

    var collection_field = {}
    collection_field['_id'] = true
    collection_field['name'] = true

    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_category,
            collection_limit: 100,
            collection_field: collection_field,
            collection_where: collection_where,
            collection_orderby_key: 'category_order',
            collection_orderby_order: 'asc'
        },
        success: res => {
            if (res.result.length === 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var storage_category = {}
                for (let i in res.result) {
                    storage_category[res.result[i]._id] = res.result[i].name
                }

                wx.setStorageSync('categories', storage_category)

                var categories = addOrder(res.result, res.result.length)

                page.setData({
                    search_state: 'found',
                    categories: categories,
                    category_amount: res.result.length
                })
            }

            console.log('View all the categoies in the current restaurant.', page.data.categories)
            wx.stopPullDownRefresh()
        },
        fail: err => {
            page.setData({
                search_state: 'error'
            })

            wx.stopPullDownRefresh()
            realTimeLog.error('Failed to get all the categories in the current restaurant by using dbGet().', err)
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            })
        }
    })
}


function addOrder(target, amount) {
    var order = 1

    for (var i in target) {
        var new_order = order.toString()

        if (amount > 9 && order < 10) {
            new_order = '0' + new_order
        }

        if (amount > 99 && order < 100) {
            new_order = '0' + new_order
        }

        target[i]['order'] = new_order

        order++
    }

    return target
}
