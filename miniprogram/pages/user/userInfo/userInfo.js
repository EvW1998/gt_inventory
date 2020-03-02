/**
 * The page to show the userinfo in this app.
 * Include the user's name, wechat openid, 
 * the uid in this miniapp, and the permission level.
 */
const user = require('../../../utils/user.js') // require the util of user
const realTimeLog = require('../../../utils/log.js') // require the util of real time logs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection of users

const registration_page = '../userRegister/userRegister' // the page url of the user registration
const add_restaurant_page = '../addRestaurant/addRestaurant' // the page url of adding restaurants
const upgrade_page = '../userUpgrade/userUpgrade' // the page url of the user upgrade

var tap_times = 0


Page({
    /**
     * Data for this page
     */
    data: {
        logged: true, // user's login state
        registered: true, // user's registered state
        loginSuccess: true, // whether the login process succeeds
        userInfo: {}, // user's infomation
        user_name: '', //user's registered real name
        permission_level: 0, // user's permission level
        restaurant_name: '', // the name of the restaurant selected
        restaurants: {}, // the restaurants
        restaurant_array: [], // the items of the restaurant picker
        restaurant_index: 0, // the index of the restaurant picker
        version: '' // the version info shows at the bottom of the page
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
                userInfo: app.globalData.userInfo
            })

            if (app.globalData.registered) {
                // if the user registered
                this.setData({
                    user_name: app.globalData.user_name,
                    permission_level: app.globalData.permission_level,
                    restaurant_name: app.globalData.restaurant_name
                })

                if (app.globalData.loginSuccess) {
                    // set up the restaurtant picker
                    setPicker(this)
                }
            }
        }  
    },

    /**
     * When show the page, if the user didn't login, show the message.
     * If the user just get back from the register page, update info.
     * If the user just get navigated to this page because permission level 
     * is too low, show the message.
     */
    onShow: function () {
        tap_times = 0

        this.setData({
            loginSuccess: app.globalData.loginSuccess
        })

        console.log('Login success', app.globalData.loginSuccess)

        if (!app.globalData.loginSuccess && !app.globalData.logged) {
            wx.showToast({
                title: '登陆失败，请重新授权微信登录',
                icon: 'none'
            })
        } else if (!app.globalData.loginSuccess) {
            wx.showToast({
                title: '登陆失败，请点击重新登录',
                icon: 'none'
            })
        } else if (!app.globalData.logged) {
            // if the user didn't login, show the message
            wx.showToast({
                title: '请点击授权微信登录',
                icon: 'none'
            })
        } else if (app.globalData.permission_too_low) {
            // if the user is navigated to this page, because permission level is too low
            app.globalData.permission_too_low = false
            wx.showToast({
                title: '权限不足, 无法查看该页面',
                icon: 'none'
            })
        }

        if (app.globalData.registered && !this.data.registered) {
            // if user just registered from the registration page
            this.setData({
                registered: app.globalData.registered,
                user_name: app.globalData.user_name,
                permission_level: app.globalData.permission_level,
                restaurant_name: app.globalData.restaurant_name
            })

            setPicker(this)
        }

        if (app.globalData.new_restaurant_add) {
            app.globalData.new_restaurant_add = false

            this.setData({
                user_name: app.globalData.user_name,
                permission_level: app.globalData.permission_level,
                restaurant_name: app.globalData.restaurant_name
            })

            setPicker(this)
        }
    },

    /**
     * When the user pull down to refresh the page.
     * Refresh the user's name and permission level from the db
     */
    onPullDownRefresh: function() {
        if (app.globalData.registered && app.globalData.logged && app.globalData.loginSuccess) {
            refreshInfo(this)
        } else {
            wx.stopPullDownRefresh()
        }
    },

    /**
     * When the user click the log in button.
     * Update login state and userinfo.
     * 
     * @method onGetUserInfo
     * @param{Object} e The getuserinfo event
     */
    onGetUserInfo: function (e) {
        wx.showLoading({
            title: '登陆中',
            mask: true
        })

        app.globalData.loginSuccess = true
        this.setData({
            loginSuccess: true
        })

        // get the user's info
        userLogin(e, this)
    },

    /**
     * Retry to login the user.
     * 
     * @method retryLogin
     */
    retryLogin: async function () {
        wx.showLoading({
            title: '登陆中',
            mask: true
        })

        app.globalData.loginSuccess = true
        this.setData({
            loginSuccess: true
        })

        console.log('Retry user login process.')

        var log_info = {}

        // get user's info
        var info_res = await user.getUserInfomation()
        if (info_res.stat) {
            app.globalData.userInfo = info_res.result
            console.log('UserInfo: ', info_res.result)
            log_info.userInfo = info_res.result
        } else {
            // if failed in the process to get user's info
            app.globalData.loginSuccess = false
            page.setData({
                loginSuccess: false
            })

            realTimeLog.warn('User login failed.', log_info)
            wx.hideLoading()
            wx.showToast({
                title: '网络错误，请重新登录',
                icon: 'none'
            })
            return
        }

        this.setData({
            userInfo: app.globalData.userInfo
        })

        userLoginProcess(this, log_info)
    },

    /**
     * When the register button get triggered, 
     * navigate to the registration page
     */
    userRegister: function () {
        // navigate to the page to register
        wx.navigateTo({
            url: registration_page
        })
    },

    changeRestaurant: async function (e) {
        var target_restaurant_name = this.data.restaurant_array[parseInt(e.detail.value)]
        var target_restaurant_id = this.data.restaurants[target_restaurant_name]._id

        if (target_restaurant_id !== app.globalData.restaurant_id) {
            wx.showLoading({
                title: '切换中',
                mask: true
            })
            
            var info_result = await getUser()
            if (info_result.stat) {
                var update_result = await user.updateRecentRestaurant(app.globalData.uid, target_restaurant_id)
                if (update_result.stat) {
                    app.globalData.restaurant_id = target_restaurant_id
                    app.globalData.restaurant_name = target_restaurant_name
                    console.log('User switched to restaurant: ', target_restaurant_name, ' id: ', target_restaurant_id)

                    app.globalData.user_name = info_result.result[target_restaurant_id].name
                    console.log('User name in this restaurant: ', app.globalData.user_name)

                    app.globalData.permission_level = info_result.result[target_restaurant_id].permission_level
                    console.log('User permission level in this restaurant: ', app.globalData.permission_level)

                    this.setData({
                        user_name: app.globalData.user_name,
                        permission_level: app.globalData.permission_level,
                        restaurant_name: app.globalData.restaurant_name
                    })

                    realTimeLog.info('User ', app.globalData.uid, ' switched login to restaurant ', app.globalData.restaurant_name, ' id ', app.globalData.restaurant_id, 'with name ', app.globalData.user_name, ' permission level ', app.globalData.permission_level)

                    tap_times = 0

                    wx.hideLoading()
                    wx.showToast({
                        title: '切换成功'
                    })
                } else {
                    wx.hideLoading()
                    wx.showToast({
                        title: '网络错误，请重试',
                        icon: 'none'
                    })
                }
            } else {
                wx.hideLoading()
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                })
            }
        }
    },

    addRestaurant: function() {
        wx.navigateTo({
            url: add_restaurant_page
        })
    },

    upgradeUser: function() {
        tap_times++
        console.log('Tapped upgrade ', tap_times, ' times')

        if (tap_times > 2) {
            if (app.globalData.permission_level < 3) {
                console.log('Redirect to user upgrade page.')

                wx.navigateTo({
                    url: upgrade_page
                })
            } else {
                wx.showToast({
                    title: '权限已达到3级',
                    icon: 'none'
                })
            }
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
 * Search the user with the given openid.
 * Update the user's real name and permission level
 * 
 * @method refreshInfo
 * @param{Page} page The current page
 */
async function refreshInfo(page) {
    var info_result = await getUser()

    if (info_result.stat) {
        var user_info = info_result.result[app.globalData.restaurant_id]

        app.globalData.user_name = user_info.name
        app.globalData.permission_level = user_info.permission_level

        page.setData({
            user_name: user_info.name,
            permission_level: user_info.permission_level
        })

        console.log('Refresh user name ', user_info.name, ' with permission level ', user_info.permission_level)
    } else {
        wx.stopPullDownRefresh()
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })

        return
    }

    // get all the restaurants info
    var all_restaurant_res = await user.getAllRestaurant()
    if (all_restaurant_res.stat) {
        app.globalData.restaurant_info = all_restaurant_res.result
        console.log('Refresh restaurants info: ', all_restaurant_res.result)

        for (var i in all_restaurant_res.result) {
            if (all_restaurant_res.result[i]._id === app.globalData.restaurant_id) {
                app.globalData.restaurant_name = all_restaurant_res.result[i].name
                page.setData({
                    restaurant_name: app.globalData.restaurant_name
                })

                console.log('Refresh current restaurant name ', app.globalData.restaurant_name)
                break
            }
        }

        setPicker(page)

        wx.stopPullDownRefresh()
    } else {
        wx.stopPullDownRefresh()
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })

        return
    }
}


