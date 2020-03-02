/**
 * Update the selected user's name and permission level
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of real time logs
const uInput = require('../../../../utils/uInput.js') // require the util of user input
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection of users


Page({

    /**
     * Data for the page
     */
    data: {
        manage_id: '', // the uid of the selected user
        manage_user: {},  // the selected user
        restaurant_id: '', // the current restaurant id
        max_level: 0, // the maximum level can be selected
        button_enable: true, // whether the sumbit button is enabled
        warn_enable: false, // whether the warning icon should display
        progress: 0, // the process to register a new user in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page is loaded
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中'
        })

        this.setData({
            manage_id: options.title,
            restaurant_id: app.globalData.restaurant_id,
            max_level: app.globalData.permission_level - 1
        })

        searchUser(options.title, this)
    },

    nameInput: function(event) {
        var button_enable = true
        var warn_enable = false
        var new_name = event.detail.value

        if (new_name.length === 0 || !uInput.isChinese(new_name)) {
            button_enable = false
            warn_enable = true
        }

        this.setData({
            button_enable: button_enable,
            warn_enable: warn_enable
        })
    },

    /**
     * When the confirm button triggered, update the selected user info
     * 
     * @method formSubmit
     * @param{Object} e The return val from the form submit
     */
    formSubmit: async function(e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        var inputs = e.detail.value
        var update_user_data = {} // the new user info needs to be updated

        this.setData({
            progress: 0,
            progress_text: '检查姓名',
            progress_enable: true
        })

        if (inputs.name !== this.data.manage_user[app.globalData.restaurant_id].name) {
            var n_result = await isRepeated(inputs.name, app.globalData.restaurant_id)

            if (n_result.stat) {
                if (n_result.result) {
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

                    return
                } else {
                    update_user_data['name'] = inputs.name
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

                return
            }
        }

        this.setData({
            progress: 33,
            progress_text: '检查权限'
        })

        if (inputs.level !== this.data.manage_user.permission_level) {
            // if the user's permission level is changed
            if (inputs.level === '') {
                update_user_data['permission_level'] = 0
            }
            else {
                update_user_data['permission_level'] = inputs.level
            }
        }

        this.setData({
            progress: 67,
            progress_text: '检查通过，正在上传'
        })

        if (Object.keys(update_user_data).length !== 0) {
            var update_data = {}
            update_data[app.globalData.restaurant_id] = update_user_data
            var update_result = await updateUser(update_data, this.data.manage_id)

            if (update_result.stat) {
                this.setData({
                    progress: 100,
                    progress_text: '上传成功'
                })

                realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modify the user info ', update_user_data)
                pAction.navigateBackUser('修改成功', 1)
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

                return
            }
        }
        else {
            console.log('No use info changed。')
            pAction.navigateBackUser('修改成功', 1)
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
 * Search the user by given uid in the database.
 * Then set the return data to the page data.
 * 
 * @method searchUser
 * @param{String} uid The user id
 * @param{Page} page The page
 */
function searchUser(uid, page) {
    var collection_field = {}
    collection_field['_id'] = true
    collection_field[app.globalData.restaurant_id] = true

    db.collection(db_user)
        .where({
            _id: uid
        })
        .field(collection_field)
        .get({
            success: res => {
                if (res.data.length === 1) {
                    page.setData({
                        manage_user: res.data[0]
                    })

                    console.log('Modify the user.', res.data[0])
                    wx.hideLoading()
                } else {
                    realTimeLog.error('Failed to get user info from the database while modifying a user.', res)
                    wx.hideLoading()
                    wx.showToast({
                        title: '网络错误，请重试',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                realTimeLog.error('Failed to get user info from the database while modifying a user.', err)
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
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'getUser',
            data: {
                r_id: r_id
            },
            success: res => {
                result['stat'] = true

                var n_result = false
                for (var i in res.result) {
                    if (n === res.result[i][r_id].name) {
                        n_result = true
                        break
                    }
                }

                result['result'] = n_result
                resolve(result)
            },
            fail: err => {
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                })

                realTimeLog.error('Failed to get users in the restaruant with the given id by using getUser().', err)
                resolve(result)
            }
        })
    })
}


function updateUser(update_user_data, uid) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_user,
                update_data: update_user_data,
                uid: uid
            },
            success: res => {
                result['stat'] = true
                result['result'] = res

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update user info by using dbUpdate().', err)
                resolve(result)
            }
        })
    })
}
