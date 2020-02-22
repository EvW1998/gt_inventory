/**
 * The page to show all the items in cateogries.
 * Entrance to check left or refill.
 */
const user = require('../../../utils/user.js') // require the util of user
const inventory = require('../../../utils/inventory.js') // require the util of inventory
const pAction = require('../../../utils/pageAction.js') // require the util of page actions
const realTimeLog = require('../../../utils/log.js') // require the util of real time logs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database

const registration_page = '../../user/userRegister/userRegister' // the url for the register page
const info_page = '../../user/userInfo/userInfo' // the url for the info page
const check_left_page = '../inventoryLeft/inventoryLeft' // the url for the check left page
const refill_page = '../inventoryRefill/inventoryRefill' // the url for the refill page
const detail_page = '../itemDetail/itemDetail' // the url for the detail page


Page({
    data: {
        currentTab: 0, // the current tab for show
        flag: 0, // the tab title to be bloded
        firstLoad: true, // whether it is the first time to load the page
        category: {}, // the categories in the inventory
        category_amount: 0, // the amount of categories
        item: {}, // the items in the inventory
        item_amount: 0, // the amount of items
        h: 1200, // the height for the page
        check_left: false, // whether the left in the inventory has been checked
        detail_page: detail_page // the page to show the detail info about an item
    },

    /***
     * When loading the page, check whether the user is logged in.
     * If not, block the user until get userinfo back
     */
    onLoad: function () {
        if (!app.globalData.logged) {
            wx.showLoading({
                title: '登录中',
                mask: true
            })

            // login the user
            this.userLogin()
        }
    },

    /***
     * When show the default page, get the inventory info.
     */
    onShow: function () {
        if (!this.data.firstLoad) {
            // check whether the user's permission level is high enough to view the page
            checkPermission()
        }

        inventory.setInventory(this, 'update')
    },

    /**
     * When the use pulls down to refresh,
     * call onShow to update item info.
     */
    onPullDownRefresh: function () {
        this.onShow()
    },

    /**
     * Login the user and get the user's info.
     * 
     * @method userLogin
     */
    async userLogin() {
        var log_info = {}
        // get system info
        app.globalData.system = await user.getSystem()
        console.log('System Info', app.globalData.system)
        log_info.system = app.globalData.system

        // get user's authorization to use his info
        app.globalData.logged = await user.getAuthority()
        console.log('User logged in: ', app.globalData.logged)
        log_info.logged = app.globalData.logged
        
        if(app.globalData.logged) {
            // if got the user's authorization
            // get user's info
            app.globalData.userInfo = await user.getUserInfomation()
            console.log('UserInfo: ', app.globalData.userInfo)
            log_info.userInfo = app.globalData.userInfo
            
            // get user's openid
            app.globalData.openid = await user.getOpenId()
            console.log('User openid: ', app.globalData.openid)
            log_info.openid = app.globalData.openid

            // get user's registration state
            var check_result = await user.checkUser(app.globalData.openid, db)
            app.globalData.registered = check_result.registered
            console.log('User registered in the App: ', app.globalData.registered)
            log_info.registered = app.globalData.registered

            if (check_result.registered) {
                // if the user registered before
                app.globalData.uid = check_result.uid
                app.globalData.true_name = check_result.true_name
                app.globalData.permission_level = check_result.permission_level

                console.log('User uid: ', app.globalData.uid)
                console.log('User real name: ', app.globalData.true_name)
                console.log('User permission level: ', app.globalData.permission_level)
                log_info.uid = app.globalData.uid
                log_info.true_name = app.globalData.true_name
                log_info.permission_level = app.globalData.permission_level

                realTimeLog.info('Log in', log_info)

                wx.hideLoading()
                
                // check whether the user's permission level is high enough to view the page
                checkPermission()

                const updateManager = wx.getUpdateManager()
                updateManager.onCheckForUpdate(function (res) {
                    console.log('The mini app has a new version: ', res)
                })

                updateManager.onUpdateReady(function () {
                    wx.showModal({
                        title: '更新提示',
                        content: '新版本已经准备好，请重启应用',
                        showCancel: false,
                        success(res) {
                            if (res.confirm) {
                                updateManager.applyUpdate()
                            }
                        }
                    })
                })
            } else {
                realTimeLog.info('Log in', log_info)

                // if the user hasn't registered
                wx.hideLoading()

                // navigate to the registration page
                wx.navigateTo({
                    url: registration_page
                })
            }
            
        } else {
            realTimeLog.info('Log in', log_info)
            
            // if didn't get the user's authorization
            wx.hideLoading()

            wx.switchTab({
                url: info_page
            })
        }

        this.setData({
            firstLoad: false
        })
    },

    /**
     * Tap the tab title to switch pages.
     * 
     * @method switchNav
     * @param{Object} e The data from the page tapping
     */
    switchNav: function (e) {
        pAction.switchNav(this, e)
    },

    /**
     * Swipe the page to switch pages.
     * 
     * @method swiperChanged
     * @param{Object} e The data from the page swiping
     */
    swiperChanged: function (e) {
        pAction.swiperChanged(this, e)
    },

    /**
     * When the Left button is tapped, open the page to check left
     * 
     * @method bindLeft
     * @param{Object} e The data from the button tapped
     */
    bindLeft: function(e) {
        var legal_action = true

        if (this.data.category_amount == 0) {
            legal_action = false
        } else {
            legal_action = false

            for (var i in this.data.item) {
                if(Object.keys(this.data.item[i]).length != 0) {
                    legal_action = true
                }
            }
        }

        if (!legal_action) {
            console.log('No item data')
            wx.showToast({
                title: '无品类',
                icon: 'none'
            })
        } else {
            console.log('Start checking the left in the inventory')
            wx.navigateTo({
                url: check_left_page
            })
        }
    },

    /**
     * When the refill button is tapped, open the page to refill
     * 
     * @method bindRefill
     * @param{Object} e The data from the button tapped
     */
    bindRefill: function (e) {
        var legal_action = true

        if (this.data.category_amount == 0) {
            legal_action = false
        } else {
            legal_action = false

            for (var i in this.data.item) {
                if (Object.keys(this.data.item[i]).length != 0) {
                    legal_action = true
                }
            }
        }

        if (!legal_action) {
            console.log('No item data')
            wx.showToast({
                title: '无品类',
                icon: 'none'
            })
        } else {
            console.log('Start refilling the inventory')
            wx.navigateTo({
                url: refill_page
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
 * Check the user's permission level, if it's too low to view this page,
 * navigate to the info page.
 * 
 * @method checkPermission
 */
function checkPermission() {
    if (app.globalData.permission_level < 1) {
        console.log('User permission level too low to view this page')
        app.globalData.permission_too_low = true
        wx.switchTab({
            url: info_page
        })
    }
}
