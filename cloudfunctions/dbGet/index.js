/**
 * Cloud function to get data from cloud database.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database() // the cloud database

exports.main = async (event, context) => {
    try {
        var collection_name = event.collection_name
        var collection_field = event.collection_field
        var collection_limit = event.collection_limit
        var collection_orderby_key = event.collection_orderby_key
        var collection_orderby_order = event.collection_orderby_order

        var collection_where = {}
        var collection_gt = event.collection_gt

        if(collection_gt) {
            console.log('Collection where has greater than enable')
            var collection_where_key = event.collection_where_key
            var collection_gt_value = event.collection_gt_value
            collection_where[collection_where_key] = db.command.gt(collection_gt_value)
        } else {
            console.log('Collection where is normal')
            collection_where = event.collection_where

            console.log(collection_where)
        }
        
        var get_result = []
        var total_amount = 0
        var result_amount = collection_limit

        while (result_amount == collection_limit) {
            var new_result = await db.collection(collection_name)
                            .skip(total_amount)
                            .limit(collection_limit)
                            .field(collection_field)
                            .where(collection_where)
                            .orderBy(collection_orderby_key, collection_orderby_order)
                            .get()
            
            new_result = new_result.data
            result_amount = new_result.length

            console.log(result_amount)

            for (var i in new_result) {
                total_amount ++

                get_result.push(new_result[i])
            }
        }

        return get_result
    } catch (e) {
        console.error(e)
    }
}
