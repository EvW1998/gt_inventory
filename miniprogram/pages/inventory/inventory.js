const app = getApp()

Page({
  data: {
    currentTab: 0,
    flag: 0,
    openid: '',
    level: 0
  },

  /***
   *   When loading the default page
   */
  onLoad: function() {
  },

  /***
   *   When show the default page, first check whether the user logged in
   * if not, redirect to the setting page
   */
  onShow: function() {
    if(!app.globalData.logged) {
      // redirect to the setting page to let user log in or register
      wx.showToast({
        title: '请登录',
        mask: true,
        icon: 'none',
        duration: 1500,
        complete: function (res) {
          setTimeout(function () {
            wx.switchTab({
              url: '../me/me',
            })
          }, 1500)
        }
      })
    }
  },

  switchNav: function (e) {
    console.log(e);
    var page = this;
    var id = e.target.id;
    if (this.data.currentTab == id) {
      return false;
    } else {
      page.setData({ currentTab: id });
    }
    page.setData({ flag: id });
  },

  onShareAppMessage: function () {
    return {
      title: 'GT库存',
      desc: '国泰餐厅库存管理程序',
      path: '/index/index'
    }
  },

  pageOnDevelopment: function() {
    wx.showToast({
      icon: 'none',
      title: '敬请期待'
    })
  }
})
