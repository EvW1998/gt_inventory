/**
 * The page to add new sale to the miniapp
 */
const date = require('../../../../utils/date.js'); //require the util of date
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_sale = 'sale' // the collection of sales


Page({
    /**
     * Data in the page
     */
    data: {
        select_date: '', // the selected date for the sale value
        filled: false,  // whether the input box of the sale value gets filled
        btn_state: "default" // the state for the confirm button
    },

    /**
     * When the page gets loaded
     */
    onLoad: function () {
        var d = date.dateInformat(date.dateInArray(new Date())) 

        this.setData({
            select_date: d,
        })
    },

    /**
     * Check whether the new sale value gets filled
     * 
     * @method checkBlur_value
     * @param e The value returned from the input text
     */
    checkBlur_value: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled: true,
                btn_state: "primary"
            })
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled: false,
                btn_state: "default"
            })
        }
    },

    /**
     * When the selected date is changed, update the page data.
     * 
     * @method bindDateChange
     * @param{Object} e The return value from the date picker
     */
    bindDateChange: function(e) {
        this.setData({
            select_date: e.detail.value
        })
        
        console.log('Date changed to: ', this.data.select_date)
    },

    /**
     * When the confirm button triggered
     * 
     * @method formSubmit
     * @param e The return val from the form submit
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '提交中',
            mask: true
        })

        addSale(e.detail.value)
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
 * Add the new sale data to the collection.
 * 
 * @method addSale
 * @param{Object} value The value from the form
 */
function addSale(value) {
    var new_sale = parseInt(value.sale)
    var legal_input = true

    if(isNaN(new_sale) || new_sale < 0) {
        legal_input = false
    }

    if(legal_input) {
        var add_sale_data = {
            sale_value: new_sale,
            sale_date: value.date
        }

        // call dbAdd() cloud function to add the sale to collection
        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_sale,
                add_data: add_sale_data
            },
            success: res => {
                console.log('Add new sale data to the database: ', add_sale_data)

                pAction.navigateBackUser('新增成功', 1)
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbAdd()', err)
                wx.hideLoading()
            }
        })
    } else {
        console.log('User input illegal')
        wx.hideLoading()
        wx.showToast({
            title: '输入错误',
            icon: 'none'
        })
    }
}
