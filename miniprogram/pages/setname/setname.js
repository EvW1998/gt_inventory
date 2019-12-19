/**
 *  Page for user to register in this app, require user's real name,
 * and an invition code for register
 */

const app = getApp()
const db_user = 'user' // the collection for the user in db
const info_page = '../me/me' // the url for the info page


Page({

  /**
   *  Default data for this page
   */
  data: {
    filled: false, // boolean for whether the two required info get filled
    filled_name: false, // boolean for whether the name info get filled
    filled_code: false, // boolean for whether the invition code get filled
    btn_state: "default" // the state for the confirm button
  },

  /**
   *  When the page get loaded
   */
  onLoad: function (options) {
    if(!app.globalData.registered) {
      // let user know that he needs to register
      wx.showToast({
        title: '请注册',
        icon: 'none',
        duration: 1500
      })
    }
  },

  /**
   *  check whether the real name val get filled
   * 
   *  par e: the value returned from the input text
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
   *  check whether the invition code val get filled
   * 
   *  par e: the value returned from the input text
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
   *  When the confirm button triggered
   * 
   *  par e: the return val from the form submit
   */
  formSubmit: function (e) {
    if(e.detail.value.invite_code != app.globalData.invite_code) {
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

  /***
   *  Use cloud function dbAdd() to add the user's info to the db
   * 
   *  par n: the real name of the user
   */
  addUser: function(n) {
    app.globalData.permission_level = 0

    // use an object to hold the data that plans to add to db
    var add_user_data = {
      user_openid: app.globalData.openid,
      true_name: n,
      permission_level: app.globalData.permission_level
    }

    // call dbAdd() cloud function to add the user to database user
    wx.cloud.callFunction({
      name: 'dbAdd',
      data: {
        collection_name: db_user,
        add_data: add_user_data
      },
      success: res => {
        // if get a successed result
        app.globalData.registered = true
        console.log('user register success, uid: ', res.result._id)
        app.globalData.uid = res.result._id
        console.log('user registered real name: ', n)
        app.globalData.true_name = n

        wx.hideLoading()
        wx.showToast({
          title: '注册成功',
          duration: 1500,
          complete: function (res) {
            setTimeout(function () {
              // take the user back to the info page
              wx.switchTab({
                url: '../me/me',
              })
            }, 1500)
          }
        })
        
      },
      fail: err => {
        // if get a failed result
        console.error('failed to use cloud function dbAdd()', err)
      }
    })
  },

  /***
   *  When the user wants to share this miniapp
   */
  onShareAppMessage: function () {
    return {
      title: 'GT库存',
      desc: '国泰餐厅库存管理程序',
      path: '/setname/setname'
    }
  }
})
