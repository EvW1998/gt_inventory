/**
 * The page of the setting menu
 */
const app = getApp()
const db = wx.cloud.database()
const db_item = 'item'

const info_page = '../../user/userInfo/userInfo'
const user_manage_page = '../userManage/viewUser/viewUser'
const category_manage_page = '../inventoryManage/categoryView/categoryView'
const sale_manage_page = '../saleManage/saleView/saleView'
const check_log_manage_page = '../logManage/checkLog/checkLog'
const refill_manage_page = '../logManage/refillLog/refillLog'

const check_left_message_id = 'LJqgpHGDBW5N1A_7A3goZytqjqN-AR5ldYjSRvjFSSU'
const refill_message_id = 'X9BoiE_piVjqKaKsAH1KcFhOX46FFps-bWoNBK-LnYQ'


Page({
    data: {
        user_manage_page: user_manage_page,
        category_manage_page: category_manage_page,
        sale_manage_page: sale_manage_page,
        check_log_manage_page: check_log_manage_page,
        refill_manage_page: refill_manage_page
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
     * When the user click the button to agree receiving messages.
     */
    getRefillSubscribed: function () {
        console.log('Request to receive check left messages')

        wx.requestSubscribeMessage({
            tmplIds: [refill_message_id],
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
        wx.showLoading({
            title: '清除中',
            mask: true
        })

        clearWarningState()
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


async function clearWarningState() {
    var item = await getItem()

    var total_update = Object.keys(item).length
    var curr_update = 0

    for(var i in item) {
        var update_item_data = {}
        update_item_data['item_state'] = 0

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_item,
                update_data: update_item_data,
                uid: item[i]._id
            },
            success: res => {
                curr_update = curr_update + 1
                console.log('Clear warning ', curr_update, '/', total_update)
                if(curr_update == total_update) {
                    console.log('Finish clear all warnings')
                    wx.hideLoading()

                    wx.showToast({
                        title: '清除成功'
                    })
                }
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbUpdate()', err)
            }
        })
    }
}


function getItem() {
    return new Promise((resolve, reject) => {
        db.collection(db_item)
            .where({
                item_state: 1
            })
            .get({
                success: res => {
                    console.log('Get all items: ', res.data)
                    resolve(res.data)
                },
                fail: err => {
                    console.error('Failed to search items', err)
                    reject()
                }
            })
    })
}
