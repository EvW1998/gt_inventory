// pages/addmenu/addmenu.js
const app = getApp()
const db = wx.cloud.database()
const db_menu = 'menu' // the collection for the user in db

Page({

  /**
   * 页面的初始数据
   */
  data: {
    exist_menu: {},
    exist_menu_number: 0,
    filled: false,
    btn_state: "default" // the state for the confirm button
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '获取中',
      mask: true
    })

    this.getMenu()
  },

  getMenu: function () {
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
            exist_menu: res.data,
            exist_menu_number: res.data.length
          })

          wx.hideLoading()
        },
        fail: res => {
          console.error('Failed to get menu', res)
        }
      })
  },

  addNewMenu: function(m_id, m_name) {
    // use an object to hold the data that plans to add to db
    var add_menu_data = {
      menu_id: m_id,
      menu_name: m_name
    }

    // call dbAdd() cloud function to add the user to database user
    wx.cloud.callFunction({
      name: 'dbAdd',
      data: {
        collection_name: db_menu,
        add_data: add_menu_data
      },
      success: res => {
        wx.hideLoading()

        wx.showToast({
          title: '新增成功',
          duration: 1500,
          complete: function (res) {
            setTimeout(function () {
              wx.navigateBack({
              })
            }, 1500)
          }
        })
      },
      fail: err => {
        // if get a failed result
        console.error('failed to use cloud function dbAdd()', err)
        wx.hideLoading()
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
        filled: true,
        btn_state: "primary"
      })
    }
    else {
      // if the name input text get filled with nothing
      this.setData({
        filled: false,
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

    this.addNewMenu(this.data.exist_menu_number, e.detail.value.name)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})