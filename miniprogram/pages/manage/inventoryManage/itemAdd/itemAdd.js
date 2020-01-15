/**
 * The page to add new item to the selected category.
 */
const app = getApp()
const db = wx.cloud.database()
const db_category = 'category' // the collection for the category in db
const db_item = 'item' // the collection for the item in db


Page({
    /**
     * Data in the page
     */
    data: {
        category_selected: {}, // The selected category
        filled_name: false,
        filled_base: false,
        filled_scale: false,
        filled_stock: false,
        filled: false,  // whether the input box of the category name gets filled
        btn_state: "default" // the state for the confirm button
    },

    /**
     * When the page gets loaded, get the amount of existing items.
     */
    onLoad: function(options) {
        wx.showLoading({
            title: '获取中',
            mask: true
        })

        // set the amount of categories to the page data
        setCategory(this, options.title)
    },

    /**
     * Check whether the new item's name gets filled
     * 
     * @method checkBlur_name
     * @param e The value returned from the input text
     */
    checkBlur_name: function(e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_name: true
            })

            if(isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_name: false,
                filled: false,
                btn_state: "default"
            })
        }
    },

    /**
     * Check whether the new item's base gets filled
     * 
     * @method checkBlur_base
     * @param e The value returned from the input text
     */
    checkBlur_base: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_base: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_base: false,
                filled: false,
                btn_state: "default"
            })
        }
    },


    /**
     * Check whether the new item's scale gets filled
     * 
     * @method checkBlur_scale
     * @param e The value returned from the input text
     */
    checkBlur_scale: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_scale: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_scale: false,
                filled: false,
                btn_state: "default"
            })
        }
    },


    /**
     * Check whether the new item's stock gets filled
     * 
     * @method checkBlur_stock
     * @param e The value returned from the input text
     */
    checkBlur_stock: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_stock: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_stock: false,
                filled: false,
                btn_state: "default"
            })
        }
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

        addItem(this.data.category_selected, e.detail.value)
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
 * Set the selected category in the db to the page data.
 * 
 * @method setCategory
 * @param{Object} page The page
 * @param{String} category_id The collection id of the selected category
 */
function setCategory(page, category_id) {
    db.collection(db_category)
        .where({
            _id: category_id
        })
        .field({
            _id: true,
            category_name: true,
            item_amount: true
        })
        .get({
            success: res => {
                page.setData({
                    category_selected: res.data[0]
                })

                console.log('Get the selected category ', page.data.category_selected)

                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to get category info in the database', err)
                wx.hideLoading()
            }
        })
}


/**
 * Check all the input text state, if all input text get filled, return true,
 * if not, return false.
 * 
 * @method isAllFilled
 * @param{Object} page The page
 * @return{Boolean} Whether all the input text get filled
 */
function isAllFilled(page) {
    var pd = page.data

    if(pd.filled_name && pd.filled_base && pd.filled_scale && pd.filled_stock) {
        return true
    }

    return false
}


/**
 * Add the new item to the item collection.
 * Update the amount of the items inside this category in the category collection.
 * Then return to the previous page.
 * 
 * @method addItem
 * @param category_selected{Object} The selected category
 * @param item_info{Object} The info of the new item
 */
async function addItem(category_selected, item_info) {
    // use an object to hold the data that plans to add to db
    var base_number = parseInt(item_info.base)
    var scale_number = parseFloat(item_info.scale)
    var stock_value = parseInt(item_info.stock)

    var add_item_data = {
        category_id: category_selected._id,
        item_order: category_selected.item_amount,
        item_name: item_info.name,
        base_number: base_number,
        scale_number: scale_number,
        stock_value: stock_value,
        item_state: 0
    }

    // add the new item to the collection
    await addToDB(add_item_data)
    console.log('Add the new item to the collection: ', add_item_data)

    // use an object to hold the data that plans to update to db
    var update_category_data = {
        item_amount: category_selected.item_amount + 1
    }

    // update the total amount of the items inside this category
    await updateItemAmount(update_category_data, category_selected._id)
    console.log('Update the total amount of the items: ', update_category_data.item_amount)

    wx.hideLoading()

    wx.showToast({
        title: '新增成功',
        duration: 1500,
        complete: function (res) {
            setTimeout(function () {
                wx.navigateBack({
                })
            }, 1500)
        }
    })
}


/**
 * Add the new item to the selected category.
 * 
 * @method addToDB
 * @param add_item_data The data that plans to add to the db
 */
function addToDB(add_item_data) {

    return new Promise((resolve, reject) => {
        // call dbAdd() cloud function to add the category to collection
        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_item,
                add_data: add_item_data
            },
            success: res => {
                resolve()
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbAdd()', err)
                reject()
            }
        })
    })
}


/**
 * Update the amount of the items inside this category.
 * 
 * @method updateItemAmount
 * @param update_category_data The data that plans to update to db
 * @param category_id The id of the selected category
 */
function updateItemAmount(update_category_data, category_id) {

    return new Promise((resolve, reject) => {
        // call dbChangeUser() cloud function to update the category amount
        wx.cloud.callFunction({
            name: 'dbChangeUser',
            data: {
                collection_name: db_category,
                update_data: update_category_data,
                uid: category_id
            },
            success: res => {
                resolve()
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbChangeUser()', err)
                reject()
            }
        })
    })
}
