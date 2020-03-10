/**
 * The page to show all the products in the product collection.
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_product = 'product' // the collection of products
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items

const product_add_page = '../productAdd/productAdd' // the page url of adding a new product
const product_modify_page = '../productModify/productModify' // the page url of modifying a product


Page({

    /**
     * Data for this page
     */
    data: {
        search_state: 'searching', // the state of the searching products
        products: [], // the products in the product collection
        product_amount: 0, // the amount of products
        selected_product: {}, // the selected product for removing
        show_tip: false, // whether to show the tip of product management
        show_remove: false, // whether to show the dialog to remove a product
        product_add_page: product_add_page, // the page url of adding a new product
        product_modify_page: product_modify_page // the page url of modifying a product
    },

    /**
     * When load the page
     */
    onLoad: function () {

    },

    /**
     * When show the page, get all products info
     */
    onShow: function () {
        setAllInfo(this)
    },

    onPullDownRefresh: function () {
        setAllInfo(this)
    },

    onUnload: function () {
        wx.removeStorageSync('material_picker')
        wx.removeStorageSync('products')
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
     * Open the half screen dialog of removing product.
     * 
     * @method openRemoveDialog
     * @param{Object} e The longpress event
     */
    openRemoveDialog: function (e) {
        var product_id = e.currentTarget.id
        console.log('Open the half screen dialog of removing')
        console.log('Selected product: ', product_id)

        var product = ''

        for (var i in this.data.products) {
            if (this.data.products[i]._id == product_id) {
                product = this.data.products[i]
                break
            }
        }

        this.setData({
            selected_product: product,
            show_remove: true
        })
    },

    /**
     * Close the half screen of removing product.
     * 
     * @method closeRemoveDialog
     */
    closeRemoveDialog: function() {
        console.log('Close the half screen dialog of removing')
        this.setData({
            show_remove: false
        })
    },

    /**
     * Remove the selected product from the database.
     * 
     * @method removeProduct
     */
    removeProduct: function() {
        wx.showLoading({
            title: '删除中',
            mask: true
        })

        var product = this.data.selected_product
        console.log('Try to remove the selected product: ', product)

        wx.cloud.callFunction({
            name: 'dbRemove',
            data: {
                collection_name: db_product,
                uid: product._id
            },
            success: res => {
                console.log('Remove product success: ', res)

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
                console.error('Failed to remove product: ', err)

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


async function setAllInfo(page) {
    var picker = {}
    var get_result = await getCategoryAndItem()

    if (get_result.stat) {
        picker = get_result.result
    } else {
        page.setData({
            search_state: 'error'
        })

        wx.stopPullDownRefresh()
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })

        return
    }

    try {
        wx.setStorageSync('material_picker', picker)
    } catch (err) {
        realTimeLog.error('Failed to store the material picker data into the local storage.', err)

        page.setData({
            search_state: 'error'
        })

        wx.stopPullDownRefresh()
        wx.showToast({
            title: '存储错误，请重试',
            icon: 'none'
        })

        return
    }

    getProduct(page)
}


function getCategoryAndItem() {
    return new Promise((resolve, reject) => {
        var total_get = 2
        var curr_get = 0

        var result = {}
        result['stat'] = false
        result['result'] = {}

        var collection_where = {}
        collection_where['restaurant_id'] = app.globalData.restaurant_id

        var collection_field_category = {}
        collection_field_category['_id'] = true
        collection_field_category['name'] = true

        wx.cloud.callFunction({
            name: 'dbGet',
            data: {
                collection_name: db_category,
                collection_limit: 100,
                collection_field: collection_field_category,
                collection_where: collection_where,
                collection_orderby_key: 'category_order',
                collection_orderby_order: 'asc'
            },
            success: res => {
                result['result']['categories'] = res.result

                curr_get++
                if (curr_get === total_get) {
                    result['stat'] = true
                    resolve(result)
                }
            },
            fail: err => {
                realTimeLog.error('Failed to get all the category in the current restaurant by using dbGet().', err)
                resolve(result)
            }
        })

        var collection_field_item = {}
        collection_field_item['_id'] = true
        collection_field_item['category_id'] = true
        collection_field_item['name'] = true

        wx.cloud.callFunction({
            name: 'dbGet',
            data: {
                collection_name: db_item,
                collection_limit: 100,
                collection_field: collection_field_item,
                collection_where: collection_where,
                collection_orderby_key: 'category_id',
                collection_orderby_order: 'asc'
            },
            success: res => {
                result['result']['items'] = res.result

                curr_get++
                if (curr_get === total_get) {
                    result['stat'] = true
                    resolve(result)
                }
            },
            fail: err => {
                realTimeLog.error('Failed to get all the items in the current restaurant by using dbGet().', err)
                resolve(result)
            }
        })
    })
}


/**
 * Set all the product info into the page data.
 * 
 * @method getProduct
 * @param{Page} page The page
 */
function getProduct(page) {
    var collection_where = {}
    collection_where['restaurant_id'] = app.globalData.restaurant_id

    var collection_field = {}
    collection_field['restaurant_id'] = false

    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_product,
            collection_limit: 100,
            collection_field: collection_field,
            collection_where: collection_where,
            collection_orderby_key: 'null',
            collection_orderby_order: 'asc'
        },
        success: res => {
            if (res.result.length === 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var storage_product = {}
                for (let i in res.result) {
                    storage_product[res.result[i]._id] = res.result[i]
                }

                try {
                    wx.setStorageSync('products', storage_product)
                } catch (err) {
                    realTimeLog.error('Failed to store the products data into the local storage.', err)

                    page.setData({
                        search_state: 'error'
                    })

                    wx.stopPullDownRefresh()
                    wx.showToast({
                        title: '存储错误，请重试',
                        icon: 'none'
                    })

                    return
                }
                
                var products = addOrder(res.result, res.result.length)

                page.setData({
                    search_state: 'found',
                    products: products,
                    product_amount: res.result.length
                })
            }

            console.log('View all the products in the current restaurant.', res.result)
            wx.stopPullDownRefresh()
        },
        fail: err => {
            page.setData({
                search_state: 'error'
            })

            wx.stopPullDownRefresh()
            realTimeLog.error('Failed to get all the products in the current restaurant by using dbGet().', err)
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            })
        }
    })
}


function addOrder(target, amount) {
    var order = 1

    for (var i in target) {
        var new_order = order.toString()

        if (amount > 9 && order < 10) {
            new_order = '0' + new_order
        }

        if (amount > 99 && order < 100) {
            new_order = '0' + new_order
        }

        target[i]['order'] = new_order

        order++
    }

    return target
}
