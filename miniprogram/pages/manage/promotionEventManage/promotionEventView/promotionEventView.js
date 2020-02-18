/**
 * The page to show all the promotion events in the database.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_promotion_event = 'promotion_event' // the collection of promotion events

const promotion_event_add_page = '../promotionEventAdd/promotionEventAdd' // the page url of adding a new promotion event
const promotion_event_modify_page = '../promotionEventModify/promotionEventModify' // the page url of modifying a promotion event


Page({

    /**
     * Data for this page
     */
    data: {
        search_state: 'searching', // the state of the searching promotion events
        promotion_events: {}, // the promotion events in the database
        promotion_event_amount: 0, // the amount of promotion events
        selected_promotion_event: {}, // the selected promotion event for removing
        show_tip: false, // whether to show the tip of promotion events
        show_remove: false, // whether to show the dialog to remove a promotion event
        promotion_event_add_page: promotion_event_add_page, // the page url of adding a new promotion event
        promotion_event_modify_page: promotion_event_modify_page // the page url of modifying a promotion event
    },

    /**
     * When load the page
     */
    onLoad: function () {

    },

    /**
     * When show the page, get all promotion events
     */
    onShow: function () {
        setAllPromotionEvent(this)
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
     * Open the half screen dialog of removing promotion_event.
     * 
     * @method openRemoveDialog
     * @param{Object} e The longpress event
     */
    openRemoveDialog: function (e) {
        var promotion_event_id = e.currentTarget.id
        console.log('Open the half screen dialog of removing')
        console.log('Selected promotion event: ', promotion_event_id)

        var promotion_event = ''

        for (var i in this.data.promotion_events) {
            if (this.data.promotion_events[i]._id == promotion_event_id) {
                promotion_event = this.data.promotion_events[i]
                break
            }
        }

        this.setData({
            selected_promotion_event: promotion_event,
            show_remove: true
        })
    },

    /**
     * Close the half screen of removing promotion_event.
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
     * Remove the selected promotion_event from the database.
     * 
     * @method removePromotionEvent
     */
    removePromotionEvent: function () {
        wx.showLoading({
            title: '删除中',
            mask: true
        })

        var promotion_event = this.data.selected_promotion_event
        console.log('Try to remove the selected promotion_event: ', promotion_event)

        wx.cloud.callFunction({
            name: 'dbRemove',
            data: {
                collection_name: db_promotion_event,
                uid: promotion_event._id
            },
            success: res => {
                console.log('Remove promotion_event success: ', res)

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
                console.error('Failed to remove promotion_event: ', err)

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
 * Set all the promotion events into the page data.
 * 
 * @method setAllPromotionEvent
 * @param{Page} page The page
 */
function setAllPromotionEvent(page) {
    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_promotion_event,
            collection_limit: 100,
            collection_field: {},
            collection_where: {},
            collection_orderby_key: 'promotion_event_name',
            collection_orderby_order: 'asc'
        },
        success: res => {
            var promotion_event_result = res.result
            var promotion_event_amount = promotion_event_result.length

            if (promotion_event_amount == 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var promotion_events = []
                var order = 1
                for (var i in promotion_event_result) {
                    var new_promotion_event = promotion_event_result[i]
                    var new_order = order.toString()

                    if (promotion_event_amount > 9 && order < 10) {
                        new_order = '0' + new_order
                    }

                    if (promotion_event_amount > 99 && order < 100) {
                        new_order = '0' + new_order
                    }

                    new_promotion_event['promotion_event_order'] = new_order
                    promotion_events.push(new_promotion_event)

                    order++
                }

                page.setData({
                    search_state: 'found',
                    promotion_events: promotion_events,
                    promotion_event_amount: promotion_event_amount
                })
            }

            console.log('Get all promotion events', res.result)
        },
        fail: err => {
            console.error('Failed to search promotion events in database', err)
        }
    })
}
