const user = require('../../../utils/user.js')

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

        setInventory(this)
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
        var page = this;
        var id = parseInt(e.target.id);
        if (this.data.currentTab == id) {
            return false;
        } else {
            page.setData({ currentTab: id });
        }
        page.setData({ flag: id });
    },

    /**
     * When swipe the page to switch
     */
    swiperChanged: function(e) {
        console.log('Switch navigation to: ', e.detail.current)
        if (this.data.currentTab != e.detail.current) {
            this.setData({
                currentTab: e.detail.current,
                flag: e.detail.current
            })
        }
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


/**
 * Set all the categories and items data in the inventory.
 * 
 * @method setInventory
 * @param{Page} page The page
 */
async function setInventory(page) {
    var cl = await getCheckLeft()
    page.setData({
        check_left: cl
    })
    app.globalData.check_left = cl
    console.log('Left has been checked: ', cl)

    var categories = await getCategory()
    for(var c in categories) {
        categories[c]['nav_order'] = parseInt(c)
    }

    page.setData({
        category: categories
    })
    console.log('Get all the categories: ', page.data.category)

    var items = await getItem(page, categories)

    page.setData({
        item: items
    })

    wx.stopPullDownRefresh()
}


/**
 * Get whether the left in the inventory has been checked.
 * 
 * @method getCheckLeft
 */
function getCheckLeft() {
    return new Promise((resolve, reject) => {
        db.collection(db_info)
            .field({
                check_left: true
            })
            .get({
                success: res => {
                    resolve(res.data[0].check_left)
                },
                fail: err => {
                    console.error('Failed to get check_left from database', err)
                    reject()
                }
            })
    })
}


/**
 * Get all the categories in the database.
 * 
 * @method getCategory
 */
function getCategory() {
    return new Promise((resolve, reject) => {
        db.collection(db_category)
            .field({
                _id: true,
                category_order: true,
                category_name: true,
                item_amount: true
            })
            .orderBy('category_order', 'asc')
            .get({
                success: res => {
                    resolve(res.data)
                },
                fail: err => {
                    console.error('Failed to get categories from database', err)
                    reject()
                }
            })
    })
}


/**
 * Get all the items in the database.
 * 
 * @method getItem
 * @param{Object} categories All the categories
 */
function getItem(page, categories) {
    return new Promise((resolve, reject) => {
        var total_category = categories.length
        var curr_category = 0
        var t = {}

        var height = 400
        var sum = 0

        for (var i in categories) {
            db.collection(db_item)
                .where({
                    category_id: categories[i]._id
                })
                .orderBy('item_order', 'asc')
                .get({
                    success: res => {
                        curr_category = curr_category + 1
                        console.log('Get items ', curr_category, '/', total_category)

                        if (res.data.length != 0) {
                            var category_order = 0
                            for (var j in categories) {
                                if (categories[j]._id == res.data[0].category_id) {
                                    category_order = categories[j].category_order
                                }
                            }
                            t[category_order] = res.data

                            if(res.data.length > sum) {
                                sum = res.data.length
                            }
                        }

                        if (curr_category == total_category) {
                            height = height + sum * 150

                            if(page.data.h < height) {
                                page.setData({
                                    h: height
                                })
                            }
                            
                            console.log('Get all the items: ', t)
                            resolve(t)
                        }
                    },
                    fail: err => {
                        console.error('Failed to search items', err)
                        reject()
                    }
                })
        }
    })
}
