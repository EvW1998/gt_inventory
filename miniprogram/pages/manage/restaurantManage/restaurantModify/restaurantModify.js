/**
 * Modify the current restaurant settings.
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of real time logs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_restaurant = 'restaurant' // the collection of restaurants


Page({

    /**
     * Page data
     */
    data: {
        error_happened: true, // whether there is error happened while loading the restaurant
        restaurant: {}, // the restaurant for modifying
        name_filled: false, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        invite_filled: false, // whether the invite code input is filled
        invite_warn_enable: false, // whether the warning icon for the invite code should be enabled
        upgrade_filled: false, // whether the upgrade code input is filled
        upgrade_warn_enable: false, // whether the warning icon for the upgrade code should be enabled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to update the restaurant setting in percentage
        progress_text: '未开始', // the process to update the restaurant setting in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When load the page
     */
    onLoad: function () {
        wx.showLoading({
            title: '加载中'
        })

        setRestaurant(this)
    },

    /**
     * Check the input contents of the name of the restaurant.
     * Rise the warning icon when the name is empty.
     * Allow sumbit for updateing when all inputs contents are filled.
     * 
     * @method nameInput
     * @param{Object} event The event of the input
     */
    nameInput: function (event) {
        var name_filled = true
        var name_warn_enable = false
        var button_enable = false
        
        var input_name = event.detail.value

        if (input_name.length === 0) {
            name_filled = false
            name_warn_enable = true
        }

        if (name_filled && this.data.invite_filled && this.data.upgrade_filled) {
            button_enable = true
        }

        this.setData({
            name_filled: name_filled,
            name_warn_enable: name_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * Check the input contents of the invitation code of the restaurant.
     * Rise the warning icon when the invitation code is empty.
     * Allow sumbit for updateing when all inputs contents are filled.
     * 
     * @method inviteInput
     * @param{Object} event The event of the input
     */
    inviteInput: function (event) {
        var invite_filled = true
        var invite_warn_enable = false
        var button_enable = false
        
        var input_invite = event.detail.value

        if (input_invite.length === 0) {
            invite_filled = false
            invite_warn_enable = true
        }

        if (invite_filled && this.data.name_filled && this.data.upgrade_filled) {
            button_enable = true
        }

        this.setData({
            invite_filled: invite_filled,
            invite_warn_enable: invite_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * Check the input contents of the upgrade code of the restaurant.
     * Rise the warning icon when the upgrade code is empty.
     * Allow sumbit for updateing when all inputs contents are filled.
     * 
     * @method upgradeInput
     * @param{Object} event The event of the input
     */
    upgradeInput: function (event) {
        var upgrade_filled = true
        var upgrade_warn_enable = false
        var button_enable = false
        
        var input_upgrade = event.detail.value

        if (input_upgrade.length === 0) {
            upgrade_filled = false
            upgrade_warn_enable = true
        }

        if (upgrade_filled && this.data.name_filled && this.data.invite_filled) {
            button_enable = true
        }

        this.setData({
            upgrade_filled: upgrade_filled,
            upgrade_warn_enable: upgrade_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * Update the restaruant settings with new name, invitation code or upgrade code.
     * 
     * @method formSubmit
     * @param{Object} event The submit event
     */
    formSubmit: async function (event) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        updateRestaurantProcess(this, event.detail.value)
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
 * Search the current restaurant in the database.
 * If found, store the info in the page data.
 * 
 * @method setRestaurant
 * @param{Page} page The page
 */
function setRestaurant(page) {
    db.collection(db_restaurant)
        .where({
            _id: app.globalData.restaurant_id
        })
        .field({
            category_amount: false,
            check_left: false
        })
        .get({
            success: res => {
                if (res.data.length === 1) {
                    page.setData({
                        error_happened: false,
                        restaurant: res.data[0],
                        name_filled: true,
                        invite_filled: true,
                        upgrade_filled: true
                    })

                    if (app.globalData.debug) {
                        console.log('Modify the current restaurant ', res.data[0].name)
                    }
                    wx.hideLoading()
                } else {
                    realTimeLog.error('Failed to get current restaurant info from the database.', res)

                    wx.hideLoading()
                    wx.showToast({
                        title: '网络错误，请重试',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                realTimeLog.error('Failed to get current restaurant info from the database.', err)

                wx.hideLoading()
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                })
            }
        })
}


/**
 * Update the current restaurant settings.
 * Make sure that the new settings does not has repeated name or invitation code as other restaurants.
 * 
 * @method updateRestaurantProcess
 * @param{Page} page The page
 * @param{Object} inputs The user inputs of restaurant settings
 */
async function updateRestaurantProcess(page, inputs) {
    page.setData({
        progress: 0,
        progress_text: '检查餐厅名称',
        progress_enable: true
    })

    var restaurant_original = page.data.restaurant
    var update_restaurant = {}

    if (inputs.name !== restaurant_original.name) {
        // if the name of the restaurant is modified, check whether the name is repeated to other restaurants.
        var name_check = {}
        name_check['name'] = inputs.name

        var name_result = await uInput.isRepeated(db_restaurant, name_check)

        if (name_result.stat) {
            if (!name_result.result.repetition) {
                update_restaurant['name'] = inputs.name
            } else {
                page.setData({
                    progress: 0,
                    progress_text: '未开始',
                    progress_enable: false
                })

                wx.hideLoading()

                var name_content = '修改后的餐厅名称与已有餐厅 ' + name_result.result.repetition_name + ' 的名称重复，请修改后重试。'
                wx.showModal({
                    title: '名称重复',
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

    page.setData({
        progress: 33,
        progress_text: '检查餐厅邀请码'
    })

    if (inputs.invite !== restaurant_original.invite_code) {
        // if the invitation code of the restaurant is modified, check whether the code is repeated to other restaurants.
        var invite_check = {}
        invite_check['invite_code'] = inputs.invite

        var invite_result = await uInput.isRepeated(db_restaurant, invite_check)

        if (invite_result.stat) {
            if (!invite_result.result.repetition) {
                update_restaurant['invite_code'] = inputs.invite
            } else {
                page.setData({
                    progress: 0,
                    progress_text: '未开始',
                    progress_enable: false
                })

                wx.hideLoading()

                var invite_content = '修改后的餐厅邀请码与已有餐厅 ' + invite_result.result.repetition_name + ' 的邀请码重复，请修改后重试。'
                wx.showModal({
                    title: '邀请码重复',
                    content: invite_content,
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

    if (inputs.upgrade !== restaurant_original.upgrade_code) {
        // if the upgarde code of the restaurant is modified
        update_restaurant['upgrade_code'] = inputs.upgrade
    }

    page.setData({
        progress: 67,
        progress_text: '检查通过，正在上传修改内容'
    })

    if (Object.keys(update_restaurant).length !== 0) {
        var update_result = await updateRestaurant(update_restaurant)

        if (update_result.stat) {
            page.setData({
                progress: 100,
                progress_text: '上传成功'
            })

            if (update_restaurant.name !== undefined) {
                app.globalData.restaurant_name = update_restaurant.name
                app.globalData.new_restaurant_add = true
            }

            realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified the setting of restaurant ', restaurant_original, ' with new data ', update_restaurant)

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

        pAction.navigateBackUser('餐厅设置无修改', 1, 'none')
    }
}


/**
 * Update the given restaurant settings by using cloud function dbUpdate.
 * 
 * @method updateRestaurant
 * @param{Object} update_restaurant The new restaurant settings for updating
 * @return{Promise} The state of the function. Resolve with the stat of the dbUpdate result.
 */
function updateRestaurant(update_restaurant) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_restaurant,
                update_data: update_restaurant,
                uid: app.globalData.restaurant_id
            },
            success: res => {
                if (res.result.stats.updated === 1) {
                    result['stat'] = true
                    result['result'] = res
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update restaurant settings by using dbUpdate().', err)
                resolve(result)
            }
        })        
    })
}
