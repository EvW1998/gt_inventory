// pages/addmenu/addmenu.js
const app = getApp()
const db = wx.cloud.database()
const db_menu = 'menu' // the collection for the user in db
const db_submenu = 'submenu' // the collection for the user in db

Page({

  /**
   * 页面的初始数据
   */
  data: {
    exist_menu: {},
    flag: '1',
    menu: '请选择所属品类',
    selected_menu_id: 0,
    exist_submenu_number: 0,
    filled: false,
    filled_name: false,
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
            exist_menu: res.data
          })

          wx.hideLoading()
        },
        fail: res => {
          console.error('Failed to get menu', res)
        }
      })
  },

  addNewSubMenu: function (m_id, subm_name, subm_id) {
    // use an object to hold the data that plans to add to db
    var add_submenu_data = {
      menu_id: m_id,
      submenu_name: subm_name,
      submenu_id: subm_id
    }

    // call dbAdd() cloud function to add the user to database user
    wx.cloud.callFunction({
      name: 'dbAdd',
      data: {
        collection_name: db_submenu,
        add_data: add_submenu_data
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
        filled_name: true
      })

      if(this.data.menu != '请选择所属品类') {
        this.setData({
          filled: true,
          btn_state: "primary"
        })
      }
    }
    else {
      // if the name input text get filled with nothing
      this.setData({
        filled_name: false,
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

    db.collection(db_menu)
      .where({
        menu_name: this.data.menu
      })
      .get({
        success: res => {
          this.setData({
            selected_menu_id: res.data[0].menu_id
          })

          db.collection(db_submenu)
            .where({
              menu_id: this.data.selected_menu_id
            })
            .get({
              success: res1 => {
                this.setData({
                  exist_submenu_number: res1.data.length
                })

                this.addNewSubMenu(
                  this.data.selected_menu_id, 
                  e.detail.value.name, 
                  this.data.exist_submenu_number
                )
              }
            })
        }
      })
  },

  selectMenu: function () {
    this.setData({
      flag: '0'
    });
  },

  radioChange: function (e) {
    this.setData({
      flag: '1',
      menu: e.detail.value
    });

    if(this.data.menu != '请选择所属品类') {
      if(this.data.filled_name) {
        this.setData({
          filled: true,
          btn_state: "primary"
        })
      }
    }
    else {
      this.setData({
        filled: false,
        btn_state: "default"
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})