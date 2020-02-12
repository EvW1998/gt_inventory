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
        search_state: 'searching', // the state of the searching users
        user: {}, // users in the miniapp
        user_amount: 0, // the amount of users
        user_level_2: {}, // users have permission level 2
        user_level_2_amount: 0, // the amount of users have permission level 2
        user_level_1: {}, // users have permission level 1
        user_level_1_amount: 0, // the amount of users have permission level 1
        user_level_0: {}, // users have permission level 0
        user_level_0_amount: 0, // the amount of users have permission level 0
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
        .orderBy('true_name', 'desc')
        .get({
            success: res => {
                var user_result = res.data
                
                if(user_result.length == 0) {
                    page.setData({
                        search_state: 'noUsers'
                    })
                } else {
                    var user_level_2 = {}
                    var user_level_2_amount = 0
                    var user_level_1 = {}
                    var user_level_1_amount = 0
                    var user_level_0 = {}
                    var user_level_0_amount = 0
                    
                    for(var i in user_result) {
                        if (user_result[i].permission_level == 2 && app.globalData.permission_level > 2) {
                            user_level_2[user_result[i]._id] = user_result[i]
                            user_level_2_amount ++
                        } else if (user_result[i].permission_level == 1) {
                            user_level_1[user_result[i]._id] = user_result[i]
                            user_level_1_amount ++
                        } else if (user_result[i].permission_level == 0) {
                            user_level_0[user_result[i]._id] = user_result[i]
                            user_level_0_amount ++
                        }
                    }

                    if (user_level_2_amount == 0 && user_level_1_amount == 0 && user_level_0_amount == 0) {
                        page.setData({
                            search_state: 'noUsers'
                        })
                    } else {
                        page.setData({
                            user_level_2: user_level_2,
                            user_level_2_amount: user_level_2_amount,
                            user_level_1: user_level_1,
                            user_level_1_amount: user_level_1_amount,
                            user_level_0: user_level_0,
                            user_level_0_amount: user_level_0_amount,
                            search_state: 'foundUsers'
                        })

                    }
                }

                console.log('Get all users info', user_result)
                wx.stopPullDownRefresh()
            },
            fail: err => {
                console.error('Failed to search users in database', err)
                wx.stopPullDownRefresh()
            }
        })
}
