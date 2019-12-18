/***
 *  This is a inventory manage system for Anshan GuoTai
 */

const db_user = 'user' // the collection for the user in db
const register_page = '../setname/setname' // the url for the register page

App({
  /***
   *  When the app get launched
   */
  onLaunch: function () {
    
    // set up the cloud
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud-fx0md',
        traceUser: true,
      })
    }

    this.globalData = {}
    this.globalData.logged = false // set for login state
    this.globalData.registered = false // set for register state

    // get the setting info from wx server
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // if get user authorization
          this.globalData.logged = true
          console.log('user logged: ', this.globalData.logged)

          // get userinfo from the server
          wx.getUserInfo({
            success: res => {
              // if get a successed result
              this.globalData.userInfo = res.userInfo
              console.log('userinfo: ', this.globalData.userInfo)
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
              this.globalData.openid = res.result.openid
              console.log('user openid: ', res.result.openid)

              // check the user register state in this app by openid
              checkUser(this.globalData.openid)
            },
            fail: err => {
              // if get a failed result
              console.error('failed to get user openid', err)
            }
          })
        }
        else {
          // if did not get user authorization
          console.log('user logged: ', this.globalData.logged)
        }
      }
    })
  }

  
})

/***
 * par openid(String): the openid that try to find in the user db
 * 
 *  Check whether user exist in the user database,
 * if not, navigate to the page to set real name and invite code,
 * if user exists, record the uid in database.
 */
function checkUser(openid) {
  const db = wx.cloud.database()

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
          wx.navigateTo({
            url: register_page
          })
        }
        else {
          // the user exists in the database, get his permission level and uid
          console.log('checkUser: user exists')
          console.log('user uid: ', res.data[0]._id)

          this.globalData.registered = true
          this.globalData.permission_level = res.data[0].permission_level
          this.globalData.uid = res.data[0]._id
        }
      }
    })
}
