// pages/usersetting/usersetting.js
const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db

Page({

  /**
   * 页面的初始数据
   */
  data: {
    manage_id: '',
    manage_name: '',
    manage_level: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      manage_id: options.title
    })

    this.searchUser()

  },

  searchUser: function() {
    db.collection(db_user)
      .where({
        _id: this.data.manage_id
      })
      .get({
        success: res => {
          console.log('Set for: ', res.data[0])

          this.setData({
            manage_name: res.data[0].true_name,
            manage_level: res.data[0].permission_level
          })
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
      path: '/usersetting/usersetting'
    }
  }
})