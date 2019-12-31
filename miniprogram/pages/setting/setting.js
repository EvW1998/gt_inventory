/**
 *  This is the page for the menu of different settings
 */
const app = getApp()
const db = wx.cloud.database()

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
    this.doIt()
  },

  async doIt() {
    const do1 = await this.get1();
    console.log(do1)
    const do2 =await this.get2();
    console.log(do2)
  },

  get1: function() {
    console.log('get 1 start')

    return new Promise((resolve, reject) => {
      setTimeout(function() {
        console.log('get 1 finish')
        resolve('001')
      }, 5000)
    })
  },

  get2: function() {
    console.log('get 2 start')

    return new Promise((resolve, reject) => {
      setTimeout(function () {
        console.log('get 2 finish')
        resolve('002')
      }, 2000)
    })
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
  },

  getSubscribed: function() {
    console.log('ask')
    wx.requestSubscribeMessage({
      tmplIds: ['hAMmX4ZyrxIGCPc8dMJM07irJrM0zNwyDu-3YdGci4I'],
      success(res) {
        wx.showToast({
          title: 'accepted subscribed',
        })
      }
    })
  },

  clearWarning: function() {
    var st = app.globalData.state

    for(var i in st) {
      if(st[i] == 1) {
        db.collection('stock')
          .where({
            submenu_id: i
          })
          .get({
            success: res => {
              console.log(res.data[0]._id)

              var update_state_data = {
                state: 0
              }

              wx.cloud.callFunction({
                name: 'dbChangeUser',
                data: {
                  collection_name: 'stock',
                  update_data: update_state_data,
                  uid: res.data[0]._id
                },
                success: res1 => {
                  wx.showToast({
                    title: '清除成功',
                    duration: 1500,
                  })
                },
                fail: err => {
                  // if get a failed result
                  console.error('failed to use cloud function dbChangeUser()', err)
                }
              })

              
            }
          })
        
      }
    }
    
  }
})