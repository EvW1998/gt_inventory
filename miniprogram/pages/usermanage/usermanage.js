/**
 *  This page for the manager to select users in this app,
 * to change their permission level and real name.
 */

const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db


Page({

  /**
   * Default data for this page
   */
  data: {
    user: {}, //an object to store all userinfo
    permission_level: 0
  },

  /**
   * When the page get loaded
   */
  onLoad: function () {
    this.setData({
      permission_level: app.globalData.permission_level
    })
  },

  /**
   * When the page showed
   */
  onShow: function () {
    // get all userinfo from the db
    wx.showLoading({
      title: '加载中',
      mask: true
    })

    this.getAllUserInfo()
  },

  /**
   *  Get all users in the db
   */
  getAllUserInfo: function() {
    db.collection(db_user)
      .field({
        true_name: true,
        permission_level: true,
        user_openid: true,
        _id: true
      })
      .orderBy('permission_level', 'desc')
      .get({
        success: res => {
          this.setData({
            user: res.data
          })

          console.log('All user info: ', res.data)

          wx.hideLoading()
        },
        fail: res => {
          console.error('Failed to get all userinfo', res)
          wx.hideLoading()
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
      path: '/usermanage/usermanage'
    }
  }
})