/**
 *  This is the page for the menu of different settings
 */
const app = getApp()

Page({

  /**
   * Default data for the page
   */
  data: {

  },

  /**
   * When the page get loaded
   */
  onLoad: function () {
  },

  onShow: function() {
    if (app.globalData.permission_level < 2) {
      console.log('permission level too low')
      app.globalData.tolow = true
      wx.switchTab({
        url: '../me/me'
      })
    }
  },

  /***
   *  When the user wants to share this miniapp
   */
  onShareAppMessage: function () {
    return {
      title: 'GT库存',
      desc: '国泰餐厅库存管理程序',
      path: '/setting/setting'
    }
  }
})