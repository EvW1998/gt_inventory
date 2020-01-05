const app = getApp()
const db = wx.cloud.database()
const db_user = 'user' // the collection for the user in db
const db_menu = 'menu' // the collection for the menu in db
const db_submenu = 'submenu' // the collection for the submenu in db
const db_stock = 'stock' // the collection for the submenu in db
const registration_page = '../../user/userRegister/userRegister' // the url for the register page
const info_page = '../../user/userInfo/userInfo' // the url for the info page

var util = require('../../../utils/util.js');
const user = require('../../../utils/user.js');

Page({
    data: {
        currentTab: 0,
        flag: 0,
        firstLoad: true,
        menu: {},
        submenu: {},
        left_checked: false,
        stock_value: {},
        btn_name: '确认余量',
        yesterday_cost: {},
        warning_item: {},
        notfilled_item: {},
        state: {}
    },

    /***
     *   When loading the page, check whether the user is logged in.
     * If not, block the user until get userinfo back
     */
    onLoad: function () {
        if (!app.globalData.logged) {
            wx.showLoading({
                title: '登录中',
                mask: true
            })

            this.userLogin()
        }
    },

    /***
     *   When show the default page
     */
    onShow: function () {
        if (!this.data.firstLoad) {
            // check whether the user's permission level is high enough to view the page
            checkPermission()
        }

        this.getMenu()
    },

    /**
     * An async function to login the user and get the user's info
     */
    async userLogin() {
        // get user's authorization to use his info
        app.globalData.logged = await user.getAuthority()
        console.log('User logged in: ', app.globalData.logged)
        
        if(app.globalData.logged) {
            // if got the user's authorization
            // get user's info
            app.globalData.userInfo = await user.getUserInfomation()
            console.log('UserInfo: ', app.globalData.userInfo)
            
            // get user's openid
            app.globalData.openid = await user.getOpenId()
            console.log('User openid: ', app.globalData.openid)

            // get user's registration state
            var check_result = await user.checkUser(app.globalData.openid, db)
            app.globalData.registered = check_result.registered
            console.log('User registered in the App: ', app.globalData.registered)

            if (check_result.registered) {
                // if the user registered before
                app.globalData.uid = check_result.uid
                app.globalData.true_name = check_result.true_name
                app.globalData.permission_level = check_result.permission_level

                console.log('User uid: ', app.globalData.uid)
                console.log('User real name: ', app.globalData.true_name)
                console.log('User permission level: ', app.globalData.permission_level)

                wx.hideLoading()
                
                // check whether the user's permission level is high enough to view the page
                checkPermission()

            } else {
                // if the user hasn't registered
                wx.hideLoading()

                // navigate to the registration page
                wx.navigateTo({
                    url: registration_page
                })
            }
            
        } else {
            // if didn't get the user's authorization
            wx.hideLoading()

            wx.switchTab({
                url: info_page
            })
        }

        this.setData({
            firstLoad: false
        })
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
            menu: res.data
            })

            var sm = {}

            for (var i in this.data.menu) {
            db.collection(db_submenu)
                .where({
                menu_id: this.data.menu[i].menu_id
                })
                .orderBy('submenu_id', 'asc')
                .get({
                success: res1 => {
                    if (res1.data.length != 0) {
                    sm[res1.data[0].menu_id] = res1.data

                    this.setData({
                        submenu: sm
                    })

                    if (Object.keys(this.data.menu).length == Object.keys(this.data.submenu).length) {
                        this.getState()

                        this.getStock()


                    }
                    }
                }
                })
            }
        },
        fail: res => {
            console.error('Failed to get menu', res)
        }
        })
    },

    switchNav: function (e) {
    var page = this;
    var id = e.target.id;
    if (this.data.currentTab == id) {
        return false;
    } else {
        page.setData({ currentTab: id });
    }
    page.setData({ flag: id });
    },

    /**
     * When the user wants to share this miniapp
     */
    onShareAppMessage: function () {
        return {
            title: 'GT库存',
            desc: '国泰餐厅库存管理程序',
            path: 'pages/inventory/inventoryUpdate/inventoryUpdate'
        }
    },


    formSubmit: function (e) {

    if (this.data.left_checked == false) {
        this.setData({
        left_checked: true,
        btn_name: '确认补货'
        })

        var today_left = e.detail.value
        var yc = {}

        for (var i in today_left) {
        if (today_left[i] == "") {
            today_left[i] = this.data.stock_value[i]
        }
        else {
            today_left[i] = parseInt(today_left[i])
        }

        yc[i] = this.data.stock_value[i] - today_left[i]
        }

        this.setData({
        yesterday_cost: yc
        })

        console.log(this.data.yesterday_cost)
    }
    else {
        wx.showLoading({
        title: '上传中',
        mask: true
        })

        var total = 0
        var normal = 0
        var warning = 0
        var not_filled = 0
        var today_filled = e.detail.value
        var new_stock_value = this.data.stock_value
        var new_warning_item = {}
        var new_notfilled_item = {}

        for (var i in today_filled) {
        total = total + 1

        if (today_filled[i] == "" || today_filled[i] == "0") {
            today_filled[i] = 0
            not_filled = not_filled + 1

            new_notfilled_item[i] = 0
        }
        else {
            today_filled[i] = parseInt(today_filled[i])
        }

        new_stock_value[i] = new_stock_value[i] - this.data.yesterday_cost[i] + today_filled[i]

        if (today_filled[i] < this.data.yesterday_cost[i]) {
            warning = warning + 1

            new_warning_item[i] = this.data.yesterday_cost[i] - today_filled[i]
        }
        }

        this.setData({
        stock_value: new_stock_value,
        })

        normal = total - warning - not_filled

        console.log(total, normal, warning, not_filled)

        var new_notfilled_name = {}
        var new_warning_name = {}

        for (var i in new_notfilled_item) {
        db.collection('stock')
            .where({
            submenu_id: i
            })
            .get({
            success: res => {
                new_notfilled_name[res.data[0]._id] = { '_id': res.data[0]._id, 'value': 0 }

                if (Object.keys(new_notfilled_name).length == not_filled &&
                Object.keys(new_warning_name).length == warning) {
                this.setData({
                    notfilled_item: new_notfilled_name,
                    warning_item: new_warning_name

                })

                console.log('Not filled: ', this.data.notfilled_item)
                console.log('Warning: ', this.data.warning_item)

                var time = util.formatTime(new Date())
                var detail = ''

                detail = detail + '异常补货' + warning.toString() + '项\n' + '未补货' + not_filled.toString() + '项'

                this.setState(this.data.notfilled_item, this.data.warning_item)

                db.collection('user')
                    .where({
                    permission_level: 2
                    })
                    .get({
                    success: res1 => {
                        for (var u in res1.data) {
                        wx.cloud.callFunction({
                            name: 'sendMessage',
                            data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                            },
                            success: res => {
                            console.log(res)

                            wx.hideLoading()

                            },
                            fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                            }
                        })
                        }
                    }
                    })

                db.collection('user')
                    .where({
                    permission_level: 3
                    })
                    .get({
                    success: res1 => {
                        for (var u in res1.data) {
                        wx.cloud.callFunction({
                            name: 'sendMessage',
                            data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                            },
                            success: res => {
                            console.log(res)

                            wx.hideLoading()

                            },
                            fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                            }
                        })
                        }
                    }
                    })


                }
            }
            })
        }

        for (var j in new_warning_item) {
        db.collection('stock')
            .where({
            submenu_id: j
            })
            .get({
            success: res => {
                new_warning_name[res.data[0]._id] = {
                '_id': res.data[0]._id,
                'value': today_filled[res.data[0]._id]
                }

                if (Object.keys(new_notfilled_name).length == not_filled &&
                Object.keys(new_warning_name).length == warning) {
                this.setData({
                    notfilled_item: new_notfilled_name,
                    warning_item: new_warning_name
                })

                console.log('Not filled: ', this.data.notfilled_item)
                console.log('Warning: ', this.data.warning_item)

                var time = util.formatTime(new Date())
                var detail = ''

                detail = detail + '异常补货' + warning.toString() + '项\n' + '未补货' + not_filled.toString() + '项'

                this.setState(this.data.notfilled_item, this.data.warning_item)


                db.collection('user')
                    .where({
                    permission_level: 2
                    })
                    .get({
                    success: res1 => {
                        for (var u in res1.data) {
                        wx.cloud.callFunction({
                            name: 'sendMessage',
                            data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                            },
                            success: res => {
                            console.log(res)

                            wx.hideLoading()

                            },
                            fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                            }
                        })
                        }
                    }
                    })

                db.collection('user')
                    .where({
                    permission_level: 3
                    })
                    .get({
                    success: res1 => {
                        for (var u in res1.data) {
                        wx.cloud.callFunction({
                            name: 'sendMessage',
                            data: {
                            openid: res1.data[u].user_openid,
                            time: time,
                            detail: detail
                            },
                            success: res => {
                            console.log(res)

                            wx.hideLoading()

                            },
                            fail: err => {
                            // if get a failed result
                            console.error('failed to use cloud function dbChangeUser()', err)
                            wx.hideLoading()
                            }
                        })
                        }
                    }
                    })


                }
            }
            })
        }




        this.setData({
        left_checked: false,
        btn_name: '确认余量'
        })
    }
    },


    getStock: function () {
    console.log(this.data.submenu)
    var sv = {}
    var n = 0

    for (var i in this.data.submenu) {
        for (var j in this.data.submenu[i]) {
        n = n + 1
        }
    }

    for (var i in this.data.submenu) {
        for (var j in this.data.submenu[i]) {

        db.collection(db_stock)
            .where({
            submenu_id: this.data.submenu[i][j]._id
            })
            .get({
            success: res => {
                if (res.data.length != 0) {

                sv[res.data[0].submenu_id] = res.data[0].stock_value

                this.setData({
                    stock_value: sv
                })

                if (Object.keys(this.data.stock_value).length == n) {
                    console.log(this.data.stock_value)
                }
                }
            }
            })

        }
    }

    },

    getState: function () {
    var st = {}

    db.collection('stock')
        .field({
        submenu_id: true,
        state: true
        })
        .get({
        success: res => {
            for (var i in res.data) {
            st[res.data[i].submenu_id] = res.data[i].state
            }

            console.log('state', st)

            this.setData({
            state: st
            })

            app.globalData.state = this.data.state
        }
        })
    },

    setState: function (nf, wa) {
    console.log('state nf: ', nf)
    console.log('state wa: ', wa)

    for (var i in nf) {
        var update_state_data = {
        state: 1
        }

        wx.cloud.callFunction({
        name: 'dbChangeUser',
        data: {
            collection_name: 'stock',
            update_data: update_state_data,
            uid: i
        },
        success: res => {

        },
        fail: err => {
            // if get a failed result
            console.error('failed to use cloud function dbChangeUser()', err)
        }
        })

    }

    for (var i in wa) {
        var update_state_data = {
        state: 1
        }

        wx.cloud.callFunction({
        name: 'dbChangeUser',
        data: {
            collection_name: 'stock',
            update_data: update_state_data,
            uid: i
        },
        success: res => {

        },
        fail: err => {
            // if get a failed result
            console.error('failed to use cloud function dbChangeUser()', err)
        }
        })

    }

    }
})


/**
 * Check the user's permission level, if it's too low to view this page,
 * navigate to the info page.
 * 
 * @method checkPermission
 */
function checkPermission() {
    if (app.globalData.permission_level < 1) {
        console.log('User permission level too low to view this page')
        app.globalData.permission_too_low = true
        wx.switchTab({
            url: info_page
        })
    }
}