/**
 * Login the user and get the user's info.
 * 
 * @method userLogin
 * @param{Object} e The getuserinfo event
 * @param{Page} page The page
 */
function userLogin(e, page) {
    console.log('Start user login process.')

    var log_info = {}

    app.globalData.logged = true
    console.log('User logged in: ', true)
    log_info.logged = true

    app.globalData.userInfo = e.detail.userInfo
    console.log('UserInfo: ', e.detail.userInfo)
    log_info.userInfo = e.detail.userInfo

    page.setData({
        logged: app.globalData.logged,
        userInfo: app.globalData.userInfo
    })
    
    userLoginProcess(page, log_info)
}


async function userLoginProcess(page, log_info) {
    // get user's openid
    var open_res = await user.getOpenId()
    if (open_res.stat) {
        app.globalData.openid = open_res.result
        console.log('User openid: ', open_res.result)
        log_info.openid = open_res.result
    } else {
        // if failed in the process to get user's openid
        app.globalData.loginSuccess = false
        page.setData({
            loginSuccess: false
        })

        realTimeLog.warn('User login failed in the process to get user openid.', log_info)
        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重新登录',
            icon: 'none'
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
        page.setData({
            loginSuccess: false
        })

        realTimeLog.warn('User login failed in the process to get user registration info.', log_info)
        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重新登录',
            icon: 'none'
        })
        return
    }

    page.setData({
        registered: app.globalData.registered
    })

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

    // get the restaurant name
    var restaurant_res = await user.getRestaurantInfo(registration_res.result.registration.recent_restaurant)
    if (restaurant_res.stat) {
        app.globalData.restaurant_name = restaurant_res.result.name
        console.log('Selected restaurant: ', restaurant_res.result.name, ' id: ', app.globalData.restaurant_id)
        log_info.restaurant_name = restaurant_res.result.name
    } else {
        // if failed in the process to get restaurant info
        app.globalData.loginSuccess = false
        page.setData({
            loginSuccess: false
        })

        realTimeLog.warn('User login failed in the process to get restaurant info.', log_info)
        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重新登录',
            icon: 'none'
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
        page.setData({
            loginSuccess: false
        })

        realTimeLog.warn('User login failed in the process to get all the restaurant info.', log_info)
        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重新登录',
            icon: 'none'
        })
        return
    }

    console.log('User login process completed.')
    realTimeLog.info('User login succeeded.', log_info)

    page.setData({
        user_name: app.globalData.user_name,
        permission_level: app.globalData.permission_level,
        restaurant_name: app.globalData.restaurant_name
    })

    setPicker(page)

    wx.hideLoading()
}


