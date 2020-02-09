/**
 * The page to show all the user in the user collection,
 * whose permission level is lower than the current user.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection name of the user

const userSetting_page = '../userSetting/userSetting' // the page url of the user setting


Page({

    /**
     * Data for this page
     */
    data: {
        user: {}, // users in the miniapp
        permission_level: 0, // the current user permission level
        userSetting_page: userSetting_page // the page url of the user setting
    },

    /**
     * When load the page
     */
    onLoad: function () {
        
    },

    /**
     * When show the page, update permission level and get all user info
     */
    onShow: function () {
        this.setData({
            permission_level: app.globalData.permission_level
        })

        wx.showLoading({
            title: '加载中',
            mask: true
        })

        setAllUserInfo(this)
    },

    /**
     * When the use pulls down to refresh,
     * call onShow to update users info.
     */
    onPullDownRefresh: function() {
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
 * Set all the user info into the page data.
 * 
 * @method setAllUserInfo
 * @param{Page} page The page
 */
function setAllUserInfo(page) {
    db.collection(db_user)
        .field({
            true_name: true,
            permission_level: true,
            user_openid: true,
            _id: true
        })
        .orderBy('permission_level', 'desc')
        .get({
            success: res => {
                page.setData({
                    user: res.data
                })

                console.log('Get all users info', res.data)
                wx.hideLoading()
                wx.stopPullDownRefresh()
            },
            fail: err => {
                console.error('Failed to search users in database', err)
                wx.hideLoading()
                wx.stopPullDownRefresh()
            }
        })
}
