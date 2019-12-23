const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db
const db_menu = 'menu' // the collection for the menu in db
const db_submenu = 'submenu' // the collection for the submenu in db
const register_page = '../setname/setname' // the url for the register page
const info_page = '../me/me' // the url for the info page

Page({
  data: {
    currentTab: 0,
    flag: 0,
    openid: '',
    level: 0,
    firstLoad: true,
    menu: {},
    submenu: {}
  },

  /***
   *   When loading the default page, check whether the user logged in,
   * if not, block the user until get userinfo back
   */
  onLoad: function() {
    if(!app.globalData.logged) {
      this.loginUser()

      wx.showLoading({
        title: '登录中',
        mask: true
      })
    }
  },

  /***
   *   When show the default page
   */
  onShow: function() {
    if(!this.data.firstLoad) {
      if (app.globalData.permission_level < 1) {
        console.log('permission level too low')
        app.globalData.tolow = true
        wx.switchTab({
          url: '../me/me'
        })
      }
    }

    this.getMenu()
  },

  /**
   *  Connect to the wx server, get userinfo
   */
  loginUser: function () {
    // get the setting info from wx server
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // if get user authorization
          app.globalData.logged = true
          console.log('user logged: ', app.globalData.logged)

          // get userinfo from the server
          wx.getUserInfo({
            success: res => {
              // if get a successed result
              app.globalData.userInfo = res.userInfo
              console.log('userinfo: ', app.globalData.userInfo)
            },
            fail: res => {
              // if get a failed result
              console.error('failed to get userinfo', res)
            }
          })

          // use cloud function login() to get user openid
          wx.cloud.callFunction({
            name: 'login',
            data: {},
            success: res => {
              // if get a successed result
              app.globalData.openid = res.result.openid
              console.log('user openid: ', app.globalData.openid)

              // check the user register state in this app by openid
              this.checkUser(app.globalData.openid)
            },
            fail: err => {
              // if get a failed result
              console.error('failed to get user openid', err)
            }
          })
        }
        else {
          // if did not get user authorization
          console.log('user logged: ', app.globalData.logged)

          wx.hideLoading()

          this.setData({
            firstLoad: false
          })

          wx.switchTab({
            url: info_page,
          })
        }
      },
      fail: res => {
        // if get a failed result
        console.error('failed to getSetting', err)
      }
    })
  },

  /***
   * par openid(String): the openid that try to find in the user db
   * 
   *  Check whether user exist in the user database,
   * if not, navigate to the page to set real name and invite code,
   * if user exists, record the uid in database.
   */
  checkUser: function (openid) {
    db.collection(db_user)
      .where({
        // use the user's openid to looking for the user
        user_openid: openid
      })
      .field({
        true_name: true,
        permission_level: true,
        user_openid: true,
      })
      .orderBy('permission_level', 'desc')
      .get({
        success: res => {
          // if get a successed result
          if (res.data.length == 0) {
            // if this openid didn't found in the database
            console.log('checkUser: new user')

            wx.hideLoading()

            // navigate to the page to set name
            wx.navigateTo({
              url: register_page
            })
          }
          else {
            // the user exists in the database, get his permission level and uid
            console.log('checkUser: user exists')
            console.log('user uid: ', res.data[0]._id)
            console.log('user real name: ', res.data[0].true_name)

            app.globalData.registered = true
            app.globalData.permission_level = res.data[0].permission_level
            app.globalData.uid = res.data[0]._id
            app.globalData.true_name = res.data[0].true_name

            wx.hideLoading()

            this.setData({
              firstLoad: false
            })

            if (app.globalData.permission_level < 1) {
              console.log('permission level too low')
              app.globalData.tolow = true
              wx.switchTab({
                url: '../me/me'
              })
            }
          }
        }
      })
  },

  getMenu: function() {
    db.collection(db_menu)
      .field({
        _id: true,
        menu_id: true,
        menu_name: true
      })
      .orderBy('menu_id', 'asc')
      .get({
        success: res => {
          this.setData({
            menu: res.data
          })

          var sm = {}

          for(var i in this.data.menu) {
            db.collection(db_submenu)
              .where({
                menu_id: this.data.menu[i].menu_id
              })
              .orderBy('submenu_id', 'asc')
              .get({
                success: res1 => {
                  if(res1.data.length != 0) {
                    sm[res1.data[0].menu_id] = res1.data

                    this.setData({
                      submenu: sm
                    })
                  }
                }
              })
          }
        },
        fail: res => {
          console.error('Failed to get menu', res)
        }
      })
  },

  switchNav: function (e) {
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
