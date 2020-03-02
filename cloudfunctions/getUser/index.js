/**
 * Cloud function to get all users in the restaurant with given id.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database() // the cloud database
const db_user = 'user' // the collection of promotion events

exports.main = async (event, context) => {
    try {
        var collection_limit = 100
        var collection_filed = event.collection_filed
        var r_id = event.r_id

        var get_result = []
        var total_amount = 0
        var result_amount = collection_limit

        const _ = db.command

        var w = {}
        w[r_id] = _.exists(true)

        while (result_amount == collection_limit) {
            var new_result = await db.collection(db_user)
                .skip(total_amount)
                .limit(collection_limit)
                .where(w)
                .field(collection_filed)
                .get()

            new_result = new_result.data
            result_amount = new_result.length

            console.log(result_amount)

            for (var i in new_result) {
                total_amount++
                get_result.push(new_result[i])
            }
        }

        return get_result
    } catch (e) {
        console.error(e)
    }
}
