//me.js
var util0 = require('../../utils/date.js');
var util = require('../../utils/findyesterday.js')
var util1 = require('../../utils/findthisweek.js')
var util2 = require('../../utils/findlastweek.js')
var util3 = require('../../utils/findweekday.js')
var util4 = require('../../utils/findtomorrow.js')
var util5 = require('../../utils/findnextweekfirstday.js')

const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    logged: true, // login state for the user
    userInfo: {}, // user's infomation
    avatarUrl: '', // avatar image url for the user
    openid: '', //user openid
    permission_level: 0, //user's permission level
    uid: ''
  },

  /***
   *  When load the page, update the login state
   * if logged in, update the userinfo
   */
  onLoad: function () {
    this.setData({
      logged: app.globalData.logged
    })

    if(this.data.logged) {
      this.setData({
        userInfo: app.globalData.userInfo,
        avatarUrl: app.globalData.userInfo.avatarUrl,
        openid: app.globalData.openid
      })
    }

    this.checkUser(app.globalData.openid)
  },

  /***
   *  If didn't log in, the login button will show up.
   * After clicking, update login state, and userinfo.
   */
  onGetUserInfo: function(e) {
    if (!this.data.logged && e.detail.userInfo) {
      app.globalData.logged = true
      app.globalData.userInfo = e.detail.userInfo

      this.setData({
        logged: app.globalData.logged,
        userInfo: app.globalData.userInfo,
        avatarUrl: app.globalData.userInfo.avatarUrl
      })

      console.log('user logged: ', app.globalData.logged)
      console.log('userinfo: ', app.globalData.userInfo)
      
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          app.globalData.openid = res.result.openid
          this.setData({
            openid: res.result.openid
          })

          console.log('user openid: ', app.globalData.openid)

          this.checkUser(app.globalData.openid)
        },
        fail: err => {
          console.error('failed to get user openid', err)
        }
      })
    }
  },

  checkUser: function(openid) {
    db.collection('user')
      .where({
        _openid: openid
      })
      .field({
        true_name: true,
        permission_level: true,
        _openid: true,
      })
      .orderBy('permission_level', 'desc')
      .get({
        success: res => {
          if (res.data.length == 0) {
            console.log('new user for this miniapp')
            this.addUser()
          }
          else {
            console.log('user exists in this miniapp')

            this.setData({
              permission_level: res.data[0].permission_level,
              uid: res.data[0]._id
            })
            app.globalData.permission_level = res.data[0].permission_level
            app.globalData.uid = res.data[0]._id
          }

        }
      })
  },

  onShareAppMessage: function () {
    return {
      title: 'GT库存',
      desc: '国泰餐厅库存管理程序',
      path: '/me/me'
    }
  },

  addUser: function () {
    app.globalData.permission_level = 0
    this.setData({
      permission_level: app.globalData.permission_level
    })

    var add_user_data = {
      user_openid: app.globalData.openid,
      true_name: app.globalData.userInfo.nickName,
      permission_level: app.globalData.permission_level
    }

    wx.cloud.callFunction({
      name: 'dbAdd',
      data: {
        collection_name: 'user',
        add_data: add_user_data
      },
      success: res => {
        console.log(res.result._id)
      },
      fail: err => {
        console.error('failed to use cloud function dbAdd()', err)
      }
    })
  },

  

  levelchange: function (e) {
    var new_level = e.detail.value
    db.collection('user').doc(this.data.uid)
      .update({
        data: {
          level: new_level
        },
        success: res => {
          console.log('level change success')
          this.setData({
            level: new_level
          })
          app.globalData.level = new_level

          wx.showToast({
            icon: 'none',
            title: '修改成功'
          })
        },
        fail: res => {
          console.log('level change fail')
          wx.showToast({
            icon: 'none',
            title: '修改失败'
          })
        }
      })
  }
})
