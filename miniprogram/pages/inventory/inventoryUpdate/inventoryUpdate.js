const user = require('../../../utils/user.js')
const inventory = require('../../../utils/inventory.js')
const pAction = require('../../../utils/pageAction.js')

const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_info = 'info' // the collection of info
const registration_page = '../../user/userRegister/userRegister' // the url for the register page
const info_page = '../../user/userInfo/userInfo' // the url for the info page
const check_left_page = '../inventoryLeft/inventoryLeft' // the url for the check left page
const refill_page = '../inventoryRefill/inventoryRefill' // the url for the refill page


Page({
    data: {
        currentTab: 0, // the current tab for show
        flag: 0, // the tab title to be bloded
        firstLoad: true, // whether it is the first time to load the page
        category: {}, // the categories in the inventory
        item: {}, // the items in the inventory
        h: 1200, // the height for the page
        check_left: false // whether the left in the inventory has been checked
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

        inventory.setInventory(this, 'main')
    },

    /**
     * When the use pulls down to refresh,
     * call onShow to update item info.
     */
    onPullDownRefresh: function () {
        this.onShow()
    },

    /**
     * Login the user and get the user's info
     * 
     * @method userLogin
     */
    async userLogin() {
        // get user's authorization to use his info
        app.globalData.logged = await user.getAuthority()
        console.log('User logged in: ', app.globalData.logged)
        
        if(app.globalData.logged) {
            // if got the user's authorization
            // get user's info
            app.globalData.userInfo = await user.getUserInfomation()
            console.log('UserInfo: ', app.globalData.userInfo)
            
            // get user's openid
            app.globalData.openid = await user.getOpenId()
            console.log('User openid: ', app.globalData.openid)

            // get user's registration state
            var check_result = await user.checkUser(app.globalData.openid, db)
            app.globalData.registered = check_result.registered
            console.log('User registered in the App: ', app.globalData.registered)

            if (check_result.registered) {
                // if the user registered before
                app.globalData.uid = check_result.uid
                app.globalData.true_name = check_result.true_name
                app.globalData.permission_level = check_result.permission_level

                console.log('User uid: ', app.globalData.uid)
                console.log('User real name: ', app.globalData.true_name)
                console.log('User permission level: ', app.globalData.permission_level)

                wx.hideLoading()
                
                // check whether the user's permission level is high enough to view the page
                checkPermission()

            } else {
                // if the user hasn't registered
                wx.hideLoading()

                // navigate to the registration page
                wx.navigateTo({
                    url: registration_page
                })
            }
            
        } else {
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
     * When tap the tab title to switch page
     */
    switchNav: function (e) {
        pAction.switchNav(this, e)
    },

    /**
     * When swipe the page to switch
     */
    swiperChanged: function (e) {
        pAction.swiperChanged(this, e)
    },

    /**
     * When the Left button is tapped, open the page to check left
     * 
     * @method bindLeft
     */
    bindLeft: function(e) {
        console.log('Start checking the left in the inventory')
        wx.navigateTo({
            url: check_left_page
        })
    },

    /**
     * When the refill button is tapped, open the page to refill
     * 
     * @method bindRefill
     */
    bindRefill: function (e) {
        console.log('Start refilling the inventory')
        wx.navigateTo({
            url: refill_page
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
