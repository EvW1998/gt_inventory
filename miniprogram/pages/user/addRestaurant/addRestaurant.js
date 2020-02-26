/**
 * Page of adding new restaurant for the user.
 */
const user = require('../../../utils/user.js'); // require the util of user
const uInput = require('../../../utils/uInput.js'); // require the util of user inputs
const realTimeLog = require('../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_restaurant = 'restaurant' // the collection of the restaurants
const db_user = 'user' // the collection of the users


Page({
    /**
     * Data for this page
     */
    data: {
        restaurants: {}, // the restaurants
        name: '', // the name of the user
        name_filled: true, // whether the name of the user is filled
        name_warn_enable: false, // whether the warning icon of name should be enabled
        code_filled: false, // whether the invitation code of the user is filled
        code_warn_enable: false, // whether the warning icon of invitation code should be enabled
        button_enable: false, // whether the confirm button should be enabled
        progress: 0, // the process to register a new user in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page get loaded, show the message for registratoin.
     */
    onLoad: function () {
        wx.showLoading({
            title: '加载中'
        })

        this.setData({
            name: app.globalData.user_name
        })

        setInviteCode(this)
    },

    /**
     * Check the input of the user name. If the name is empty or includes non Chinese character, enable the warning.
     * If both name input and code input is filled, enable the confirm button.
     * 
     * @method nameInput
     * @param{Object} event The input event
     */
    nameInput: function (event) {
        var name_filled = true
        var name_warn_enable = false
        var button_enable = false
        var new_name = event.detail.value

        if (new_name.length === 0 || !uInput.isChinese(new_name)) {
            name_filled = false
            name_warn_enable = true
        }

        if (name_filled && this.data.code_filled) {
            button_enable = true
        }

        this.setData({
            name_filled: name_filled,
            name_warn_enable: name_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * Check the input of the invitation code. If the code is empty, enable the warning.
     * If both name input and code input is filled, enable the confirm button.
     * 
     * @method codeInput
     * @param{Object} event The input event
     */
    codeInput: function (event) {
        var code_filled = true
        var code_warn_enable = false
        var button_enable = false
        var code = event.detail.value

        if (code.length === 0) {
            code_filled = false
            code_warn_enable = true
        }

        if (this.data.name_filled && code_filled) {
            button_enable = true
        }

        this.setData({
            code_filled: code_filled,
            code_warn_enable: code_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * Check in the user name and invitation code. Add the user to the database if inputs are correct.
     * 
     * @method formSubmit
     * @param{Object} e The sumbit event
     */
    formSubmit: async function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        var inputs = e.detail.value

        this.setData({
            progress: 0,
            progress_text: '检查邀请码',
            progress_enable: true
        })

        if (inputs.code in this.data.restaurants) {
            var restaurant = this.data.restaurants[inputs.code]

            var restaurant_check = checkRestaurant(restaurant._id)

            if (restaurant_check) {
                this.setData({
                    progress: 33,
                    progress_text: '检查姓名'
                })

                var n_result = await isRepeated(inputs.name, restaurant._id)

                if (n_result) {
                    this.setData({
                        progress: 0,
                        progress_text: '未开始',
                        progress_enable: false
                    })

                    wx.hideLoading()
                    wx.showModal({
                        title: '错误',
                        content: '输入的姓名在此餐厅已被注册',
                        showCancel: false
                    })
                } else {
                    this.setData({
                        progress: 66,
                        progress_text: '检查通过，正在添加到数据库'
                    })

                    var user_data = await getUserData()

                    if (user_data.stat) {
                        var u_data= user_data.result
                        u_data[restaurant._id] = {}
                        u_data[restaurant._id]['name'] = inputs.name
                        u_data[restaurant._id]['permission_level'] = 0

                        u_data.restaurant_registered[restaurant._id] = restaurant._id

                        u_data.recent_restaurant = restaurant._id

                        var update_result = await user.updateUserRestaurant(u_data)

                        if (update_result.stat) {
                            this.setData({
                                progress: 100,
                                progress_text: '注册成功'
                            })

                            app.globalData.new_restaurant_add = true

                            app.globalData.restaurant_registered = u_data.restaurant_registered
                            console.log('New user restaurant registered: ', u_data.restaurant_registered)

                            app.globalData.restaurant_id = restaurant._id
                            app.globalData.restaurant_name = restaurant.name
                            console.log('New selected restaurant: ', restaurant.name, ' id: ', restaurant._id)

                            app.globalData.user_name = inputs.name
                            console.log('New user name: ', inputs.name)

                            app.globalData.permission_level = 0
                            console.log('New user permission level: ', 0)

                            realTimeLog.info('Existed user id ', app.globalData.uid, ' registered in a new restaurant ', restaurant.name, ' with user name ', inputs.name, '.')
                            pAction.navigateBackUser('添加成功', 1)

                        } else {
                            this.setData({
                                progress: 0,
                                progress_text: '未开始',
                                progress_enable: false
                            })

                            wx.hideLoading()
                            wx.showToast({
                                title: '网络错误，请重试',
                                icon: 'none'
                            })
                        }

                        /** 

                        var add_result = await user.addNewUser(add_user_data)

                        if (add_result.stat === 'success') {
                            var uid = add_result.result.result._id
                            if (uid === undefined) {
                                this.setData({
                                    progress: 0,
                                    progress_text: '未开始',
                                    progress_enable: false
                                })

                                wx.hideLoading()
                                wx.showToast({
                                    title: '网络错误，请重试',
                                    icon: 'none'
                                })
                            } else {
                                this.setData({
                                    progress: 100,
                                    progress_text: '注册成功'
                                })

                                app.globalData.registered = true
                                console.log('User registered: ', app.globalData.registered)

                                app.globalData.uid = uid
                                console.log('User uid: ', app.globalData.uid)

                                app.globalData.restaurant_id = restaurant._id
                                app.globalData.restaurant_name = restaurant.name
                                console.log('Selected restaurant: ', restaurant.name, ' id: ', app.globalData.restaurant_id)

                                app.globalData.restaurant_registered = {}
                                app.globalData.restaurant_registered[restaurant._id] = restaurant._id
                                console.log('User restaurant registered: ', app.globalData.restaurant_registered)

                                app.globalData.user_name = inputs.name
                                console.log('User name: ', app.globalData.user_name)

                                app.globalData.permission_level = 0
                                console.log('User permission level: ', app.globalData.permission_level)

                                realTimeLog.info('User ', inputs.name, ' registered in restaurant ', restaurant.name, ' with uid ', uid, '.')
                                pAction.navigateBackUser('注册成功', 1)
                            }
                        } else {
                            this.setData({
                                progress: 0,
                                progress_text: '未开始',
                                progress_enable: false
                            })

                            wx.hideLoading()
                            wx.showToast({
                                title: '网络错误，请重试',
                                icon: 'none'
                            })
                        }
                        */
                    } else {
                        this.setData({
                            progress: 0,
                            progress_text: '未开始',
                            progress_enable: false
                        })

                        wx.hideLoading()
                        wx.showToast({
                            title: '网络错误，请重试',
                            icon: 'none'
                        })
                    }
                }
            } else {
                this.setData({
                    progress: 0,
                    progress_text: '未开始',
                    progress_enable: false
                })

                wx.hideLoading()
                wx.showModal({
                    title: '错误',
                    content: '已在此餐厅注册',
                    showCancel: false
                })
            }
        } else {
            this.setData({
                progress: 0,
                progress_text: '未开始',
                progress_enable: false
            })

            wx.hideLoading()
            wx.showModal({
                title: '错误',
                content: '输入的邀请码无效',
                showCancel: false
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
 * Get the invite code of all the restaurants, and store them in the page data.
 * 
 * @method setInviteCode
 * @param{Page} page The page
 */
function setInviteCode(page) {
    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_restaurant,
            collection_limit: 100,
            collection_field: {},
            collection_where: {},
            collection_orderby_key: 'name',
            collection_orderby_order: 'asc'
        },
        success: res => {
            var restaurants = {}
            for (var i in res.result) {
                restaurants[res.result[i].invite_code] = res.result[i]
            }

            page.setData({
                restaurants: restaurants
            })

            console.log('Get all restaurants info for registering new users.', restaurants)
            wx.hideLoading()
        },
        fail: err => {
            realTimeLog.error('Failed to get restaurant info for registering new users.', err)

            wx.hideLoading()
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            })
        }
    })
}


/**
 * Check the user name whether has a repetition name in the same restaurant which the invitataion code points to.
 * 
 * @method isRepeated
 * @param{Object} n The user name
 * @param{String} r_id The restaurant id
 * @return{Promise} The state of the function. Resolve false when there is no repetition user.
 */
function isRepeated(n, r_id) {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'getUser',
            data: {
                r_id: r_id
            },
            success: res => {
                var n_result = false
                for (var i in res.result) {
                    if (n === res.result[i][r_id].name) {
                        n_result = true
                        break
                    }
                }

                resolve(n_result)
            },
            fail: err => {
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                })

                realTimeLog.error('Failed to get users in the restaruant with the given id by using getUser().', err)
                resolve(true)
            }
        })
    })
}


function checkRestaurant(restaurant_id) {
    var result = true
    for (var i in app.globalData.restaurant_registered) {
        if (i === restaurant_id) {
            result = false
        }
        break
    }

    return result
}


function getUserData() {
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
                    realTimeLog.error('Failed to get the current user info in the database.', err)
                    resolve(result)
                }
            })
    })
}
