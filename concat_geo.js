const MongoClient = require('mongodb').MongoClient


async function concatGeoJsons( dbUrl, dbName) {
    try {
        var conn = await MongoClient.connect(dbUrl)
        var db = conn.db(dbName)
        
        let cursor = await db.collection('LULC').find(
            {'metadata.lc_code':'WLSP'}, 
            {'location': true,'id': false,'metadata': false}
        )
        let geoCollection = []
        
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            geoCollection.push(doc)
        }
        
        // console.log(geoCollection)
        finalGeo = {"type":"GeometryCollection", "geometries": []}
        for (let i of geoCollection){
            finalGeo.geometries.push(i.location)
        }
        conn.close()
        return finalGeo
    } catch (e) {
        console.log('error connecting', e)
        return
    }
}

module.exports = {concatGeoJsons}

if (require.main === module){
    let dbUrl = process.env.MONGO_URL
    let dbName = process.env.MONGO_DB
    concatGeoJsons(dbUrl, dbName)
}
