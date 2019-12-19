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
    this.globalData.invite_code = 'SHY019' // set for invite code
  }
})
