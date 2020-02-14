/**
 * The page to show all the sale info in the sale collection.
 */
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
        sales: {}, // sales in the miniapp
        saleSetting_page: saleSetting_page, // the page url of sale value setting
        saleAdd_page: saleAdd_page // the page url of adding a new sale value
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
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        setAllSaleInfo(this)
    },

    /**
     * When the use pulls down to refresh,
     * call onShow to update categories info.
     */
    onPullDownRefresh: function () {
        this.onShow()
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
    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_sale,
            collection_limit: 30,
            collection_field: {},
            collection_where: {},
            collection_orderby_key: 'sale_date',
            collection_orderby_order: 'desc'
        },
        success: res => {
            page.setData({
                sales: res.result
            })

            console.log('Get all sales info', page.data.sales)
            wx.hideLoading()
            wx.stopPullDownRefresh()
        },
        fail: err => {
            console.error('Failed to search sales in database', err)
            wx.hideLoading()
            wx.stopPullDownRefresh()
        }
    })
}
