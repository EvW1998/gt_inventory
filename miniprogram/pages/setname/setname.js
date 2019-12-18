// pages/setname/setname.js

const app = getApp()
const db_user = 'user' // the collection for the user in db
const info_page = '../me/me' // the url for the info page

Page({

  /**
   * 页面的初始数据
   */
  data: {
    filled: false,
    filled_name: false,
    filled_code: false,
    btn_state: "default"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  formSubmit: function (e) {
    if(e.detail.value.invite_code != app.globalData.invite_code) {
      wx.showToast({
        title: '邀请码错误',
        icon: 'none'
      })
    }
    else {
      wx.showLoading({
        title: '提交中',
        mask: true
      })
      this.addUser(e.detail.value.true_name)
    }
  },

  checkBlur_name: function(e) {
    if(e.detail.value != "") {
      this.setData({
        filled_name: true
      })

      if(this.data.filled_code) {
        this.setData({
          filled: true,
          btn_state: "primary"
        })
      }
    }
    else {
      this.setData({
        filled_name: false,
        filled: false,
        btn_state: "default"
      })
    }
  },

  checkBlur_code: function (e) {
    if (e.detail.value != "") {
      this.setData({
        filled_code: true
      })

      if (this.data.filled_name) {
        this.setData({
          filled: true,
          btn_state: "primary"
        })
      }
    }
    else {
      this.setData({
        filled_code: false,
        filled: false,
        btn_state: "default"
      })
    }
  },

  /***
   *  Use cloud function dbAdd() to add the user's info to the db
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
  }
})
