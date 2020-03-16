/**
 * Cloud function to get all the promotion events which contains the same date, compared to the given start and end date.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database() // the cloud database
const db_promotion_event = 'promotion_event' // the collection of promotion events

exports.main = async (event, context) => {
    try {
        var collection_limit = 100
        var start_date = event.start_date
        var end_date = event.end_date

        var get_result = []
        var total_amount = 0
        var result_amount = collection_limit

        const _ = db.command

        var period1 = {
            end_date: _.and([_.gte(start_date), _.lte(end_date)]),
            restaurant_id: event.restaurant_id
        }

        var period2 = {
            start_date: _.and([_.gte(start_date), _.lte(end_date)]),
            restaurant_id: event.restaurant_id
        }

        var period3 = {
            start_date: _.lte(start_date),
            end_date: _.gte(end_date),
            restaurant_id: event.restaurant_id
        }

        while (result_amount == collection_limit) {
            var new_result = await db.collection(db_promotion_event)
                .skip(total_amount)
                .limit(collection_limit)
                .where(_.or([period1, period2, period3]))
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
