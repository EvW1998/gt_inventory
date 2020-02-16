/**
 * The page of the setting menu
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_item = 'item' // the collection of items

const info_page = '../../user/userInfo/userInfo' // the page url of the user info
const user_manage_page = '../userManage/viewUser/viewUser' // the page url of the user management
const category_manage_page = '../inventoryManage/categoryView/categoryView' // the page url of the category management
const sale_manage_page = '../saleManage/saleView/saleView' // the page url of the sale management
const check_log_manage_page = '../logManage/checkLog/checkLog' // the page url of the check log viewing
const refill_manage_page = '../logManage/refillLog/refillLog' // the page url of the refill log viewing
const product_manage_page = '../productManage/productView/productView' // the page url of the product management
const promotion_type_manage_page = '../promotionTypeManage/promotionTypeView/promotionTypeView' // the page url of the promotion type management
const promotion_event_manage_page = '../promotionEventManage/promotionEventView/promotionEventView' // the page url of the promotion event management

const check_left_message_id = 'LJqgpHGDBW5N1A_7A3goZytqjqN-AR5ldYjSRvjFSSU' // the message id of checking
const refill_message_id = 'X9BoiE_piVjqKaKsAH1KcFhOX46FFps-bWoNBK-LnYQ' // the message id of refilling

const warning_state = 1


Page({
    data: {
        user_manage_page: user_manage_page, // the page url of the user management
        category_manage_page: category_manage_page, // the page url of the category management
        sale_manage_page: sale_manage_page, // the page url of the sale management
        check_log_manage_page: check_log_manage_page, // the page url of the check log viewing
        refill_manage_page: refill_manage_page, // the page url of the refill log viewing
        product_manage_page: product_manage_page, // the page url of the product management
        promotion_type_manage_page: promotion_type_manage_page, // the page url of the promotion type management
        promotion_event_manage_page: promotion_event_manage_page // the page url of the promotion event management
    },

    /**
     * When show the page, check the user's permission level.
     */
    onShow: function () {
        checkPermission()
    },

    /**
     * When the user click the button to agree receiving messages.
     * 
     * @method getSubscribed
     */
    getSubscribed: function () {
        console.log('Request to receive both messages')

        wx.requestSubscribeMessage({
            tmplIds: [check_left_message_id, refill_message_id],
            success(res) {
                wx.showToast({
                    title: '同意接收',
                })

                console.log('User agree to receive both messages')
            }
        })
    },

    /**
     * Clear warning items, reset them to normal.
     * 
     * clearWarning
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
    if (app.globalData.permission_level < 2) {
        console.log('User permission level too low to view this page')
        app.globalData.permission_too_low = true
        wx.switchTab({
            url: info_page
        })
    }
}


/**
 * Clear the warning state of all the items with state 1
 * 
 * @method clearWarningState
 */
async function clearWarningState() {
    // get all items with the warning state
    var item = await getWarningItem()

    var total_update = Object.keys(item).length // the total amount of items need to update
    var curr_update = 0 // the amount of items finished updating

    if(total_update == 0) {
        console.log('Finish clear all warnings')
        wx.hideLoading()
        wx.showToast({
            title: '清除成功'
        })
    }

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
                    // if all items have finished updating
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


/**
 * Return all the items with the warning state
 * 
 * @method getWarningItem
 * @return{Promise} The state of the function. Resolve when get items.
 */
function getWarningItem() {
    return new Promise((resolve, reject) => {
        db.collection(db_item)
            .where({
                item_state: warning_state
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
