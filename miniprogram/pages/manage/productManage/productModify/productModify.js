/**
 * Modify a product of the name and materails it requires
 */
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_product = 'product' // the collection of products


Page({

    /**
     * Data for the page
     */
    data: {
        product: {}, // the selected product for modifying
        multiArray: [], // the choices in the multiSelector
        multiIndex: [0, 0], // the index of the multiSelector
        categories: {}, // the categories in the category collection
        items: {}, // the items in the item collection
        formated_item: {}, // the items in an Object that the key is the item name
        category_array: [], // the categories in an array
        item_array: {}, // the items in an array
        picked_item: {}, // the items are picked
        set_picker: false, // whether the picker is set
        button_enable: false, // whether the sumbit button is enabled
        warn_enable: false // whether the warning icon should display
    },

    /**
     * When the page is loaded, set the picker for items and search the given product
     */
    onLoad: function (options) {
        setPicker(this)
        setProduct(this, options.product_id)
    },

    /**
     * Check the input, enable the confirm button if the length is greater than 0,
     * enable the warning icon if the length is 0
     * 
     * @method nameInput
     * @param{Object} event The event of the input
     */
    nameInput: function (event) {
        var button_enable = true
        var warn_enable = false
        var new_name = event.detail.value

        if (new_name.length == 0) {
            button_enable = false
            warn_enable = true
        }

        this.setData({
            button_enable: button_enable,
            warn_enable: warn_enable
        })
    },

    /**
     * Add a selected item in the picker to the list
     * 
     * @method addItem
     * @param{Object} event The confirm event
     */
    addItem: function (event) {
        var picker_index = event.detail.value
        var picked = this.data.item_array[this.data.category_array[picker_index[0]]][picker_index[1]]
        console.log('Picked index: ', picker_index)
        console.log('Picked item: ', picked)

        var picked_item = this.data.picked_item

        if (this.data.formated_item[picked]._id in picked_item) {
            // if the item is already in the list
            console.log('Picked item already picked before')
            wx.showToast({
                title: '选择重复',
                icon: 'none'
            })
        } else {
            // if the item is not in the list
            picked_item[this.data.formated_item[picked]._id] = this.data.formated_item[picked]

            console.log('New picked item array: ', picked_item)
            this.setData({
                picked_item: picked_item
            })
        }
    },

    /**
     * When slide the column in the picker, change the value and index
     * 
     * @method changePicker
     * @param{Object} e The change event
     */
    changePicker: function (e) {
        console.log('Add material: column: ', e.detail.column, ' change to: ', e.detail.value)
        var data = {
            multiArray: this.data.multiArray,
            multiIndex: this.data.multiIndex
        }
        data.multiIndex[e.detail.column] = e.detail.value

        if (e.detail.column == 0) {
            data.multiArray[1] = this.data.item_array[this.data.category_array[e.detail.value]]
            data.multiIndex[1] = 0
        }

        console.log('After changing the index: ', data.multiIndex)
        console.log('After changing the array: ', data.multiArray)
        this.setData(data)
    },

    /**
     * Remove the selected item from the list
     * 
     * @method deleteItem
     * @param{Object} e The delete event
     */
    deleteItem: function (e) {
        var item_id = e.currentTarget.id
        console.log('Try to delete item id: ', item_id, ' name: ', this.data.picked_item[item_id].item_name)

        var new_picked_item = this.data.picked_item
        delete new_picked_item[item_id]
        console.log('New picked item: ', new_picked_item)

        this.setData({
            picked_item: new_picked_item
        })
    },

    /**
     * Update the product with new name and new required material.
     * 
     * @method formSubmit
     * @param{Object} e The submit event
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        var set_product_data = {}
        set_product_data['product_material'] = this.data.picked_item
        set_product_data['product_name'] = e.detail.value.name

        wx.cloud.callFunction({
            name: 'dbSet',
            data: {
                collection_name: db_product,
                set_data: set_product_data,
                uid: this.data.product._id
            },
            success: res => {
                console.log('Update product info success: ', set_product_data)
                pAction.navigateBackUser('修改成功', 1)
            },
            fail: err => {
                console.error('Failed to update the product info: ', err)
                wx.hideLoading()
                wx.showToast({
                    title: '修改失败',
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
 * Get categories and items from database, then format the data to an array to setup the picker
 * 
 * @method setPicker
 * @param{Page} page The page
 */
async function setPicker(page) {
    var categories = await getCategory()
    console.log('Get all categories: ', categories)

    var items = await getItem()
    console.log('Get all items: ', items)
    var formated_item = {}
    for (var i in items) {
        formated_item[items[i].item_name] = items[i]
    }
    console.log('Set the formated_item: ', formated_item)

    var category_array = []
    var item_array = {}

    for (var i in categories) {
        category_array.push(categories[i].category_name)

        var i_array = []
        for (var j in items) {
            if (items[j].category_id == categories[i]._id) {
                i_array.push(items[j].item_name)
            }
        }

        item_array[categories[i].category_name] = i_array
    }
    console.log('Set the category_array: ', category_array)
    console.log('Set the item_array: ', item_array)

    var multiArray = [category_array, item_array[category_array[0]]]
    console.log('Set the multiArray: ', multiArray)

    page.setData({
        categories: categories,
        items: items,
        formated_item: formated_item,
        category_array: category_array,
        item_array: item_array,
        multiArray: multiArray,
        set_picker: true
    })
}


/**
 * Get categories from the database
 * 
 * @method getCategory
 */
function getCategory() {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'dbGet',
            data: {
                collection_name: db_category,
                collection_limit: 100,
                collection_field: {
                    _id: true,
                    category_name: true
                },
                collection_where: {},
                collection_orderby_key: 'category_order',
                collection_orderby_order: 'asc'
            },
            success: res => {
                resolve(res.result)
            },
            fail: err => {
                console.error('Failed to search categories in the collection', err)
                reject()
            }
        })
    })
}


/**
 * Get items from the database
 * 
 * @method getItem
 */
function getItem() {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'dbGet',
            data: {
                collection_name: db_item,
                collection_limit: 100,
                collection_field: {
                    _id: true,
                    category_id: true,
                    item_name: true
                },
                collection_where: {},
                collection_orderby_key: 'category_id',
                collection_orderby_order: 'asc'
            },
            success: res => {
                resolve(res.result)
            },
            fail: err => {
                console.error('Failed to search items in the collection', err)
                reject()
            }
        })
    })
}


/**
 * Get the given product with product_id, and store it in the page data.
 * 
 * @method setProduct
 * @param{Page} page The page
 * @param{String} product_id The id of the selected product
 */
function setProduct(page, product_id) {
    db.collection(db_product)
        .where({
            _id: product_id
        })
        .get({
            success: res => {
                page.setData({
                    product: res.data[0],
                    picked_item: res.data[0].product_material,
                    button_enable: true
                })
                console.log('Modify the product: ', page.data.product)
            },
            fail: err => {
                console.log('Failed to get the selected product: ', err)
            }
        })
}
