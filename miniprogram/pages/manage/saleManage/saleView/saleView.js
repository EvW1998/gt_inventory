/**
 * The page to show all the sale info in the sale collection.
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_sale = 'sale' // the collection of sale values

const saleSetting_page = '../saleSetting/saleSetting' // the page url of sale value setting
const saleAdd_page = '../saleAdd/saleAdd' // the page url of adding a new sale value


Page({

    /**
     * Data for this page
     */
    data: {
        search_state: 'searching', // the state of the searching promotion events
        sales_unconfirmed: [], // the sales data in the database
        sale_unconfirmed_amount: 0, // the amount of sale data
        sales_confirmed: [], // the sales data in the database
        sale_confirmed_amount: 0, // the amount of sale data
        selected_sale: {}, // the selected sale data for removing
        show_tip: false, // whether to show the tip of promotion events
        show_remove: false, // whether to show the dialog to remove a promotion event
        saleSetting_page: saleSetting_page, // the page url of sale value setting
        saleAdd_page: saleAdd_page // the page url of adding a new sale value
    },

    /**
     * When load the page
     */
    onLoad: function () {

    },

    /**
     * When show the page, get all sale info
     */
    onShow: function () {
        setAllSaleInfo(this)
    },

    /**
     * When the use pulls down to refresh,
     * call onShow to update categories info.
     */
    onPullDownRefresh: function () {
        setAllSaleInfo(this)
    },

    onUnload: function () {
        wx.removeStorageSync('sales')
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
 * Set all the sale info into the page data.
 * 
 * @method setAllSaleInfo
 * @param{Page} page The page
 */
function setAllSaleInfo(page) {
    var collection_where = {}
    collection_where['restaurant_id'] = app.globalData.restaurant_id

    var collection_field = {}
    collection_field['restaurant_id'] = false

    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_sale,
            collection_limit: 100,
            collection_field: collection_field,
            collection_where: collection_where,
            collection_orderby_key: 'date',
            collection_orderby_order: 'desc'
        },
        success: res => {
            if (res.result.length === 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var storage_sale = {}
                var sales_unconfirmed = []
                var sale_unconfirmed_amount = 0
                var sales_confirmed = []
                var sale_confirmed_amount = 0

                for (let i in res.result) {
                    storage_sale[res.result[i]._id] = res.result[i]

                    if (res.result[i].confirmed) {
                        sales_confirmed.push(res.result[i])
                        sale_confirmed_amount++
                    } else {
                        sales_unconfirmed.push(res.result[i])
                        sale_unconfirmed_amount++
                    }
                }

                wx.setStorageSync('sales', storage_sale)

                sales_confirmed = addOrder(sales_confirmed, Math.max(sale_confirmed_amount, sale_unconfirmed_amount))
                sales_unconfirmed = addOrder(sales_unconfirmed, Math.max(sale_confirmed_amount, sale_unconfirmed_amount))

                page.setData({
                    search_state: 'found',
                    sales_unconfirmed: sales_unconfirmed,
                    sale_unconfirmed_amount: sale_unconfirmed_amount,
                    sales_confirmed: sales_confirmed,
                    sale_confirmed_amount: sale_confirmed_amount
                })
            }

            console.log('View all the sales in the current restaurant.', res.result)
            wx.stopPullDownRefresh()
        },
        fail: err => {
            page.setData({
                search_state: 'error'
            })

            wx.stopPullDownRefresh()
            realTimeLog.error('Failed to get all the sales in the current restaurant by using dbGet().', err)
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
