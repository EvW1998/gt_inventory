/**
 *  The page to show all the sale info in the sale collection.
 */
const app = getApp()
const db = wx.cloud.database()
const db_sale = 'sale' // the collection name of the sale

const saleSetting_page = '../saleSetting/saleSetting' // url for the sale setting
const saleAdd_page = '../saleAdd/saleAdd' // url for adding a new category


Page({

    /**
     * Data for this page
     */
    data: {
        sales: {}, // sales in the miniapp
        saleSetting_page: saleSetting_page, // url for the sale setting
        saleAdd_page: saleAdd_page // url for adding a new sale
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
    db.collection(db_sale)
        .field({
            _id: true,
            sale_date: true,
            sale_value: true
        })
        .orderBy('sale_date', 'desc')
        .get({
            success: res => {
                page.setData({
                    sales: res.data
                })

                console.log('Get all sales info', res.data)
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
