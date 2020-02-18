/**
 * The page to show all the promotion types in the database.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_promotion_type = 'promotion_type' // the collection of promotion types

const promotion_type_add_page = '../promotionTypeAdd/promotionTypeAdd' // the page url of adding a new promotion type
const promotion_type_modify_page = '../promotionTypeModify/promotionTypeModify' // the page url of modifying a promotion type


Page({

    /**
     * Data for this page
     */
    data: {
        search_state: 'searching', // the state of the searching promotion types
        promotion_types: {}, // the promotion types in the database
        promotion_type_amount: 0, // the amount of promotion types
        selected_promotion_type: {}, // the selected promotion type for removing
        show_tip: false, // whether to show the tip of promotion types
        show_remove: false, // whether to show the dialog to remove a promotion type
        promotion_type_add_page: promotion_type_add_page, // the page url of adding a new promotion type
        promotion_type_modify_page: promotion_type_modify_page // the page url of modifying a promotion type
    },

    /**
     * When load the page
     */
    onLoad: function () {

    },

    /**
     * When show the page, get all promotion types
     */
    onShow: function () {
        setAllPromotionType(this)
    },

    /**
     * When tapping, show the tip or hide the tip
     * 
     * @method tipChange
     */
    tipChange: function (e) {
        if (this.data.show_tip) {
            this.setData({
                show_tip: false
            })
        } else {
            this.setData({
                show_tip: true
            })
        }
    },

    /**
     * Open the half screen dialog of removing promotion_type.
     * 
     * @method openRemoveDialog
     * @param{Object} e The longpress event
     */
    openRemoveDialog: function (e) {
        var promotion_type_id = e.currentTarget.id
        console.log('Open the half screen dialog of removing')
        console.log('Selected promotion type: ', promotion_type_id)

        var promotion_type = ''

        for (var i in this.data.promotion_types) {
            if (this.data.promotion_types[i]._id == promotion_type_id) {
                promotion_type = this.data.promotion_types[i]
                break
            }
        }

        this.setData({
            selected_promotion_type: promotion_type,
            show_remove: true
        })
    },

    /**
     * Close the half screen of removing promotion_type.
     * 
     * @method closeRemoveDialog
     */
    closeRemoveDialog: function () {
        console.log('Close the half screen dialog of removing')
        this.setData({
            show_remove: false
        })
    },

    /**
     * Remove the selected promotion_type from the database.
     * 
     * @method removePromotionType
     */
    removePromotionType: function () {
        wx.showLoading({
            title: '删除中',
            mask: true
        })

        var promotion_type = this.data.selected_promotion_type
        console.log('Try to remove the selected promotion_type: ', promotion_type)

        wx.cloud.callFunction({
            name: 'dbRemove',
            data: {
                collection_name: db_promotion_type,
                uid: promotion_type._id
            },
            success: res => {
                console.log('Remove promotion_type success: ', res)

                this.setData({
                    show_remove: false
                })

                this.onShow()

                wx.hideLoading()
                wx.showToast({
                    title: '删除成功'
                })
            },
            fail: err => {
                console.error('Failed to remove promotion_type: ', err)

                this.onShow()

                wx.hideLoading()
                wx.showToast({
                    title: '删除失败',
                    icon: 'none'
                })
            }
        })
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
 * Set all the promotion types into the page data.
 * 
 * @method setAllPromotionType
 * @param{Page} page The page
 */
function setAllPromotionType(page) {
    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_promotion_type,
            collection_limit: 100,
            collection_field: {},
            collection_where: {},
            collection_orderby_key: 'promotion_type_name',
            collection_orderby_order: 'asc'
        },
        success: res => {
            var promotion_type_result = res.result
            var promotion_type_amount = promotion_type_result.length

            if (promotion_type_amount == 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var promotion_types = []
                var order = 1
                for (var i in promotion_type_result) {
                    var new_promotion_type = promotion_type_result[i]
                    var new_order = order.toString()

                    if (promotion_type_amount > 9 && order < 10) {
                        new_order = '0' + new_order
                    }

                    if (promotion_type_amount > 99 && order < 100) {
                        new_order = '0' + new_order
                    }

                    new_promotion_type['promotion_type_order'] = new_order
                    promotion_types.push(new_promotion_type)

                    order++
                }

                page.setData({
                    search_state: 'found',
                    promotion_types: promotion_types,
                    promotion_type_amount: promotion_type_amount
                })
            }

            console.log('Get all promotion types', res.result)
        },
        fail: err => {
            console.error('Failed to search promotion types in database', err)
        }
    })
}
