//app.js
App({
  onLaunch: function () {
    
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

    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // if get user authorization
          this.globalData.logged = true
          console.log('user logged: ', this.globalData.logged)

          // get userinfo from the server
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              console.log('userinfo: ', this.globalData.userInfo)
            }
          })

          // get user openid
          wx.cloud.callFunction({
            name: 'login',
            data: {},
            success: res => {
              this.globalData.openid = res.result.openid
              console.log('user openid: ', res.result.openid)
            },
            fail: err => {
              console.error('failed to get user openid', err)
            }
          })
        }
        else {
          console.log('user logged: ', this.globalData.logged)
        }
      }
    })
  }
})
