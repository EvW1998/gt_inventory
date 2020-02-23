/**
 * The page to show all the promotion events in the database.
 */
const date = require('../../../../utils/date.js') // require the util of date
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs

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
        promotion_events: [], // the promotion events in the database
        promotion_event_amount: 0, // the amount of promotion events
        promotion_events_past: [], // the past promotion events which are already finished
        promotion_events_current: [], // the current promotion events which are active
        promotion_events_future: [], // the future promotion events which are not active yet
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
     * Open the half screen dialog of removing a promotion event.
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
        console.log('Try to remove the selected promotion event: ', promotion_event)

        wx.cloud.callFunction({
            name: 'dbRemove',
            data: {
                collection_name: db_promotion_event,
                uid: promotion_event._id
            },
            success: res => {
                console.log('Remove promotion_event success: ', res)
                realTimeLog.info('User ', app.globalData.true_name, ' remove the promotion event from the database.', promotion_event)

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
                realTimeLog.error('Failed to remove ', promotion_event, ' promotion_event: ', err)

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
            collection_orderby_key: 'end_date',
            collection_orderby_order: 'desc'
        },
        success: res => {
            var promotion_event_result = res.result
            var promotion_event_amount = promotion_event_result.length

            if (promotion_event_amount == 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var promotion_events = res.result
                var promotion_events_past = []
                var promotion_events_current = []
                var promotion_events_future = []

                var today = date.dateInformat(date.dateInArray(new Date()))

                for (var i in promotion_events) {
                    if (promotion_events[i].end_date < today) {
                        promotion_events_past.push(promotion_events[i])
                    } else if (promotion_events[i].start_date <= today && promotion_events[i].end_date >= today) {
                        promotion_events_current.push(promotion_events[i])
                    } else {
                        promotion_events_future.push(promotion_events[i])
                    }
                }

                var amount = Math.max(promotion_events_past.length, promotion_events_current.length, promotion_events_future.length)

                promotion_events_past = addEventOrder(promotion_events_past, amount)
                promotion_events_current = addEventOrder(promotion_events_current, amount)
                promotion_events_future = addEventOrder(promotion_events_future, amount)

                page.setData({
                    search_state: 'found',
                    promotion_events: promotion_events,
                    promotion_event_amount: promotion_event_amount,
                    promotion_events_past: promotion_events_past,
                    promotion_events_current: promotion_events_current,
                    promotion_events_future: promotion_events_future
                })
            }

            console.log('Get all promotion events', res.result)
        },
        fail: err => {
            realTimeLog.error('Failed to get promotion events.', err)

            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            })
        }
    })
}


/**
 * Add order number to the given events.
 * 
 * @method addEventOrder
 * @param{Object} events The promotion events for adding orders
 * @param{Number} amount The maximum amount in all promotion events
 * @return{Object} The new promotion events with orders
 */
function addEventOrder(events, amount) {
    var order = 1

    for (var i in events) {
        var new_order = order.toString()

        if (amount > 9 && order < 10) {
            new_order = '0' + new_order
        }

        if (amount > 99 && order < 100) {
            new_order = '0' + new_order
        }

        events[i]['promotion_event_order'] = new_order

        order++
    }

    return events
}
