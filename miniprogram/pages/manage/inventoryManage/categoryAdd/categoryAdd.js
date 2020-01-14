/**
 * The page to add new category to the miniapp
 */
const app = getApp()
const db = wx.cloud.database()
const db_category = 'category' // the collection for the category in db
const db_info = 'info' // the collection for the info in db


Page({
    /**
     * Data in the page
     */
    data: {
        exist_category_amount: 0, // The amount of the existed cateogies in the collection
        info_id: '', // The collection id of the info in the info collection
        filled: false,  // whether the input box of the category name gets filled
        btn_state: "default" // the state for the confirm button
    },

    /**
     * When the page gets loaded, get the amount of existing categories.
     */
    onLoad: function() {
        wx.showLoading({
            title: '获取中',
            mask: true
        })

        // set the amount of categories to the page data
        setCategoryAmount(this)
    },

    /**
     * Check whether the new category's name gets filled
     * 
     * @method checkBlur_name
     * @param e The value returned from the input text
     */
    checkBlur_name: function(e) {
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

        addCategory(this.data.exist_category_amount, e.detail.value.name, this.data.info_id)
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
 * Set the amount of categoies in the db to the page data.
 * 
 * @method setCategoryAmount
 * @param page The page
 */
function setCategoryAmount(page) {
    db.collection(db_info)
        .field({
            _id: true,
            category_amount: true
        })
        .get({
            success: res => {
                page.setData({
                    exist_category_amount: res.data[0].category_amount,
                    info_id: res.data[0]._id
                })

                console.log('Get the amount of categories: ', page.data.exist_category_amount)

                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to get category info in the database', err)
            }
        })
}


/**
 * Add the new category to the category collection.
 * Update the amount of the categories in the info collection.
 * Then return to the previous page.
 * 
 * @method addCategory
 * @param category_order The order of the category
 * @param category_name The name of the category
 * @param info_id The id of the info collection
 */
async function addCategory(category_order, category_name, info_id) {
    // use an object to hold the data that plans to add to db
    var add_category_data = {
        category_order: category_order,
        category_name: category_name,
        item_amount: 0
    }

    // add the new category to the collection
    await addToDB(add_category_data)
    console.log('Add the new category to the collection: ', add_category_data)

    // use an object to hold the data that plans to update to db
    var update_info_data = {
        category_amount: category_order + 1
    }

    // update the total amount of the categories in the db
    await updateCategoryAmount(update_info_data, info_id)
    console.log('Update the total amount of the categories: ', update_info_data.category_amount)

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
 * Add the new category to the category collection.
 * 
 * @method addToDB
 * @param add_category_data The data that plans to add to the db
 */
function addToDB(add_category_data) {

    return new Promise((resolve, reject) => {
        // call dbAdd() cloud function to add the category to collection
        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_category,
                add_data: add_category_data
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
 * Update the amount of the categories in the info collection.
 * 
 * @method updateCategoryAmount
 * @param update_info_data The data that plans to update to db
 * @param info_id The id of the info collection
 */
function updateCategoryAmount(update_info_data, info_id) {

    return new Promise((resolve, reject) => {
        // call dbChangeUser() cloud function to update the category amount
        wx.cloud.callFunction({
            name: 'dbChangeUser',
            data: {
                collection_name: db_info,
                update_data: update_info_data,
                uid: info_id
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
