/**
 * Page of upgrading the user permission level to level 3 in the current restaurant.
 */
const user = require('../../../utils/user.js'); // require the util of user
const realTimeLog = require('../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_restaurant = 'restaurant' // the collection of the restaurants
const db_user = 'user' // the collection of the users

var upgrade_code = '' // the upgrade code


Page({
    /**
     * Data for this page
     */
    data: {
        restaurant_name: '', // the current restaurant name
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
            restaurant_name: app.globalData.restaurant_name
        })

        setUpgradeCode(this)
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

        if (code_filled) {
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
            progress_text: '检查升级密码',
            progress_enable: true
        })

        if (inputs.code === upgrade_code) {
            this.setData({
                progress: 50,
                progress_text: '检查通过，正在升级'
            })

            var update_result = await user.upgradeRestaurantPermission(app.globalData.uid, app.globalData.restaurant_id)

            if (update_result.stat) {
                this.setData({
                    progress: 100,
                    progress_text: '升级成功'
                })

                app.globalData.new_restaurant_add = true

                app.globalData.permission_level = 3
                console.log('New user permission level: ', 3)

                realTimeLog.info('Existed user id ', app.globalData.uid, ' upgrade permssion level to 3 in restaurant ', app.globalData.restaurant_name, '.')
                pAction.navigateBackUser('升级成功', 1)

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
        } else {
            this.setData({
                progress: 0,
                progress_text: '未开始',
                progress_enable: false
            })

            wx.hideLoading()
            wx.showModal({
                title: '错误',
                content: '输入的升级密码无效',
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
 * Get the upgrade code for the current restaurant, and store it in the page data.
 * 
 * @method setUpgradeCode
 * @param{Page} page The page
 */
function setUpgradeCode(page) {
    db.collection(db_restaurant)
        .where({
            _id: app.globalData.restaurant_id
        })
        .get({
            success: res => {
                if (res.data.length === 1) {
                    upgrade_code = res.data[0].upgrade_code

                    console.log('Get upgrade code ', upgrade_code, 'of the current restaurant.')
                    wx.hideLoading()
                } else {
                    realTimeLog.error('Failed to get the upgrade code of the current restaurant from the database.', err)

                    wx.hideLoading()
                    wx.showToast({
                        title: '网络错误，请重试',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                realTimeLog.error('Failed to get the upgrade code of the current restaurant from the database.', err)

                wx.hideLoading()
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                })
            }
        })
}
