var util = require('../../utils/date.js');
var util1 = require('../../utils/findyesterday.js')
var util2 = require('../../utils/findthisweek.js')
var util3 = require('../../utils/findlastweek.js')
var util4 = require('../../utils/findnextweekfirstday.js')

const app = getApp()
const db = wx.cloud.database()
const db_predict = 'predict'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    lastweek_p: 0,
    thisweek_p: 0,
    nextweek_p: 0,
    time: {},
    filled_lw: true,
    filled_tw: true,
    filled_nw: true,
    filled: true,
    btn_state: "primary" // the state for the confirm button
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    
    this.setData({
      time: util.dateInArray(new Date())
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onShow: function () {
    wx.showLoading({
      title: '加载中',
      mask: true
    })

    this.getLastPredict()
    this.getThisPredict()
    this.getNextPredict()
  },

  getLastPredict: function () {
    // find last week
    var firstday_lastweek = this.getFirstdayLastweek()
    db.collection(db_predict)
      .where({
        year: firstday_lastweek.year,
        month: firstday_lastweek.month,
        day: firstday_lastweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true
      })
      .orderBy('value', 'desc')
      .get({
        success: res => {
          if (res.data.length == 0) {
            this.setData({
              lastweek_p: 0
            })
          }
          else {
            this.setData({
              lastweek_p: res.data[0].value
            })
          }
        }
      })
  },

  getThisPredict: function () {
    // find last week
    var firstday_thisweek = this.getFirstdayThisweek()
    db.collection(db_predict)
      .where({
        year: firstday_thisweek.year,
        month: firstday_thisweek.month,
        day: firstday_thisweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true
      })
      .orderBy('value', 'desc')
      .get({
        success: res => {
          if (res.data.length == 0) {
            this.setData({
              thisweek_p: 0
            })
          }
          else {
            this.setData({
              thisweek_p: res.data[0].value
            })
          }
        }
      })
  },

  getNextPredict: function () {
    var firstday_nextweek = this.getFirstdayNextweek()
    db.collection(db_predict)
      .where({
        year: firstday_nextweek.year,
        month: firstday_nextweek.month,
        day: firstday_nextweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true
      })
      .orderBy('value', 'desc')
      .get({
        success: res => {
          if (res.data.length == 0) {
            this.setData({
              nextweek_p: 0
            })
          }
          else {
            this.setData({
              nextweek_p: res.data[0].value
            })
          }

          wx.hideLoading()
        }
      })
  },

  /**
   *  check whether the real name val get filled
   * 
   *  par e: the value returned from the input text
   */
  checkBlur_lw: function (e) {
    if (e.detail.value != "") {
      // if the name input text get filled with something
      this.setData({
        filled_lw: true
      })

      if (this.data.filled_nw && this.data.filled_tw) {
        this.setData({
          filled: true,
          btn_state: "primary"
        })
      }
    }
    else {
      // if the name input text get filled with nothing
      this.setData({
        filled_lw: false,
        filled: false,
        btn_state: "default"
      })
    }
  },

  /**
   *  check whether the real name val get filled
   * 
   *  par e: the value returned from the input text
   */
  checkBlur_tw: function (e) {
    if (e.detail.value != "") {
      // if the name input text get filled with something
      this.setData({
        filled_tw: true
      })

      if (this.data.filled_lw && this.data.filled_nw) {
        this.setData({
          filled: true,
          btn_state: "primary"
        })
      }
    }
    else {
      // if the name input text get filled with nothing
      this.setData({
        filled_tw: false,
        filled: false,
        btn_state: "default"
      })
    }
  },

  /**
   *  check whether the real name val get filled
   * 
   *  par e: the value returned from the input text
   */
  checkBlur_nw: function (e) {
    if (e.detail.value != "") {
      // if the name input text get filled with something
      this.setData({
        filled_nw: true
      })

      if (this.data.filled_lw && this.data.filled_tw) {
        this.setData({
          filled: true,
          btn_state: "primary"
        })
      }
    }
    else {
      // if the name input text get filled with nothing
      this.setData({
        filled_nw: false,
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
    console.log(e.detail.value)
    this.update_predict(e.detail.value)
  },

  update_predict: function(e) {
    // update last week
    console.log('update last week to ', e.lw)
    var firstday_lastweek = this.getFirstdayLastweek()
    db.collection(db_predict)
      .where({
        year: firstday_lastweek.year,
        month: firstday_lastweek.month,
        day: firstday_lastweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true
      })
      .get({
        success: res => {
          var a = parseInt(e.lw)

          if (res.data.length == 0) {
            console.log('no result in db')
            this.addPredict(firstday_lastweek, a)
          }
          else {
            console.log('had result in db', res.data[0]._id)
            if (res.data[0].value != a) {
              this.changePredict(firstday_lastweek, a, res.data[0]._id)
            }
          }

        }
      })

    // update this week
    console.log('update this week to ', e.tw)
    var firstday_thisweek = this.getFirstdayThisweek()
    db.collection(db_predict)
      .where({
        year: firstday_thisweek.year,
        month: firstday_thisweek.month,
        day: firstday_thisweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true
      })
      .get({
        success: res => {
          var b = parseInt(e.tw)

          if (res.data.length == 0) {
            console.log('no result in db')
            this.addPredict(firstday_thisweek, b)
          }
          else {
            console.log('had result in db')
            if (res.data[0].value != b) {
              this.changePredict(firstday_thisweek, b, res.data[0]._id)
            }
          }

        }
      })

    // update next week
    console.log('update next week to ', e.nw)
    var firstday_nextweek = this.getFirstdayNextweek()
    db.collection(db_predict)
      .where({
        year: firstday_nextweek.year,
        month: firstday_nextweek.month,
        day: firstday_nextweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true
      })
      .get({
        success: res => {
          var c = parseInt(e.nw)

          if (res.data.length == 0) {
            console.log('no result in db')
            this.addPredict(firstday_nextweek, c)
          }
          else {
            console.log('had result in db')
            if (res.data[0].value != c) {
              this.changePredict(firstday_nextweek, c, res.data[0]._id)
            }
          }
        }
      })
  },

  addPredict: function(date, v) {
    var add_predict_value = {
      year: date.year,
      month: date.month,
      day: date.day,
      value: v
    }

    wx.cloud.callFunction({
      name: 'dbAdd',
      data: {
        collection_name: db_predict,
        add_data: add_predict_value
      },
      success: res => {
        wx.showToast({
          title: '更改成功',
          duration: 1500
        })
      },
      fail: err => {
        // if get a failed result
        console.error('failed to use cloud function dbChangeUser()', err)
      }
    })
  },

  changePredict: function(date, v, i) {
    var update_predict_data = {
      value: v
    }

    wx.cloud.callFunction({
      name: 'dbChangeUser',
      data: {
        collection_name: db_predict,
        update_data: update_predict_data,
        uid: i
      },
      success: res => {
        wx.hideLoading()
        wx.showToast({
          title: '更改成功',
          duration: 1500,
        })
      },
      fail: err => {
        // if get a failed result
        console.error('failed to use cloud function dbChangeUser()', err)
      }
    })
  },

  getFirstdayLastweek: function() {
    var lastweek = util3.findlastweek(this.data.time)
    var fristday_lastweek = {}
    for(var i in lastweek) {
      fristday_lastweek = lastweek[i]
    }
    return fristday_lastweek
  },

  getFirstdayThisweek: function () {
    var thisweek = util2.findthisweek(this.data.time)
    var fristday_thisweek = {}
    for (var i in thisweek) {
      fristday_thisweek = thisweek[i]
    }
    return fristday_thisweek
  },

  getFirstdayNextweek: function () {
    return util4.findnextweekfirstday(this.data.time)
  }
})