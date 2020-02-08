/**
 * Cloud function to add a new item to the given collection in cloud database.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database() // the cloud database

/**
 * Add the given data into the given collection in cloud database.
 * 
 * @method main
 * @param{Object} event An object has keys that contain the collection name and new data for adding
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
