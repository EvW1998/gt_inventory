const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db
const db_menu = 'menu' // the collection for the menu in db
const db_submenu = 'submenu' // the collection for the submenu in db
const db_stock = 'stock' // the collection for the submenu in db
const register_page = '../setname/setname' // the url for the register page
const info_page = '../me/me' // the url for the info page

var util = require('../../utils/util.js');

Page({
  data: {
    currentTab: 0,
    flag: 0,
    firstLoad: true,
    menu: {},
    submenu: {},
    left_checked: false,
    stock_value: {},
    btn_name: '确认余量',
    yesterday_cost: {},
    warning_item: {},
    notfilled_item: {},
    state: {}
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

                    if (Object.keys(this.data.menu).length == Object.keys(this.data.submenu).length) {
                      this.getState()
                      
                      this.getStock()

                      
                    }
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



  formSubmit: function(e) {
    
    if(this.data.left_checked == false) {
      this.setData({
        left_checked: true,
        btn_name: '确认补货'
      })

      var today_left = e.detail.value
      var yc = {}

      for(var i in today_left) {
        if(today_left[i] == "") {
          today_left[i] = this.data.stock_value[i]
        }
        else {
          today_left[i] = parseInt(today_left[i])
        }

        yc[i] = this.data.stock_value[i] - today_left[i]
      }

      this.setData({
        yesterday_cost: yc
      })

      console.log(this.data.yesterday_cost)
    }
    else {
      wx.showLoading({
        title: '上传中',
        mask: true
      })

      var total = 0
      var normal = 0
      var warning = 0
      var not_filled = 0
      var today_filled = e.detail.value
      var new_stock_value = this.data.stock_value
      var new_warning_item = {}
      var new_notfilled_item = {}

      for (var i in today_filled) {
        total = total + 1

        if (today_filled[i] == "" || today_filled[i] == "0") {
          today_filled[i] = 0
          not_filled = not_filled + 1

          new_notfilled_item[i] = 0        
        }
        else {
          today_filled[i] = parseInt(today_filled[i])
        }

        new_stock_value[i] = new_stock_value[i] - this.data.yesterday_cost[i] + today_filled[i]

        if(today_filled[i] < this.data.yesterday_cost[i]) {
          warning = warning + 1

          new_warning_item[i] = this.data.yesterday_cost[i] - today_filled[i]
        }
      }

      this.setData({
        stock_value: new_stock_value,
      })

      normal = total - warning - not_filled

      console.log(total, normal, warning, not_filled)

      var new_notfilled_name = {}
      var new_warning_name = {}

      for(var i in new_notfilled_item) {
        db.collection('stock')
          .where({
            submenu_id: i
          })
          .get({
            success: res => {
              new_notfilled_name[res.data[0]._id] = {'_id': res.data[0]._id, 'value': 0}

              if(Object.keys(new_notfilled_name).length == not_filled &&
                            Object.keys(new_warning_name).length == warning) {
                this.setData({
                  notfilled_item: new_notfilled_name,
                  warning_item: new_warning_name
                  
                })

                console.log('Not filled: ', this.data.notfilled_item)
                console.log('Warning: ', this.data.warning_item)

                var time = util.formatTime(new Date())
                var detail = ''

                detail = detail + '异常补货' + warning.toString() + '项\n' + '未补货' + not_filled.toString() + '项'

                this.setState(this.data.notfilled_item, this.data.warning_item)

                db.collection('user')
                  .where({
                    permission_level: 2
                  })
                  .get({
                    success: res1 => {            
                      for(var u in res1.data) {
                        wx.cloud.callFunction({
                          name: 'sendMessage',
                          data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                          },
                          success: res => {
                            console.log(res)

                            wx.hideLoading()

                          },
                          fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                          }
                        })
                      }
                    }
                  })
              
                db.collection('user')
                  .where({
                    permission_level: 3
                  })
                  .get({
                    success: res1 => {
                      for (var u in res1.data) {
                        wx.cloud.callFunction({
                          name: 'sendMessage',
                          data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                          },
                          success: res => {
                            console.log(res)

                            wx.hideLoading()

                          },
                          fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                          }
                        })
                      }
                    }
                  })

                
              }
            }
          })
      }
      
      for (var j in new_warning_item) {
        db.collection('stock')
          .where({
            submenu_id: j
          })
          .get({
            success: res => {
              new_warning_name[res.data[0]._id] = {
                '_id': res.data[0]._id,
                'value': today_filled[res.data[0]._id]
              }

              if (Object.keys(new_notfilled_name).length == not_filled &&
                          Object.keys(new_warning_name).length == warning) {
                this.setData({
                  notfilled_item: new_notfilled_name,
                  warning_item: new_warning_name
                })

                console.log('Not filled: ', this.data.notfilled_item)
                console.log('Warning: ', this.data.warning_item)

                var time = util.formatTime(new Date())
                var detail = ''

                detail = detail + '异常补货' + warning.toString() + '项\n' + '未补货' + not_filled.toString() + '项'

                this.setState(this.data.notfilled_item, this.data.warning_item)


                db.collection('user')
                  .where({
                    permission_level: 2
                  })
                  .get({
                    success: res1 => {
                      for (var u in res1.data) {
                        wx.cloud.callFunction({
                          name: 'sendMessage',
                          data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                          },
                          success: res => {
                            console.log(res)

                            wx.hideLoading()

                          },
                          fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                          }
                        })
                      }
                    }
                  })

                db.collection('user')
                  .where({
                    permission_level: 3
                  })
                  .get({
                    success: res1 => {
                      for (var u in res1.data) {
                        wx.cloud.callFunction({
                          name: 'sendMessage',
                          data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                          },
                          success: res => {
                            console.log(res)

                            wx.hideLoading()

                          },
                          fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                          }
                        })
                      }
                    }
                  })

                
              }
            }
          })
      }




      this.setData({
        left_checked: false,
        btn_name: '确认余量'
      })
    }
  },


  getStock: function() {
    console.log(this.data.submenu)
    var sv = {}
    var n = 0

    for (var i in this.data.submenu) {
      for (var j in this.data.submenu[i]) {
        n = n + 1
      }
    }

    for(var i in this.data.submenu) {
      for (var j in this.data.submenu[i]) {

        db.collection(db_stock)
          .where({
            submenu_id: this.data.submenu[i][j]._id
          })
          .get({
            success: res => {
              if (res.data.length != 0) {

                sv[res.data[0].submenu_id] = res.data[0].stock_value

                this.setData({
                  stock_value: sv
                })

                if (Object.keys(this.data.stock_value).length == n) {
                  console.log(this.data.stock_value)
                }
              }
            }
          })

      }
    }
    
  },

  getState: function() {
    var st = {}

    db.collection('stock')
      .field({
        submenu_id: true,
        state: true
      })
      .get({
        success: res => {
          for(var i in res.data) {
            st[res.data[i].submenu_id] = res.data[i].state
          }

          console.log('state', st)

          this.setData({
            state: st
          })

          app.globalData.state = this.data.state
        }
      })
  },

  setState: function(nf, wa) {
    console.log('state nf: ', nf)
    console.log('state wa: ', wa)

    for(var i in nf) {
      var update_state_data = {
        state: 1
      }

      wx.cloud.callFunction({
        name: 'dbChangeUser',
        data: {
          collection_name: 'stock',
          update_data: update_state_data,
          uid: i
        },
        success: res => {
          
        },
        fail: err => {
          // if get a failed result
          console.error('failed to use cloud function dbChangeUser()', err)
        }
      })
      
    }

    for (var i in wa) {
      var update_state_data = {
        state: 1
      }

      wx.cloud.callFunction({
        name: 'dbChangeUser',
        data: {
          collection_name: 'stock',
          update_data: update_state_data,
          uid: i
        },
        success: res => {

        },
        fail: err => {
          // if get a failed result
          console.error('failed to use cloud function dbChangeUser()', err)
        }
      })

    }
    
  }
})
