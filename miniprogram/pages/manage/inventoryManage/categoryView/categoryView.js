/**
 * The page to show all the category in the category collection.
 */
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
        category: {}, // categories in the miniapp
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
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        setAllCategoryrInfo(this)
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
 * Set all the category info into the page data.
 * 
 * @method setAllCategoryrInfo
 * @param{Page} page The page
 */
function setAllCategoryrInfo(page) {
    db.collection(db_category)
        .field({
            category_order: true,
            category_name: true,
            _id: true
        })
        .orderBy('category_order', 'asc')
        .get({
            success: res => {
                page.setData({
                    category: res.data
                })

                console.log('Get all category info', res.data)
                wx.hideLoading()
                wx.stopPullDownRefresh()
            },
            fail: err => {
                console.error('Failed to search categories in database', err)
                wx.hideLoading()
                wx.stopPullDownRefresh()
            }
        })
}
