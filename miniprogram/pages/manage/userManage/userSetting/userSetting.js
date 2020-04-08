/**
 * Modify the selected user's name and permission level
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of real time logs
const uInput = require('../../../../utils/uInput.js') // require the util of user input
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection of users


Page({

    /**
     * Page data
     */
    data: {
        error_happened: true, // whether there is error happened while loading the selected user
        manage_id: '', // the id of the selected user
        manage_user: {},  // the selected user
        restaurant_id: '', // the current restaurant id
        max_level: 0, // the maximum level can be selected
        name_filled: false, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon of name input should display
        new_permission_level: 0, // the new permission level after modifying
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to update user data in percentage
        progress_text: '未开始', // the process to update user data in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When load the page
     * 
     * @param{Object} options The data passed to this page, key user_id for the user id selected.
     */
    onLoad: function (options) {
        try {
            var users = wx.getStorageSync('users')

            this.setData({
                error_happened: false,
                manage_id: options.user_id,
                manage_user: users[options.user_id],
                restaurant_id: app.globalData.restaurant_id,
                max_level: app.globalData.permission_level - 1,
                new_permission_level: users[options.user_id].permission_level,
                name_filled: true
            })
        } catch (err) {
            realTimeLog.error('Failed to get user data from the local stroage.', err)

            wx.showToast({
                title: '本地存储错误，请重试',
                icon: 'none'
            })
        }
    },

    /**
     * Check the input contents of the name of the user.
     * Rise the warning icon when the name is empty or there is no Chinese character.
     * Allow sumbit for updateing when the name is filled and permission level changed.
     * 
     * @method nameInput
     * @param{Object} event The event of the input
     */
    nameInput: function(event) {
        var name_filled = true
        var name_warn_enable = false
        var button_enable = false
        
        var input_name = event.detail.value

        if (input_name.length === 0 || !uInput.isChinese(input_name)) {
            name_filled = false
            name_warn_enable = true
        }

        if (name_filled) {
            button_enable = true
        }

        this.setData({
            name_filled: name_filled,
            name_warn_enable: name_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * Record the new permission level for the user.
     * If the name input is filled, enable the submit button.
     * 
     * @method levelInput
     * @param{Object} event The event of the slider change
     */
    levelInput: function (event) {
        var button_enable = false

        var input_level = event.detail.value

        if (this.data.name_filled) {
            button_enable = true
        }

        this.setData({
            new_permission_level: input_level,
            button_enable: button_enable
        })
    },

    /**
     * Update the user settings.
     * 
     * @method formSubmit
     * @param{Object} e The event of sumbit
     */
    formSubmit: function(event) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        updateUserProcess(this, event.detail.value)
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
 * Update the current user settings.
 * Make sure that the new user name does not has repeated name as other users in the current restaurant.
 * 
 * @method updateUserProcess
 * @param{Page} page The page
 * @param{Object} inputs The user inputs of user settings
 */
async function updateUserProcess(page, inputs) {
    page.setData({
        progress: 0,
        progress_text: '检查姓名是否重复',
        progress_enable: true
    })

    var user_original = page.data.manage_user
    var update_user = {}

    if (inputs.name !== user_original.name) {
        // if the name of the user is modified, check whether the name is repeated to other users in the current restaurant.
        var name_result = await isRepeated(inputs.name, app.globalData.restaurant_id)

        if (name_result.stat) {
            if (!name_result.result.repetition) {
                update_user['name'] = inputs.name
            } else {
                page.setData({
                    progress: 0,
                    progress_text: '未开始',
                    progress_enable: false
                })

                wx.hideLoading()

                var name_content = '修改后的员工姓名与已有员工 ' + name_result.result.repetition_name + ' 重复，请修改后重试。'
                wx.showModal({
                    title: '姓名重复',
                    content: name_content,
                    showCancel: false
                })

                return
            }
        } else {
            page.setData({
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

    if (page.data.new_permission_level !== user_original.permission_level) {
        // if the permission level of the user is modified
        update_user['permission_level'] = page.data.new_permission_level
    }

    page.setData({
        progress: 50,
        progress_text: '检查通过，正在上传修改内容'
    })

    if (Object.keys(update_user).length !== 0) {
        var update_data = {}
        update_data[app.globalData.restaurant_id] = update_user
        var update_result = await updateUser(update_data, page.data.manage_id)

        if (update_result.stat) {
            page.setData({
                progress: 100,
                progress_text: '上传成功'
            })

            realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified the setting of user ', user_original, ' with new data ', update_user)

            pAction.navigateBackUser('修改成功', 1)
        } else {
            page.setData({
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
    } else {
        page.setData({
            progress: 100,
            progress_text: '无修改内容'
        })

        pAction.navigateBackUser('员工信息无修改', 1, 'none')
    }
}


/**
 * Check the user name whether has a repetition name in the same restaurant.
 * 
 * @method isRepeated
 * @param{Object} n The user name
 * @param{String} r_id The restaurant id
 * @return{Promise} The state of the function. Resolve with the result of the name checking.
 */
function isRepeated(n, r_id) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = {}
        result['result']['repetition'] = false
        result['result']['repetition_name'] = undefined

        wx.cloud.callFunction({
            name: 'getUser',
            data: {
                r_id: r_id
            },
            success: res => {
                result['stat'] = true

                for (var i in res.result) {
                    if (n === res.result[i][r_id].name) {
                        result['result']['repetition'] = true
                        result['result']['repetition_name'] = res.result[i][r_id].name
                        break
                    }
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to get users in the restaruant with the given id by using getUser().', err)
                resolve(result)
            }
        })
    })
}


/**
 * Update the user data to the database.
 * 
 * @method updateUser
 * @param{Object} update_user_data The update data
 * @param{String} uid The user id for updating
 * @return{Promise} The state of the function. Resolve with the result of updating.
 */
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
