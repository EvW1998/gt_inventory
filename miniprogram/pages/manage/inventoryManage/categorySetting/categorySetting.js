/**
 * Modify the category name or delete it.
 * Also show items under this category.
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_item = 'item' // the collection of items

const page_modify = '../categoryModify/categoryModify' // the page url of modifying the category
const page_new_item = '../itemAdd/itemAdd' // the page url of adding a new item
const page_item_setting = '../itemSetting/itemSetting' // the page url of modifying the item

var category_id = ''


Page({

    /**
     * Data for the page
     */
    data: {
        search_state: 'searching', // the state of the searching items under the selected category
        category_name: '', // the name of the selected cateogry
        category_id: '', // the id of the selected category
        items: {}, // items under the selected category
        item_amount: 0, // the amount of the items
        show_tip: false, // whether to show the tip of promotion events
        show_remove: false, // whether to show the dialog to remove a promotion event
        page_modify: page_modify, // the page url of modifying the category
        page_new_item: page_new_item, // the page url of adding a new item
        page_item_setting: page_item_setting // the page url of modifying the item
    },

    /**
     * When the app loads the page
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function (options) {
        category_id = options.title
        
        this.setData({
            category_id: category_id
        })
    },

    /**
     * When the app shows the page
     */
    onShow: function() {
        var categories = wx.getStorageSync('categories')

        this.setData({
            category_name: categories[category_id]
        })

        setItem(this)
    },

    onPullDownRefresh: function() {
        setItem(this)
    },

    onUnload: function () {
        wx.removeStorageSync('items')
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


function setItem(page) {
    var collection_where = {}
    collection_where['restaurant_id'] = app.globalData.restaurant_id
    collection_where['category_id'] = category_id

    var collection_field = {}
    collection_field['category_id'] = false
    collection_field['item_order'] = false
    collection_field['restaurant_id'] = false

    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_item,
            collection_limit: 100,
            collection_field: collection_field,
            collection_where: collection_where,
            collection_orderby_key: 'item_order',
            collection_orderby_order: 'asc'
        },
        success: res => {
            if (res.result.length === 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var storage_item = {}
                for (let i in res.result) {
                    storage_item[res.result[i]._id] = res.result[i]
                }

                wx.setStorageSync('items', storage_item)

                var items = addOrder(res.result, res.result.length)

                page.setData({
                    search_state: 'found',
                    items: items,
                    item_amount: res.result.length
                })
            }

            console.log('View all the items under the category ', page.data.category_name, ' in the current restaurant.', page.data.items)
            wx.stopPullDownRefresh()
        },
        fail: err => {
            page.setData({
                search_state: 'error'
            })

            wx.stopPullDownRefresh()
            realTimeLog.error('Failed to get all the items under the selected category in the current restaurant by using dbGet().', err)
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
