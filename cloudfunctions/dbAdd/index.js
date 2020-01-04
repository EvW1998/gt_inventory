const cloud = require('wx-server-sdk')

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * Add the data into the given collection
 * 
 * @param{Object} event The collection name and data to add into the db
 * @return{Object} The result of adding data into the collection
 */
exports.main = async (event, context) => {
    try{
        return db.collection(event.collection_name)
            .add({
                data: event.add_data
            })
        }
    catch(e) {
        console.log(e)
    }
}