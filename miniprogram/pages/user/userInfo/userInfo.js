/**
 * The page to show the userinfo in this app.
 * Include the user's name, wechat openid, 
 * the uid in this miniapp, and the permission level.
 */
const user = require('../../../utils/user.js') //require the util of user

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection of users

const registration_page = '../userRegister/userRegister' // the page url of the user registration
const upgrade_page = '../userUpgrade/userUpgrade' // the page url of the user upgrade 


Page({
    /**
     * Data for this page
     */
    data: {
        logged: true, // user's login state
        registered: true, // user's registered state
        userInfo: {}, // user's infomation
        openid: '', // user openid
        uid: '', // user's uid in this inventory
        true_name: '', //user's registered real name
        permission_level: 0, // user's permission level
        version: '', // the version info shows at the bottom of the page
        upgrade_page: upgrade_page // the page url of the user upgrade 
    },

    /***
     * When load the page, update the login, register and version.
     * If logged in, update the userinfo.
     * If registered, update name and permission level.
     */
    onLoad: function () {

        this.setData({
            logged: app.globalData.logged,
            registered: app.globalData.registered,
            version: app.globalData.version
        })

        if (app.globalData.logged) {
            // if the user logged in
            this.setData({
                userInfo: app.globalData.userInfo,
                openid: app.globalData.openid
            })
        }
    },

    /**
     * When show the page, if the user didn't login, show the message.
     * If the user just get back from the register page, update info.
     * If the user just get navigated to this page because permission level 
     * is too low, show the message.
     */
    onShow: function () {
        if (!app.globalData.logged) {
            // if the user didn't login, show the message
            wx.showToast({
                title: '请登录',
                icon: 'none',
                duration: 1500
            })
        }

        if (app.globalData.registered && !this.data.registered) {
            // if user just registered from the registration page
            this.setData({
                registered: app.globalData.registered,
                true_name: app.globalData.true_name,
                uid: app.globalData.uid,
                permission_level: app.globalData.permission_level
            })
        }
        
        if (app.globalData.registered) {
            // if the user registered
            this.setData({
                uid: app.globalData.uid,
                true_name: app.globalData.true_name,
                permission_level: app.globalData.permission_level
            })
        }

        if (app.globalData.permission_too_low) {
            // if the user is navigated to this page, because permission level is too low
            app.globalData.permission_too_low = false

            wx.showToast({
                title: '权限不足',
                icon: 'none',
                duration: 1500
            })
        }
    },

    /**
     * When the user pull down to refresh the page.
     * Refresh the user's name and permission level from the db
     */
    onPullDownRefresh: function() {
        if(app.globalData.registered) {
            refreshInfo(this)
        }
    },

    /**
     * When the user click the log in button.
     * Update login state and userinfo.
     * 
     * @method onGetUserInfo
     * @param{Object} e The return val from log in button.
     */
    onGetUserInfo: function (e) {
        if (!this.data.logged && e.detail.userInfo) {
            // if the login button got triggereed, and user didn't login
            wx.showLoading({
                title: '登陆中',
                mask: true
            })

            // get the user's info
            this.userLogin(e)
        }
    },

    /**
     * Update the login state, get the user's info and openid.
     * Check whether the user is registered in the App.
     * If registered, get the user's uid, real name and permission level.
     * If not, navigate the user to the registration page.
     * 
     * @method userLogin
     * @param{Object} e The return val from log in button.
     */
    async userLogin(e) {
        app.globalData.logged = true
        console.log('User logged in: ', app.globalData.logged)

        app.globalData.userInfo = e.detail.userInfo
        console.log('UserInfo: ', app.globalData.userInfo)

        // get user's openid
        app.globalData.openid = await user.getOpenId()
        console.log('User openid: ', app.globalData.openid)

        // get user's registration state
        var check_result = await user.checkUser(app.globalData.openid, db)
        app.globalData.registered = check_result.registered
        console.log('User registered in the App: ', app.globalData.registered)

        this.setData({
            logged: app.globalData.logged,
            userInfo: app.globalData.userInfo,
            openid: app.globalData.openid,
            registered: app.globalData.registered
        })

        if (check_result.registered) {
            // if the user registered before
            app.globalData.uid = check_result.uid
            app.globalData.true_name = check_result.true_name
            app.globalData.permission_level = check_result.permission_level

            console.log('User uid: ', app.globalData.uid)
            console.log('User real name: ', app.globalData.true_name)
            console.log('User permission level: ', app.globalData.permission_level)

            this.setData({
                uid: app.globalData.uid,
                true_name: app.globalData.true_name,
                permission_level: app.globalData.permission_level
            })

            wx.hideLoading()

        } else {
            // if the user hasn't registered
            wx.hideLoading()

            // navigate to the registration page
            wx.navigateTo({
                url: registration_page
            })
        }
    },

    /**
     * When the register button get triggered, 
     * navigate to the registration page
     */
    registerUser: function () {
        // navigate to the page to register
        wx.navigateTo({
            url: registration_page
        })
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
 * Search the user with the given openid.
 * Update the user's real name and permission level
 * 
 * @method refreshInfo
 * @param{Page} page The current page
 */
function refreshInfo(page) {
    db.collection(db_user)
        .where({
            // use the user's openid to search in db
            user_openid: app.globalData.openid
        })
        .field({
            true_name: true,
            permission_level: true
        })
        .get({
            success: res => {
                // update the user's info
                app.globalData.true_name = res.data[0].true_name
                app.globalData.permission_level = res.data[0].permission_level

                page.setData({
                    true_name: app.globalData.true_name,
                    permission_level: app.globalData.permission_level
                })

                console.log('Refreshed user info')
                wx.stopPullDownRefresh()
            },
            fail: err => {
                // if failed to search the user in the db
                console.error('Failed to search user in the database', err)
                wx.stopPullDownRefresh()
            }
        })
}
