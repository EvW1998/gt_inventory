/**
 * Show all the check left log
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_left_log = 'left_log' // the collection of left logs

const check_log_view_page = '../checkLogView/checkLogView' // the page url of check log detail


Page({

    /**
     * Data for the page
     */
    data: {
        logs: {}, // all check left logs
        check_log_view_page: check_log_view_page // the page url of check log detail
    },

    /**
     * When the app loads the page
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        searchLog(this)
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
function searchLog(page) {
    db.collection(db_left_log)
        .orderBy('date', 'desc')
        .get({
            success: res => {
                page.setData({
                    logs: res.data
                })

                console.log('Get left log: ', res.data)
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search the left log', err)
                wx.hideLoading()
            }
        })
}
