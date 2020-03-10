/**
 * Modify a product of the name and materails it requires
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_product = 'product' // the collection of products

var item_key_name = {} // the items in an Object that the key is the item name
var category_array = [] // the categories in an array
var item_array = {} // the items in an array

var name_filled = true // whether the name input is filled
var material_filled = true // whether the material is filled


Page({

    /**
     * Data for the page
     */
    data: {
        product_selected: {}, // the selected product
        error_happened: true, // whether error happened
        multiArray: [], // the choices in the multiSelector
        multiIndex: [0, 0], // the index of the multiSelector
        item_key_id: {}, // the items in an Object that the key is the item id
        picked_item: {}, // the items are picked
        set_picker: false, // whether the picker is set
        name_warn_enable: false, // whether the name input warning icon should display
        material_warn_enable: false, // whether the material warning icon should display
        button_enable: true, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page is loaded, set the picker for items and search the given product
     */
    onLoad: function (options) {
        item_key_name = {}
        category_array = []
        item_array = {}

        name_filled = true
        material_filled = true

        setPickerAndProduct(this, options.product_id)
    },

    /**
     * Check the input, enable the confirm button if the length is greater than 0,
     * enable the warning icon if the length is 0
     * 
     * @method nameInput
     * @param{Object} event The event of the input
     */
    nameInput: function (event) {
        var name_warn_enable = false
        var button_enable = false

        if (event.detail.value.length === 0) {
            name_filled = false
            name_warn_enable = true
        } else {
            name_filled = true
        }

        if (name_filled && material_filled) {
            button_enable = true
        }

        this.setData({
            name_warn_enable: name_warn_enable,
            button_enable: button_enable
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
        var picked = item_array[category_array[picker_index[0]]][picker_index[1]]
        console.log('Picked material item: ', picked)

        var picked_item = this.data.picked_item

        if (item_key_name[picked]._id in picked_item) {
            wx.showToast({
                title: '请勿重复添加材料',
                icon: 'none'
            })
        } else {
            picked_item[item_key_name[picked]._id] = { 'item_id': item_key_name[picked]._id }

            material_filled = true
            var button_enable = false
            var material_warn_enable = false

            if (material_filled && name_filled) {
                button_enable = true
            }

            this.setData({
                picked_item: picked_item,
                material_warn_enable: material_warn_enable,
                button_enable: button_enable
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
        var data = {
            multiArray: this.data.multiArray,
            multiIndex: this.data.multiIndex
        }
        data.multiIndex[e.detail.column] = e.detail.value

        if (e.detail.column === 0) {
            data.multiArray[1] = item_array[category_array[e.detail.value]]
            data.multiIndex[1] = 0
        }

        this.setData(data)
    },

    /**
     * Remove the selected item from the list
     * 
     * @method deleteItem
     * @param{Object} e The delete event
     */
    deleteItem: function (e) {
        var set_data = {}
        var item_id = e.currentTarget.id

        console.log('Remove picked item ', item_id, this.data.item_key_id[item_id].name)

        var new_picked_item = this.data.picked_item
        delete new_picked_item[item_id]

        set_data['picked_item'] = new_picked_item

        if (Object.keys(new_picked_item).length === 0) {
            material_filled = false
            set_data['material_warn_enable'] = true
            set_data['button_enable'] = false
        }

        this.setData(set_data)
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

        updateProductProcess(this, e.detail.value)
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
async function setPickerAndProduct(page, product_id) {
    try {
        var material_picker = wx.getStorageSync('material_picker')
        var categories = material_picker.categories
        var items = material_picker.items

        var item_key_id = {}
        for (let i in items) {
            item_key_name[items[i].name] = items[i]
            item_key_id[items[i]._id] = items[i]
        }

        for (let i in categories) {
            category_array.push(categories[i].name)

            let i_array = []
            for (let j in items) {
                if (items[j].category_id === categories[i]._id) {
                    i_array.push(items[j].name)
                }
            }

            item_array[categories[i].name] = i_array
        }

        var multiArray = [category_array, item_array[category_array[0]]]

        var products = wx.getStorageSync('products')
        var product_selected = products[product_id]

        page.setData({
            error_happened: false,
            item_key_id: item_key_id,
            multiArray: multiArray,
            set_picker: true,
            product_selected: product_selected,
            picked_item: product_selected.material
        })
    } catch (err) {
        realTimeLog.error('Failed to get the material picker data or the selected product from the local stroage.', err)

        wx.showToast({
            title: '存储错误，请重试',
            icon: 'none'
        })
    }
}


async function updateProductProcess(page, inputs) {
    var update_product_data = {}

    page.setData({
        progress: 0,
        progress_text: '检查名称',
        progress_enable: true
    })

    if (inputs.name !== page.data.product_selected.name) {
        var n_result = await isRepeated(inputs.name)

        if (n_result.stat) {
            if (n_result.result) {
                page.setData({
                    progress: 0,
                    progress_text: '未开始',
                    progress_enable: false
                })

                wx.hideLoading()
                wx.showModal({
                    title: '错误',
                    content: '新增在售产品的名称与此餐厅已有产品的名称重复，请更改后重试。',
                    showCancel: false
                })

                return
            }

        } else {
            page.setData({
                progress: 0,
                progress_text: '未开始',
                progress_enable: false
            })

            wx.hideLoading()
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            })

            return
        }
    }

    update_product_data['restaurant_id'] = app.globalData.restaurant_id
    update_product_data['name'] = inputs.name
    update_product_data['material'] = page.data.picked_item

    page.setData({
        progress: 50,
        progress_text: '检查通过，正在上传修改后的在售产品'
    })

    var update_result = await updateProduct(page.data.product_selected._id, update_product_data)

    if (update_result.stat) {
        page.setData({
            progress: 100,
            progress_text: '上传成功'
        })

        realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified a product ', page.data.product_selected._id, update_product_data, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

        pAction.navigateBackUser('修改成功', 1)
    } else {
        page.setData({
            progress: 0,
            progress_text: '未开始',
            progress_enable: false
        })

        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })

        return
    }
}


function isRepeated(name) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        db.collection(db_product)
            .where({
                restaurant_id: app.globalData.restaurant_id,
                name: name
            })
            .field({
                _id: true
            })
            .get({
                success: res => {
                    result['stat'] = true
                    if (res.data.length === 0) {
                        result['result'] = false
                    }

                    resolve(result)
                },
                fail: err => {
                    realTimeLog.error('Failed to get the product data with the same date as the new product in the same restaurant from the database.', err)

                    resolve(result)
                }
            })
    })
}


function updateProduct(product_id, update_product_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbSet',
            data: {
                collection_name: db_product,
                set_data: update_product_data,
                uid: product_id
            },
            success: res => {
                if (res.result.stats.updated === 1) {
                    result['stat'] = true
                    result['result'] = res
                } else {
                    realTimeLog.warn('The return value of the dbSet() is not correct while updateing the product.', res)
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update the product by using dbSet().', err)
                resolve(result)
            }
        })
    })
}
