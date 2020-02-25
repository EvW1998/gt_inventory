/**
 * The page to show all the items in cateogries.
 * Entrance to check left or refill.
 */
const user = require('../../../utils/user.js') // require the util of user
const inventory = require('../../../utils/inventory.js') // require the util of inventory
const pAction = require('../../../utils/pageAction.js') // require the util of page actions
const realTimeLog = require('../../../utils/log.js') // require the util of real time logs

const app = getApp() // the app

const registration_page = '../../user/userRegister/userRegister' // the url for the register page
const info_page = '../../user/userInfo/userInfo' // the url for the info page
const check_left_page = '../inventoryLeft/inventoryLeft' // the url for the check left page
const refill_page = '../inventoryRefill/inventoryRefill' // the url for the refill page
const detail_page = '../itemDetail/itemDetail' // the url for the detail page


Page({
    data: {
        currentTab: 0, // the current tab for show
        flag: 0, // the tab title to be bloded
        first_load: true, // whether it is the first time to load the page
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

            checkUpdate()

            userLogin()
        }
    },

    /***
     * When show the default page, get the inventory info.
     */
    onShow: function () {
        console.log('First load: ', this.data.first_load)
        if (!this.data.first_load) {
            checkPermission()
        } else {
            this.setData({
                first_load: false
            })
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
        console.log('User permission level too low to view the inventory page.')
        app.globalData.permission_too_low = true
        wx.switchTab({
            url: info_page
        })
    }
}


/**
 * Login the user and get the user's info.
 * 
 * @method userLogin
 */
async function userLogin() {
    console.log('Start user login process.')

    var log_info = {}
    // get system info
    app.globalData.system = await user.getSystem()
    console.log('System Info', app.globalData.system)
    log_info.system = app.globalData.system

    // get user's authorization to use his info
    var authority_res = await user.getAuthority()
    if (authority_res.stat) {
        app.globalData.logged = authority_res.result
        console.log('User logged in: ', authority_res.result)
        log_info.logged = authority_res.result

        if (!authority_res.result) {
            // if didn't get the user's authorization of wechat login
            console.log('Redirect to user info page.')
            realTimeLog.info('User did not login.', log_info)

            wx.hideLoading()
            wx.switchTab({
                url: info_page
            })
            return
        }
    } else {
        // if failed in the process to get user's authorization
        app.globalData.loginSuccess = false
        realTimeLog.warn('User login failed in the process to get user authorization.', log_info)
        wx.hideLoading()
        wx.switchTab({
            url: info_page
        })
        return
    }

    // get user's info
    var info_res = await user.getUserInfomation()
    if (info_res.stat) {
        app.globalData.userInfo = info_res.result
        console.log('UserInfo: ', info_res.result)
        log_info.userInfo = info_res.result
    } else {
        // if failed in the process to get user's info
        app.globalData.loginSuccess = false
        realTimeLog.warn('User login failed in the process to get user info.', log_info)
        wx.hideLoading()
        wx.switchTab({
            url: info_page
        })
        return
    }
    
    // get user's openid
    var open_res = await user.getOpenId()
    if (open_res.stat) {
        app.globalData.openid = open_res.result
        console.log('User openid: ', open_res.result)
        log_info.openid = open_res.result
    } else {
        // if failed in the process to get user's openid
        app.globalData.loginSuccess = false
        realTimeLog.warn('User login failed in the process to get user openid.', log_info)
        wx.hideLoading()
        wx.switchTab({
            url: info_page
        })
        return
    }
    
    // get user's registration info
    var registration_res = await user.getUserRegistration(open_res.result)
    if (registration_res.stat) {
        app.globalData.registered = registration_res.result.registered
        console.log('User registered: ', registration_res.result.registered)
        log_info.registered = registration_res.result.registered

        if (!registration_res.result.registered) {
            // if the user did not register in the app
            console.log('Redirect to user registration page.')
            realTimeLog.info('User did not register', log_info)

            wx.hideLoading()
            wx.navigateTo({
                url: registration_page
            })
            return
        }
    } else {
        // if failed in the process to get user's registration info
        app.globalData.loginSuccess = false
        realTimeLog.warn('User login failed in the process to get user registration info.', log_info)
        wx.hideLoading()
        wx.switchTab({
            url: info_page
        })
        return
    }

    // set the user id
    app.globalData.uid = registration_res.result.registration._id
    console.log('User uid: ', registration_res.result.registration._id)
    log_info.uid = registration_res.result.registration._id

    // set the restaurant registered
    app.globalData.restaurant_registered = registration_res.result.registration.restaurant_registered
    console.log('User restaurant registered: ', registration_res.result.registration.restaurant_registered)
    log_info.restaurant_registered = registration_res.result.registration.restaurant_registered

    // set the restaurant info
    app.globalData.restaurant_id = registration_res.result.registration.recent_restaurant
    log_info.restaurant_id = registration_res.result.registration.recent_restaurant

    // set the user name
    app.globalData.user_name = registration_res.result.registration[app.globalData.restaurant_id].name
    console.log('User name: ', app.globalData.user_name)
    log_info.user_name = app.globalData.user_name

    // set the user permission level
    app.globalData.permission_level = registration_res.result.registration[app.globalData.restaurant_id].permission_level
    console.log('User permission level: ', app.globalData.permission_level)
    log_info.permission_level = app.globalData.permission_level

    // get the restaurant info
    var restaurant_res= await user.getRestaurantInfo(registration_res.result.registration.recent_restaurant)
    if (restaurant_res.stat) {
        app.globalData.restaurant_name = restaurant_res.result.name
        console.log('Selected restaurant: ', restaurant_res.result.name, ' id: ', app.globalData.restaurant_id)
        log_info.restaurant_name = restaurant_res.result.name
    } else {
        // if failed in the process to get restaurant info
        app.globalData.loginSuccess = false
        realTimeLog.warn('User login failed in the process to get restaurant info.', log_info)
        wx.hideLoading()
        wx.switchTab({
            url: info_page
        })
        return
    }

    // get all the restaurants info
    var all_restaurant_res = await user.getAllRestaurant()
    if (all_restaurant_res.stat) {
        app.globalData.restaurant_info = all_restaurant_res.result
        console.log('Get all the restaurants info: ', all_restaurant_res.result)
        log_info.restaurant_info = all_restaurant_res.result
    } else {
        // if failed in the process to get all the restaurant info
        app.globalData.loginSuccess = false
        realTimeLog.warn('User login failed in the process to get all restaurant info.', log_info)
        wx.hideLoading()
        wx.switchTab({
            url: info_page
        })
        return
    }

    console.log('User login process completed.')
    realTimeLog.info('User login succeeded.', log_info)

    wx.hideLoading()
    checkPermission()
}


/**
 * Check whether there is a new version for the mini app.
 * 
 * @method checkUpdate
 */
function checkUpdate() {
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate(function (res) {
        console.log('The mini app has a new version: ', res.hasUpdate)
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
}
