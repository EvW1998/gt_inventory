/**
 * Show all the user in the current restaurant whose permission level are lower than the current user.
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of real time logs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection name of the users

const userSetting_page = '../userSetting/userSetting' // the page url of the user setting


Page({

    /**
     * Page data
     */
    data: {
        search_state: 'searching', // the state of the searching users
        user: {}, // users in the current restaurant
        user_level_2: {}, // users have permission level 2
        user_level_2_amount: 0, // the amount of users have permission level 2
        user_level_1: {}, // users have permission level 1
        user_level_1_amount: 0, // the amount of users have permission level 1
        user_level_0: {}, // users have permission level 0
        user_level_0_amount: 0, // the amount of users have permission level 0
        permission_level: 0, // the current user permission level
        restaurant_id: '', // the id of the current restaurant
        userSetting_page: userSetting_page // the page url of the user setting
    },

    /**
     * When load the page
     */
    onLoad: function () {
        
    },

    /**
     * When show the page
     */
    onShow: function () {
        this.setData({
            permission_level: app.globalData.permission_level,
            restaurant_id: app.globalData.restaurant_id
        })

        setAllUserInfo(this)
    },

    /**
     * When pull down to refresh
     */
    onPullDownRefresh: function() {
        this.setData({
            permission_level: app.globalData.permission_level,
            restaurant_id: app.globalData.restaurant_id
        })

        setAllUserInfo(this)
    },

    /**
     * When unload the page
     */
    onUnload: function () {
        try {
            wx.removeStorageSync('users')
        } catch (err) {
            realTimeLog.error('Failed to remove the user data in the local stroage.', err)

            wx.showToast({
                title: '本地存储错误，请重试',
                icon: 'none'
            })
        }
    },

    /**
     * When share the mini app
     */
    onShareAppMessage: function () {
        return {
            title: '国泰耗材管理',
            desc: '国泰餐厅耗材管理程序',
            path: 'pages/inventory/inventoryUpdate/inventoryUpdate'
        }
    }
})


/**
 * Search users in the current restaurant.
 * If found, store them in different permission levels in the page data.
 * 
 * @method setAllUserInfo
 * @param{Page} page The page
 */
function setAllUserInfo(page) {
    var collection_filed = {}
    collection_filed['_id'] = true
    collection_filed[app.globalData.restaurant_id] = true

    wx.cloud.callFunction({
        name: 'getUser',
        data: {
            r_id: app.globalData.restaurant_id,
            collection_filed: collection_filed
        },
        success: res => {
            var user_result = res.result
            var r_id = app.globalData.restaurant_id

            if (user_result.length === 0) {
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

                var storage_user = {}

                for (var i in user_result) {
                    storage_user[user_result[i]._id] = user_result[i][r_id]

                    if (user_result[i][r_id].permission_level == 2 && app.globalData.permission_level > 2) {
                        user_level_2[user_result[i]._id] = user_result[i]
                        user_level_2_amount++
                    } else if (user_result[i][r_id].permission_level == 1) {
                        user_level_1[user_result[i]._id] = user_result[i]
                        user_level_1_amount++
                    } else if (user_result[i][r_id].permission_level == 0) {
                        user_level_0[user_result[i]._id] = user_result[i]
                        user_level_0_amount++
                    }
                }

                if (user_level_2_amount == 0 && user_level_1_amount == 0 && user_level_0_amount == 0) {
                    page.setData({
                        search_state: 'noUsers'
                    })
                } else {

                    try {
                        wx.setStorageSync('users', storage_user)
                    } catch (err) {
                        page.setData({
                            search_state: 'error'
                        })

                        realTimeLog.error('Failed to store the user data in the local stroage.', err)

                        wx.showToast({
                            title: '本地存储错误，请重试',
                            icon: 'none'
                        })
                    }
                    
                    if (page.data.search_state !== 'error') {
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
            }

            if (app.globalData.debug) {
                console.log('Get all users info', user_result)
            }
            wx.stopPullDownRefresh()
        },
        fail: err => {
            page.setData({
                search_state: 'error'
            })

            realTimeLog.error('Failed to get users info by using getUser() cloud function.', err)
            wx.stopPullDownRefresh()

            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            })
        }
    })
}
