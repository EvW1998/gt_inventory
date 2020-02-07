/**
 * Update the selected sale info, or delete it.
 */
const date = require('../../../../utils/date.js');
const pAction = require('../../../../utils/pageAction.js')

const app = getApp()
const db = wx.cloud.database()
const db_sale = 'sale' // the collection of sales


Page({

    /**
     * Data for the page
     */
    data: {
        sale_id: '', // the uid of the selected sale info
        sale_selected: {},
        filled: true, // whether the input is filled
        btn_state: "primary" // the state for the confirm button
    },

    /**
     * When the app loads the page
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function(options) {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        this.setData({
            sale_id: options.title
        })

        searchSale(this, options.title)
    },

    /**
     * Check whether the input val get filled
     * 
     * @method checkBlur
     * @param{Object} e The value returned from the input text
     */
    checkBlur: function (e) {
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
     * When the confirm button triggered, update the selected category info
     * 
     * @method formSubmit
     * @param{Object} e The return val from the form submit
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '提交中',
            mask: true
        })

        if (e.detail.value.sale != this.data.sale_selected.sale_value) {
            var update_sale_data = {} // the new user info needs to be updated
            update_sale_data['sale_value'] = parseInt(e.detail.value.sale)

            updateSale(update_sale_data, this.data.sale_id)

        } else {
            console.log('No sale info changed')
            pAction.navigateBackUser('更改成功', 1)
        }
    },

    /**
     * Remove the selected sale from the collection
     * 
     * @method removeSale
     */
    removeSale: function () {
        wx.showModal({
            title: '警告',
            content: '将要删除此营业额数据！',
            showCancel: true,
            cancelText: '取消',
            confirmText: '确认删除',
            confirmColor: '#F25438',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中',
                        mask: true
                    })

                    removeData(this.data.sale_id)
                }
            },
        })
    },

    /***
     *  When the user wants to share this miniapp
     */
    onShareAppMessage: function () {
        return {
            title: 'GT库存',
            desc: '国泰餐厅库存管理程序',
            path: '/usersetting/usersetting'
        }
    }
})


/**
 * Search the sale in the collection with the given id.
 * Then store the data in the page data.
 * 
 * @method searchSale
 * @param{Object} page The page
 * @param{String} sale_id The collection id of the selected sale
 */
function searchSale(page, sale_id) {
    db.collection(db_sale)
        .where({
            _id: sale_id
        })
        .get({
            success: res => {
                page.setData({
                    sale_selected: res.data[0]
                })

                console.log('Modify the sale: ', res.data[0])
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search the sale', err)
                wx.hideLoading()
            }
        })
}


/**
 * Update the selected sale info in the collection.
 * 
 * @method updateSale
 * @param{Object} update_sale_data The data plans to update
 * @param{String} sale_id The collection id of the sale info
 */
function updateSale(update_sale_data, sale_id) {
    wx.cloud.callFunction({
        name: 'dbUpdate',
        data: {
            collection_name: db_sale,
            update_data: update_sale_data,
            uid: sale_id
        },
        success: res => {
            console.log('Update sale info success')
            pAction.navigateBackUser('更改成功', 1)
        },
        fail: err => {
            // if get a failed result
            console.error('Failed to use cloud function dbUpdate()', err)
            pAction.navigateBackUser('更改失败', 1)
        }
    })
}


/**
 * Remove the given sale info from the db.
 * 
 * @method removeData
 */
function removeData(sale_id) {

    wx.cloud.callFunction({
        name: 'dbRemove',
        data: {
            collection_name: db_sale,
            uid: sale_id
        },
        success: res => {
            console.log('Remove sale success')
            pAction.navigateBackUser('删除成功', 1)
        },
        fail: err => {
            // if get a failed result
            console.error('Failed to use cloud function dbRemove()', err)
            pAction.navigateBackUser('删除失败', 1)
        }
    })
}
