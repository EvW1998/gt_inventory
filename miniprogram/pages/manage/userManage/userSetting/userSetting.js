/**
 * Update the selected user's name and permission level
 */
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
        max_level: 0, // the maximum level can be selected
        filled_name: true, // whether the name input is filled
        btn_state: "primary" // the state for the confirm button
    },

    /**
     * When the page is loaded
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        this.setData({
            manage_id: options.title,
            max_level: app.globalData.permission_level - 1
        })

        this.searchUser(options.title)
    },

    /**
     * Search the user by given uid in the database.
     * Then set the return data to the page data.
     * 
     * @method searchUser
     * @param{String} uid The user id in the App
     */
    searchUser: function(uid) {
        db.collection(db_user)
            .where({
                _id: uid
            })
            .get({
                success: res => {
                    this.setData({
                        manage_user: res.data[0]
                    })

                    console.log('Manage the user', this.data.manage_user)
                    wx.hideLoading()
                }
            })
    },

    /**
     * Check whether the real name val get filled
     * 
     * @method checkBlur_name
     * @param{Object} e The value returned from the input text
     */
    checkBlur_name: function(e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_name: true,
                btn_state: "primary"
            })
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_name: false,
                btn_state: "default"
            })
        }
    },

    /**
     * When the confirm button triggered, update the selected user info
     * 
     * @method formSubmit
     * @param{Object} e The return val from the form submit
     */
    formSubmit: function(e) {
        wx.showLoading({
            title: '提交中',
            mask: true
        })

        var update_user_data = {} // the new user info needs to be updated

        if (e.detail.value.name != this.data.manage_user.true_name) {
            // if the user's real name is changed
            update_user_data['true_name'] = e.detail.value.name
        }

        if (e.detail.value.level != this.data.manage_user.permission_level) {
            // if the user's permission level is changed
            if (e.detail.value.level == '') {
                update_user_data['permission_level'] = 0
            }
            else {
                update_user_data['permission_level'] = e.detail.value.level
            }
        }

        if (Object.keys(update_user_data).length != 0) {

            var legal_input = isChinese(e.detail.value.name)

            if(legal_input) {
                // if there is a user info changed
                // call dbUpdate() cloud function to update the userinfo
                wx.cloud.callFunction({
                    name: 'dbUpdate',
                    data: {
                        collection_name: db_user,
                        update_data: update_user_data,
                        uid: this.data.manage_id
                    },
                    success: res => {
                        console.log('Update user info success')
                        pAction.navigateBackUser('更改成功', 1)
                    },
                    fail: err => {
                        // if get a failed result
                        console.error('failed to use cloud function dbUpdate()', err)
                    }
                })
            } else {
                wx.hideLoading()
                wx.showToast({
                    title: '输入中文',
                    icon: 'none'
                })
            }
        }
        else {
            console.log('No use info changed')
            pAction.navigateBackUser('更改成功', 1)
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
 * Return whether the string is all Chinese characters.
 * 
 * @method isChinese
 * @param{String} str The string for testing
 * @return{Boolean} whether the string is all Chinese characters
 */
function isChinese(str) {
    var reg = /^[\u4e00-\u9fa5]*$/
    if (!reg.test(str)) {
        return false
    } else {
        return true
    }
}
