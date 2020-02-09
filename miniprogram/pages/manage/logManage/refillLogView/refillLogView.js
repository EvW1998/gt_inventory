/**
 * View the detail of a refill log
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_refill_log = 'refill_log' // the collection of refill logs


Page({

    /**
     * Data for the page
     */
    data: {
        logs: {}, // the selected log
        date: '', // the date of the log
        user_true_name: '', // the user real name of the log
        stock: {}, // the stock info of the log
        refill: {} // the refill info of the log
    },

    /**
     * When the app loads the page
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        searchLog(this, options.title)
    },

    /**
     * When the app shows the page
     */
    onShow: function () {

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
 * Search the category in the collection with the given id.
 * Then store the data in the page data.
 * 
 * @method searchCategory
 * @param{Object} page The page
 * @param{String} category_id The collection id of the selected category
 */
function searchLog(page, log_id) {
    db.collection(db_refill_log)
        .where({
            _id: log_id
        })
        .get({
            success: res => {
                page.setData({
                    logs: res.data[0],
                    date: res.data[0].date,
                    user_true_name: res.data[0].user_true_name,
                    stock: res.data[0].log_info.stock,
                    refill: res.data[0].log_info.refill
                })

                console.log('View the refill log: ', res.data[0])
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search the refill log', err)
                wx.hideLoading()
            }
        })
}
