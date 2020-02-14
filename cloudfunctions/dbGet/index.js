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
        var collection_where = event.collection_where
        var collection_field = event.collection_field
        var collection_limit = event.collection_limit
        var collection_orderby_key = event.collection_orderby_key
        var collection_orderby_order = event.collection_orderby_order
        
        var get_result = {}
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

                get_result[total_amount - 1] = new_result[i]
            }
        }

        return get_result
    } catch (e) {
        console.error(e)
    }
}
