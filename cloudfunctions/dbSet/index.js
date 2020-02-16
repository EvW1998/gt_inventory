/**
 * Cloud function to set an item that has the given id to the given data from the given collection in cloud database.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database() // the cloud database

/**
 * Set an item that has the given id to the given data from the given collection.
 * 
 * @method main
 * @param{Object} event An object has keys that contain the collection name and item id for updating and the update data
 * @return{Object} The result of setting data from the collection
 */
exports.main = async (event, context) => {
    try {
        return await db.collection(event.collection_name)
            .doc(event.uid)
            .set({
                data: event.set_data
            })
    }
    catch (e) {
        console.log(e)
    }
}
