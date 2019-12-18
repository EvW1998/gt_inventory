var util = require('../../utils/date.js');
var util1 = require('../../utils/findyesterday.js')
var util2 = require('../../utils/findthisweek.js')
var util3 = require('../../utils/findlastweek.js')
var util4 = require('../../utils/findnextweekfirstday.js')

const app = getApp()
const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openid: '',
    level: 0,
    lastweek_p: 0,
    thisweek_p: 0,
    nextweek_p: 0,
    time: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    
    this.setData({
      openid: app.globalData.openid,
      level: app.globalData.level,
      time: util.dateInArray(new Date())
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.getLastPredict()
    this.getThisPredict()
    this.getNextPredict()

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      openid: app.globalData.openid,
      level: app.globalData.level
    })

    if (this.data.level < 2) {
      wx.showModal({
        title: '权限不足',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            wx.switchTab({
              url: '../index/index',
            })
          }
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  getLastPredict: function () {
    // find last week
    var firstday_lastweek = this.getFirstdayLastweek()
    db.collection('predict')
      .where({
        year: firstday_lastweek.year,
        month: firstday_lastweek.month,
        day: firstday_lastweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true,
        _openid: true
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
    db.collection('predict')
      .where({
        year: firstday_thisweek.year,
        month: firstday_thisweek.month,
        day: firstday_thisweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true,
        _openid: true
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
    // find last week
    var firstday_nextweek = this.getFirstdayNextweek()
    db.collection('predict')
      .where({
        year: firstday_nextweek.year,
        month: firstday_nextweek.month,
        day: firstday_nextweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true,
        _openid: true
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
        }
      })
  },

  inputLastWeek: function(e) {
    this.setData({
      lastweek_p: parseInt(e.detail.value)
    })
  },

  inputThisWeek: function (e) {
    this.setData({
      thisweek_p: parseInt(e.detail.value)
    })
  },

  inputNextWeek: function (e) {
    this.setData({
      nextweek_p: parseInt(e.detail.value)
    })
  },

  update_predict: function() {
    // update last week
    console.log('update last week to ', this.data.lastweek_p)
    var firstday_lastweek = this.getFirstdayLastweek()
    db.collection('predict')
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
            console.log('no result in db')
            this.addPredict(firstday_lastweek, this.data.lastweek_p)
          }
          else {
            console.log('had result in db', res.data[0]._id)
            this.changePredict(firstday_lastweek, this.data.lastweek_p, res.data[0]._id)
          }

        }
      })

    // update this week
    console.log('update this week to ', this.data.thisweek_p)
    var firstday_thisweek = this.getFirstdayThisweek()
    db.collection('predict')
      .where({
        year: firstday_thisweek.year,
        month: firstday_thisweek.month,
        day: firstday_thisweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true,
        _openid: true
      })
      .orderBy('value', 'desc')
      .get({
        success: res => {
          if (res.data.length == 0) {
            console.log('no result in db')
            this.addPredict(firstday_thisweek, this.data.thisweek_p)
          }
          else {
            console.log('had result in db')
            this.changePredict(firstday_thisweek, this.data.thisweek_p, res.data[0]._id)
          }

        }
      })

    // update next week
    console.log('update next week to ', this.data.nextweek_p)
    var firstday_nextweek = this.getFirstdayNextweek()
    db.collection('predict')
      .where({
        year: firstday_nextweek.year,
        month: firstday_nextweek.month,
        day: firstday_nextweek.day
      })
      .field({
        year: true,
        month: true,
        day: true,
        value: true,
        _openid: true
      })
      .orderBy('value', 'desc')
      .get({
        success: res => {
          if (res.data.length == 0) {
            console.log('no result in db')
            this.addPredict(firstday_nextweek, this.data.nextweek_p)
          }
          else {
            console.log('had result in db')
            this.changePredict(firstday_nextweek, this.data.nextweek_p, res.data[0]._id)
          }
        }
      })
  },

  addPredict: function(date, v) {
    db.collection('predict')
      .add({
        data:
        {
          year: date.year,
          month: date.month,
          day: date.day,
          value: v
        },
        success: res => {
          console.log('add predict success')
          wx.showToast({
            icon: 'none',
            title: '新增成功'
          })
        }
      })

  },

  changePredict: function(date, v, i) {
    console.log('id: ', i)
    console.log('v: ', v)
    db.collection('predict')
      .doc(i)
      .update({
        data: {
          value: v
        },
        success: res => {
          console.log('predict change success', res)
          wx.showToast({
            icon: 'none',
            title: '修改成功'
          })
        },
        fail: res => {
          console.log('level change fail', res)
          wx.showToast({
            icon: 'none',
            title: '修改失败'
          })
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