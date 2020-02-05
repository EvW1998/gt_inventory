/**
 * Page for user to register in this app, require user's real name,
 * and an invition code for registration.
 */
const user = require('../../../utils/user.js');
const pAction = require('../../../utils/pageAction.js')

const app = getApp()
const db_info = 'info'
const db_user = 'user' // the collection for the user in db


Page({
    /**
     * Data for this page
     */
    data: {
        filled: false, // boolean for whether the two required info get filled
        btn_state: "default" // the state for the confirm button
    },

    /**
     * When the page get loaded, show the message for registratoin.
     */
    onLoad: function () {

    },


    /**
     * Check whether the invition code val get filled.
     * 
     * @param{Object} e The value returned from the input text
     */
    checkBlur_code: function (e) {
        if (e.detail.value != "") {
            // if the code input text get filled with something
            this.setData({
                // two required input both get filled, ready to submit
                filled: true,
                btn_state: "primary"
            })
        }
        else {
            // if the code input text get filled with nothing
            this.setData({
                filled: false,
                btn_state: "default"
            })
        }
    },

    /**
     * When the confirm button triggered
     * 
     * @param{Object} e The return val from the form submit
     */
    formSubmit: function (e) {
        if (e.detail.value.upgrade_code != app.globalData.upgrade_code) {
            // if the invition code is wrong
            wx.showToast({
                title: '邀请码错误',
                icon: 'none'
            })
        }
        else {
            // block the user until his gets registered
            wx.showLoading({
                title: '提交中',
                mask: true
            })

            upgradePermissionLevel()
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


function upgradePermissionLevel() {
    var update_user_data = {}
    update_user_data['permission_level'] = 3

    wx.cloud.callFunction({
        name: 'dbUpdate',
        data: {
            collection_name: db_user,
            update_data: update_user_data,
            uid: app.globalData.uid
        },
        success: res => {
            console.log('Update user info success')
            app.globalData.permission_level = 3
            pAction.navigateBackUser('更改成功', 1)
        },
        fail: err => {
            // if get a failed result
            console.error('Failed to use cloud function dbUpdate()', err)
        }
    })
}
