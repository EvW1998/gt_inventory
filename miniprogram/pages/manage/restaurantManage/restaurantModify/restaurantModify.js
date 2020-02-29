/**
 * Modify a restaurant in the cloud database
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of real time logs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_restaurant = 'restaurant' // the collection of restaurants


Page({

    /**
     * Data for the page
     */
    data: {
        restaurant: {}, // the restaurant for modifying
        name_filled: false, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        invite_filled: false, // whether the invite code input is filled
        invite_warn_enable: false, // whether the warning icon for the invite code should be enabled
        upgrade_filled: false, // whether the upgrade code input is filled
        upgrade_warn_enable: false, // whether the warning icon for the upgrade code should be enabled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to register a new user in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page is loaded, search the given restaurant id in the database and store it in the page data.
     */
    onLoad: function () {
        wx.showLoading({
            title: '加载中'
        })

        setRestaurant(this)
    },

    /**
     * Check the input, set the name_filled to be true if the length is greater than 0,
     * enable the warning icon if the length is 0.
     * If all the inputs are filled, enable the confirm button.
     * 
     * @method nameInput
     * @param{Object} event The event of the input
     */
    nameInput: function (event) {
        var name_filled = true
        var button_enable = false
        var name_warn_enable = false
        var new_name = event.detail.value

        if (new_name.length === 0) {
            name_filled = false
            name_warn_enable = true
        }

        if (name_filled && this.data.invite_filled && this.data.upgrade_filled) {
            button_enable = true
        }

        this.setData({
            name_filled: name_filled,
            button_enable: button_enable,
            name_warn_enable: name_warn_enable
        })
    },

    /**
     * Check the input, set the invite_filled to be true if the length is greater than 0,
     * enable the warning icon if the length is 0.
     * If all the inputs are filled, enable the confirm button.
     * 
     * @method inviteInput
     * @param{Object} event The event of the input
     */
    inviteInput: function (event) {
        var invite_filled = true
        var button_enable = false
        var invite_warn_enable = false
        var new_invite_code = event.detail.value

        if (new_invite_code.length === 0) {
            invite_filled = false
            invite_warn_enable = true
        }

        if (invite_filled && this.data.name_filled && this.data.upgrade_filled) {
            button_enable = true
        }

        this.setData({
            invite_filled: invite_filled,
            button_enable: button_enable,
            invite_warn_enable: invite_warn_enable
        })
    },

    /**
     * Check the input, set the upgrade_filled to be true if the length is greater than 0,
     * enable the warning icon if the length is 0.
     * If all the inputs are filled, enable the confirm button.
     * 
     * @method upgradeInput
     * @param{Object} event The event of the input
     */
    upgradeInput: function (event) {
        var upgrade_filled = true
        var button_enable = false
        var upgrade_warn_enable = false
        var new_upgrade_code = event.detail.value

        if (new_upgrade_code.length === 0) {
            upgrade_filled = false
            upgrade_warn_enable = true
        }

        if (upgrade_filled && this.data.name_filled && this.data.invite_filled) {
            button_enable = true
        }

        this.setData({
            upgrade_filled: upgrade_filled,
            button_enable: button_enable,
            upgrade_warn_enable: upgrade_warn_enable
        })
    },

    /**
     * Modify the existed restaurant info, after input checks, upload to the cloud database.
     * 
     * @method formSubmit
     * @param{Object} e The submit event
     */
    formSubmit: async function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        this.setData({
            progress: 0,
            progress_text: '检查餐厅名称',
            progress_enable: true
        })

        var inputs = e.detail.value
        var restaurant = this.data.restaurant
        var update_restaurant = {}

        if (inputs.name !== restaurant.name) {
            var name_result = await repetitionCheck({ 'name': inputs.name })

            if (name_result.stat) {
                if (!name_result.result) {
                    update_restaurant['name'] = inputs.name
                } else {
                    this.setData({
                        progress: 0,
                        progress_text: '未开始',
                        progress_enable: false
                    })

                    wx.hideLoading()
                    wx.showModal({
                        title: '错误',
                        content: '修改后的餐厅名称与已有的餐厅名称重复，请修改后重试',
                        showCancel: false
                    })

                    return
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
            progress_text: '检查餐厅邀请码'
        })

        if (inputs.invite !== restaurant.invite_code) {
            var invite_result = await repetitionCheck({ 'invite_code': inputs.invite })

            if (invite_result.stat) {
                if (!invite_result.result) {
                    update_restaurant['invite_code'] = inputs.invite
                } else {
                    this.setData({
                        progress: 0,
                        progress_text: '未开始',
                        progress_enable: false
                    })

                    wx.hideLoading()
                    wx.showModal({
                        title: '错误',
                        content: '修改后的餐厅邀请码与已有的餐厅邀请码重复，请修改后重试',
                        showCancel: false
                    })

                    return
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

        if (inputs.upgrade !== restaurant.upgrade_code) {
            update_restaurant['upgrade_code'] = inputs.upgrade
        }

        this.setData({
            progress: 67,
            progress_text: '检查通过，正在上传修改内容'
        })

        if (Object.keys(update_restaurant).length !== 0) {
            var update_result = await updateRestaurant(update_restaurant)

            if (update_result.stat) {
                this.setData({
                    progress: 100,
                    progress_text: '修改成功'
                })

                if (update_restaurant.name !== undefined) {
                    app.globalData.restaurant_name = update_restaurant.name

                    app.globalData.new_restaurant_add = true
                }

                realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' changed the setting of restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id, ' with new data ', update_restaurant)

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
        } else {
            this.setData({
                progress: 100,
                progress_text: '修改成功'
            })

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
 * Search the restaurant with the given id, then store it in the page data.
 * 
 * @method setRestaurant
 * @param{Page} page The page
 */
function setRestaurant(page) {
    db.collection(db_restaurant)
        .where({
            _id: app.globalData.restaurant_id
        })
        .get({
            success: res => {
                if (res.data.length === 1) {
                    page.setData({
                        restaurant: res.data[0],
                        name_filled: true,
                        invite_filled: true,
                        upgrade_filled: true,
                        button_enable: true
                    })

                    console.log('Modify the current restaurant.', res.data[0])
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


function repetitionCheck(item) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        db.collection(db_restaurant)
            .field({
                _id: true
            })
            .where(item)
            .get({
                success: res => {
                    result['stat'] = true

                    if (res.data.length === 0) {
                        result['result'] = false
                    }

                    resolve(result)
                },
                fail: err => {
                    realTimeLog.error('Failed to get restaurants info from the database while checking repetition.', err)
                    resolve(result)
                }
            })
    })
}


function updateRestaurant(update_restaurant) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_restaurant,
                update_data: update_restaurant,
                uid: app.globalData.restaurant_id
            },
            success: res => {
                if (res.result.stats.updated !== 0) {
                    result['stat'] = true
                    result['result'] = res
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update restaurant info by using dbUpdate().', err)
                resolve(result)
            }
        })        
    })
}
