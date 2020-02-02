/**
 * The page of the setting menu
 */
const app = getApp()
const db = wx.cloud.database()

const info_page = '../../user/userInfo/userInfo'
const user_manage_page = '../userManage/viewUser/viewUser'
const category_manage_page = '../inventoryManage/categoryView/categoryView'
const sale_manage_page = '../saleManage/saleView/saleView'

const check_left_message_id = 'hAMmX4ZyrxIGCPc8dMJM07irJrM0zNwyDu-3YdGci4I'
const refill_message_id = 'X9BoiE_piVjqKaKsAH1KcAtjSqdfjQQYDb2_q7hpWAQ'


Page({
    data: {
        user_manage_page: user_manage_page,
        category_manage_page: category_manage_page,
        sale_manage_page: sale_manage_page
    },

    /**
     * When show the page, check the user's permission level.
     */
    onShow: function () {
        checkPermission()
    },

    /**
     * When the user click the button to agree receiving messages.
     */
    getLeftSubscribed: function () {
        console.log('Request to receive check left messages')

        wx.requestSubscribeMessage({
            tmplIds: [check_left_message_id],
            success(res) {
                wx.showToast({
                    title: '同意接收',
                })

                console.log('User agree to receive check left messages')
            }
        })
    },

    /**
     * Clear warning items, reset them to normal.
     */
    clearWarning: function () {
        var st = app.globalData.state

        for (var i in st) {
            if (st[i] == 1) {
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
                                name: 'dbUpdate',
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
                                    console.error('failed to use cloud function dbUpdate()', err)
                                }
                            })


                        }
                    })

            }
        }

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
