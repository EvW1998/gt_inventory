/***
 *  The page to show the userinfo in this app
 * Includ the user's name, wechat openid, 
 * the uid in this miniapp, and the permission level
 */

const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db

Page({
  data: {
    logged: true, // login state for the user
    userInfo: {}, // user's infomation
    avatarUrl: '', // avatar image url for the user
    openid: '', // user openid
    permission_level: 0, // user's permission level
    uid: '', // user's uid in this inventory
    true_name: '' //user's registered real name
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

      this.checkUser(app.globalData.openid)
    }
  },

  /***
   *  If didn't log in, the login button will show up.
   * After clicking, update login state, and userinfo.
   */
  onGetUserInfo: function(e) {
    if (!this.data.logged && e.detail.userInfo) {
      // if the login button got triggereed, and user didn't login
      app.globalData.logged = true
      app.globalData.userInfo = e.detail.userInfo

      this.setData({
        logged: app.globalData.logged,
        userInfo: app.globalData.userInfo,
        avatarUrl: app.globalData.userInfo.avatarUrl
      })

      console.log('user logged: ', app.globalData.logged)
      console.log('userinfo: ', app.globalData.userInfo)
      
      // call login() cloud function to get user's openid
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          // if get a successed result
          app.globalData.openid = res.result.openid
          this.setData({
            openid: res.result.openid
          })

          console.log('user openid: ', app.globalData.openid)

          // check whether the user registered in the app database
          this.checkUser(app.globalData.openid)
        },
        fail: err => {
          // if get a failed result
          console.error('failed to get user openid', err)
        }
      })
    }
  },

  /***
   * par openid(String): the openid that try to find in the user db
   * 
   *  Check whether user exist in the user database,
   * if not, call addUser() to add this user to database,
   * if user exists, record the uid in database.
   */
  checkUser: function(openid) {
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

            // navigate to the page to set name
            //wx.navigateTo({
            //  url: '../setname/setname',
            //  success: function(res) {
            //    console.log(res)
            //  }
            //})

            // add this new user to the database
            this.addUser()
          }
          else {
            // the user exists in the database, get his permission level and uid
            console.log('checkUser: user exists')
            console.log('user uid: ', res.data[0]._id)

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

  /***
   *  Use cloud function dbAdd() to add the user's info to the db
   */
  addUser: function() {
    app.globalData.permission_level = 0
    this.setData({
      permission_level: app.globalData.permission_level
    })

    // use an object to hold the data that plans to add to db
    var add_user_data = {
      user_openid: app.globalData.openid,
      true_name: app.globalData.userInfo.nickName,
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
        console.log('user register success, uid: ', res.result._id)

        this.setData({
          uid: res.result._id
        })
        app.globalData.uid = res.result._id
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
  onShareAppMessage: function() {
    return {
      title: 'GT库存',
      desc: '国泰餐厅库存管理程序',
      path: '/me/me'
    }
  }
})