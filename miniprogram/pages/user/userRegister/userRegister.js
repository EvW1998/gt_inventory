/**
 * Page for user to register in this app, require user's real name,
 * and an invition code for registration.
 */
const user = require('../../../utils/user.js');
const pAction = require('../../../utils/pageAction.js')

const app = getApp()
const db_user = 'user' // the collection for the user in db

const info_page = '../userInfo/userInfo' // the url for the info page


Page({
    /**
     * Data for this page
     */
    data: {
        filled: false, // boolean for whether the two required info get filled
        filled_name: false, // boolean for whether the name info get filled
        filled_code: false, // boolean for whether the invition code get filled
        btn_state: "default" // the state for the confirm button
    },

    /**
     * When the page get loaded, show the message for registratoin.
     */
    onLoad: function () {
        if (!app.globalData.registered) {
            // let user know that he needs to register
            wx.showToast({
                title: '请注册',
                icon: 'none',
                duration: 1500
            })
        }
    },

    /**
     * Check whether the name val get filled.
     * 
     * @param{Object} e The value returned from the input text
     */
    checkBlur_name: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_name: true
            })

            if (this.data.filled_code) {
                // if the code input text also get filled with something
                this.setData({
                    // two required input both get filled, ready to submit
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_name: false,
                filled: false,
                btn_state: "default"
            })
        }
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
                filled_code: true
            })

            if (this.data.filled_name) {
                // if the name input text also get filled with something
                this.setData({
                    // two required input both get filled, ready to submit
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the code input text get filled with nothing
            this.setData({
                filled_code: false,
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
        if (e.detail.value.invite_code != app.globalData.invite_code) {
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

            // add this new user to the db
            this.addUser(e.detail.value.true_name)
        }
    },

    /**
     * Add the user's info to the db, and update the user info
     * 
     * @method addUser
     * @param{String} n The real name of the user
     */
    async addUser(n) {

        // use an object to hold the data that plans to add to db
        var add_user_data = {
            user_openid: app.globalData.openid,
            true_name: n,
            permission_level: app.globalData.permission_level
        }

        // add the user into the user collection
        var add_result = await user.addNewUser(add_user_data)

        // update the user info
        app.globalData.registered = true
        console.log('User registered in the App: ', app.globalData.registered)

        app.globalData.uid = add_result.result._id
        console.log('User uid: ', app.globalData.uid)

        app.globalData.true_name = n
        console.log('User real name: ', app.globalData.true_name)

        app.globalData.permission_level = 0
        console.log('User permission level: ', app.globalData.permission_level)

        pAction.navigateBackUser('注册成功', 1)
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
