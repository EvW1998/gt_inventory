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
    manage_user: {},
    max_level: 0,
    filled_name: true,
    btn_state: "default" // the state for the confirm button
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      manage_id: options.title,
      max_level: app.globalData.permission_level - 1
    })

    wx.showLoading({
      title: '加载中',
      mask: true
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
          this.setData({
            manage_user: res.data[0]
          })

          wx.hideLoading()
          console.log('Set for: ', this.data.manage_user)
        }
      })

  },

  /**
   *  check whether the real name val get filled
   * 
   *  par e: the value returned from the input text
   */
  checkBlur_name: function (e) {
    if (e.detail.value != "") {
      // if the name input text get filled with something
      this.setData({
        filled_name: true,
        btn_state: "primary"
      })
    }
    else {
      // if the name input text get filled with nothing
      this.setData({
        filled_name: false,
        btn_state: "default"
      })
    }
  },

  /**
   *  When the confirm button triggered
   * 
   *  par e: the return val from the form submit
   */
  formSubmit: function (e) {
    wx.showLoading({
      title: '提交中',
      mask: true
    })

    var update_user_data = {}

    if(e.detail.value.name != this.data.manage_user.true_name) {
      update_user_data['true_name'] = e.detail.value.name
    }

    if (e.detail.value.level != this.data.manage_user.permission_level) {
      if(e.detail.value.level == '') {
        update_user_data['permission_level'] = 0
      }
      else {
        update_user_data['permission_level'] = e.detail.value.level
      }
    }

    if(Object.keys(update_user_data).length != 0) {
      // call dbAdd() cloud function to add the user to database user
      wx.cloud.callFunction({
        name: 'dbChangeUser',
        data: {
          collection_name: db_user,
          update_data: update_user_data,
          uid: this.data.manage_id
        },
        success: res => {
          wx.hideLoading()
          wx.showToast({
            title: '更改成功',
            duration: 1500,
            complete: function (res) {
              setTimeout(function () {
                // take the user back to the info page
                wx.navigateBack({
                })
              }, 1500)
            }
          })

        },
        fail: err => {
          // if get a failed result
          console.error('failed to use cloud function dbChangeUser()', err)
        }
      })
    }
    else {
      wx.hideLoading()
      wx.showToast({
        title: '更改成功',
        duration: 1500,
        complete: function (res) {
          setTimeout(function () {
            // take the user back to the info page
            wx.navigateBack({
            })
          }, 1500)
        }
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
      path: '/usersetting/usersetting'
    }
  }
})