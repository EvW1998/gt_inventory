var util = require('../../utils/date.js');
var util1 = require('../../utils/findyesterday.js')
var util2 = require('../../utils/findthisweek.js')
var util3 = require('../../utils/findlastweek.js')

const app = getApp()
const db = wx.cloud.database()
const type = 'cup1'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openid: '',
    time: {},
    todayR: 0,
    yesterdayR: 0,
    thisweekR: 0,
    lastweekR: 0,
    setDate: '',
    target_date: {},
    target_value: 1,
    r: 0.000000000,
    lastweek_sell: 0,
    thisweek_sell: 0,
    p: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    var a = util.dateInArray(new Date())
    this.setData({
      openid: app.globalData.openid,
      time: a,
      setDate: a.year + '-' + a.month + '-' + a.day,
      target_date: a
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.setData({
      time: util.dateInArray(new Date())
    })
    this.todayRefill()
    this.yesterdayRefill()
    this.thisweekRefill()
    this.lastweekRefill()
    this.getlastweeksale()
    this.getthisweeksale()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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
    console.log('refresh')
    this.onReady()
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

  getPredict() {
    this.setData({
      r: parseFloat(this.data.lastweekR) / parseFloat(this.data.lastweek_sell)
    })
    
    console.log(this.data.r)
    
    this.setData({
      p: parseInt(this.data.r * this.data.thisweek_sell / 7) + 1
    })
  },

  getlastweeksale: function () {
    // find last week
    var firstday_lastweek = this.getFirstdayLastweek()
    console.log(firstday_lastweek)
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
              lastweek_sell: 0
            })
            console.log('lastweeksale: ', this.data.lastweek_sell)
          }
          else {
            this.setData({
              lastweek_sell: res.data[0].value,
              
            })
            console.log('lastweeksale: ', this.data.lastweek_sell)
          }
        }
      })
  },

  getthisweeksale: function () {
    // find this week
    var firstday_thisweek = this.getFirstdayThisweek()
    console.log(firstday_thisweek)
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
              thisweek_sell: 0
            })
            console.log('thisweeksale: ', this.data.thisweek_sell)
          }
          else {
            this.setData({
              thisweek_sell: res.data[0].value
            })
            console.log('thisweeksale: ', this.data.thisweek_sell)
          }
        }
      })
  },

  getFirstdayLastweek: function () {
    var lastweek = util3.findlastweek(this.data.time)
    var fristday_lastweek = {}
    for (var i in lastweek) {
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

  todayRefill: function() {
    this.setData({
      todayR: 0
    })
    db.collection('cup')
      .where({
        type: 'cup1',
        year: this.data.time.year,
        month: this.data.time.month,
        day: this.data.time.day
      })
      .field({
        refill: true
      })
      .get({
        success: res => {
          //console.log(res.data)
          for(var i in res.data) {
            this.setData({
              todayR: this.data.todayR + res.data[i].refill
            })
          }
        }
      })

  },

  yesterdayRefill: function () {
    this.setData({
      yesterdayR: 0
    })

    var y = util1.findyesterday(this.data.time)

    db.collection('cup')
      .where({
        type: 'cup1',
        year: y.year,
        month: y.month,
        day: y.day
      })
      .field({
        refill: true
      })
      .get({
        success: res => {
          //console.log(res.data)
          for (var i in res.data) {
            this.setData({
              yesterdayR: this.data.yesterdayR + res.data[i].refill
            })
          }
        }
      })

  },

  thisweekRefill: function () {
    this.setData({
      thisweekR: 0
    })

    var tw = util2.findthisweek(this.data.time)

    for(var d in tw) {
      db.collection('cup')
        .where({
          type: 'cup1',
          year: tw[d].year,
          month: tw[d].month,
          day: tw[d].day
        })
        .field({
          refill: true
        })
        .get({
          success: res => {
            //console.log(res.data)
            for (var i in res.data) {
              this.setData({
                thisweekR: this.data.thisweekR + res.data[i].refill
              })
            }
          }
        })

    }
  },

  lastweekRefill: function () {
    this.setData({
      lastweekR: 0
    })

    var lw = util3.findlastweek(this.data.time)

    for (var d in lw) {
      db.collection('cup')
        .where({
          type: 'cup1',
          year: lw[d].year,
          month: lw[d].month,
          day: lw[d].day
        })
        .field({
          refill: true
        })
        .get({
          success: res => {
            //console.log(res.data)
            for (var i in res.data) {
              this.setData({
                lastweekR: this.data.lastweekR + res.data[i].refill
              })
            }
          }
        })

    }
  },

  bindDateChange: function(e) {
    this.setData({
      setDate: e.detail.value
    })

    var m = ''
    var n = ''
    var k = ''

    for(var i = 0; i < 4; i++) {
      m = m + this.data.setDate[i]
    }
    for (var i = 5; i < 7; i++) {
      n = n + this.data.setDate[i]
    }
    for (var i = 8; i < 10; i++) {
      k = k + this.data.setDate[i]
    }

    var j = this.data.target_date
    j["year"] = parseInt(m)
    j["month"] = parseInt(n)
    j["day"] = parseInt(k)

    this.setData({
      target_date: j
    })
  },

  valuechange: function(e) {
    this.setData({
      target_value: e.detail.value
    })
  },

  addRefill: function() {
    db.collection('cup')
      .add({
        data:
        {
          type: type,
          refill: this.data.target_value,
          year: this.data.target_date.year,
          month: this.data.target_date.month,
          day: this.data.target_date.day,
          hour: this.data.target_date.hour,
          minute: this.data.target_date.minute,
          second: this.data.target_date.second
        },
        success: res => {
          wx.showToast({
            title: '上传成功'
          })

          this.onReady()
        }
      })
  }
})