function setPicker(page) {
    var restaurants = app.globalData.restaurant_info
    var formated_restaurants = {}
    var restaurants_key_name = {}
    for (var i in restaurants) {
        formated_restaurants[restaurants[i]._id] = restaurants[i]
        restaurants_key_name[restaurants[i].name] = restaurants[i]
    }
    
    var restaurant_registered = app.globalData.restaurant_registered
    var restaurant_array = []
    var restaurant_index = 0

    for (var i in restaurant_registered) {
        restaurant_array.push(formated_restaurants[i].name)

        if (formated_restaurants[i].name === app.globalData.restaurant_name) {
            restaurant_index = restaurant_array.length - 1
        }
    }

    page.setData({
        restaurant_array: restaurant_array,
        restaurant_index: restaurant_index,
        restaurants: restaurants_key_name
    })

    console.log('Set up the restaurant picker: ', restaurant_array)
    console.log('Set up the restaurant picker index: ', restaurant_index)
}


function getUser() {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        db.collection(db_user)
            .where({
                _id: app.globalData.uid
            })
            .get({
                success: res => {
                    if (res.data.length === 1) {
                        result['stat'] = true
                        result['result'] = res.data[0]
                    }
                    
                    resolve(result)
                },
                fail: err => {
                    realTimeLog.error('Failed to get current user info in the database.', err)
                    resolve(result)
                }
            })
    })
}
