/**
 * Update the selected user's name and permission level
 */
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items


Page({

    /**
     * Data for the page
     */
    data: {
        multiArray: [[], []], // the choices in the multiSelector
        multiIndex: [0, 0], // the index of the multiSelector
        search_state: 'searching', // the state of searching items
        categories: {}, // the categories in the category collection
        items: {}, // the items in the item collection
        button_enable: false, // whether the sumbit button is enabled
        warn_enable: false // whether the warning icon should display
    },

    /**
     * When the page is loaded
     */
    onLoad: function () {
        setPicker(this)
    },

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

    addItem: function (event) {
        console.log(event)
        console.log(this.data.picked_item)
    },

    changeCategory: function (e) {
        console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
        var data = {
            multiArray: this.data.multiArray,
            multiIndex: this.data.multiIndex
        };
        data.multiIndex[e.detail.column] = e.detail.value;
        switch (e.detail.column) {
            case 0:
                switch (data.multiIndex[0]) {
                    case 0:
                        data.multiArray[1] = ['扁性动物', '线形动物', '环节动物', '软体动物', '节肢动物'];
                        break;
                    case 1:
                        data.multiArray[1] = ['鱼', '两栖动物', '爬行动物'];
                        break;
                }
                data.multiIndex[1] = 0;
                break;
        }
        console.log(data.multiIndex);
        this.setData(data);
    },

    /**
     * When the confirm button triggered, update the selected user info
     * 
     * @method formSubmit
     * @param{Object} e The return val from the form submit
     */
    formSubmit: function (e) {

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


async function setPicker(page) {
    var categories = await getCategory()

    page.setData({
        categories: categories
    })
    console.log('Get all categories: ', page.data.categories)

    var items = await getItem()

    page.setData({
        items: items
    })
    console.log('Get all items: ', page.data.items)
}


function getCategory() {
    return new Promise((resolve, reject) => {
        db.collection(db_category)
            .field({
                _id: true,
                category_name: true
            })
            .get({
                success: res => {
                    resolve(res.data)
                },
                fail: err => {
                    console.error('Failed to search categories in the collection', err)
                    reject()
                }
            })
    })
}


function getItem() {
    return new Promise((resolve, reject) => {
        db.collection(db_item)
            .field({
                _id: true,
                category_id: true,
                item_name: true
            })
            .get({
                success: res => {
                    resolve(res.data)
                },
                fail: err => {
                    console.error('Failed to search items in the collection', err)
                    reject()
                }
            })
    })
}
