const fs = require("fs");
const Papa = require("papaparse");
const MongoClient = require("mongodb").MongoClient;

function removeHiddenFiles(filelist) {
    return filelist.filter(f => !f.startsWith("."));
}

function readAllCSV(datadir) {
    let files = fs.readdirSync(datadir);
    files = removeHiddenFiles(files);
    let csvfiles = files.filter(f => f.endsWith("csv"));
    let keys = csvfiles.map(f => f.split("_")[1].split(".")[0]);

    let data = {};
    for (let i = 0; i < keys.length; i++) {
        // trim required because files have trailing whitespace
        let content = fs
        .readFileSync(`${datadir}/${csvfiles[i]}`)
        .toString()
        .trim();
        data[keys[i]] = Papa.parse(content, { header: true }).data;
    }
    return data;
}

function readAllGeoJson(datadir) {
    let files = fs.readdirSync(datadir);
    files = removeHiddenFiles(files);
    let geojsonfiles = files.filter(f => f.endsWith("json"));
    let keys = geojsonfiles.map(f => f.split("_")[1].split(".")[0]);

    let data = {};
    for (let i = 0; i < keys.length; i++) {
        data[keys[i]] = require(`${datadir}/${geojsonfiles[i]}`);
    }
    return data;
}

function calculateCentroid(coordinates) {
    coordinates = coordinates[0][0][0]=== undefined? coordinates: coordinates[0]
    let centroid_x = 0.0;
    let centroid_y = 0.0;
    for (let i of coordinates){
        centroid_x += i[0];
        centroid_y += i[1];
    }
    centroid = [centroid_x/coordinates.length, centroid_y/coordinates.length];

    return  {"type": "Point", "coordinates":centroid};
}

function combineCSVandGeoJson(allCSV, allGeoJson) {
    let combinedData = {};

    for (let key of Object.keys(allCSV)) {
        // each key goes to each collection in Mongo
        // entries are individual records in a collection
        let entries = [];

        for (let i = 0; i < allCSV[key].length; i++) {
            entries.push({
                location: allGeoJson[key].geometries[i],
                centroid: calculateCentroid(allGeoJson[key].geometries[i].coordinates),
                metadata: allCSV[key][i]
            });
        }
        combinedData[key] = entries;
    }
    return combinedData;
}

async function insertCombinedDataToMongo(combinedData, dbUrl, dbName) {
    try {
        var conn = await MongoClient.connect(dbUrl);
        var db = conn.db(dbName);
    } catch (e) {
        console.log("error connecting", e);
        return;
    }

    for (let coll of Object.keys(combinedData)) {
        // console.log('Inserting', combinedData[coll].length, 'items to', coll)
        try {
            process.stdout.write(`Dropping collection ${coll} ... `);
            await db.dropCollection(coll);
            process.stdout.write(" DONE \n");
        } catch (e) {}

        process.stdout.write(
            `Inserting ${combinedData[coll].length} items to ${coll} ... `
        );
        await db.collection(coll).insertMany(combinedData[coll]);
        process.stdout.write(" DONE \n");
        // console.log('DONE')
    }

    await conn.close();
    console.log("All entries made successfully");
}

async function markRandomSchoolsAndHospitals(lulcData, dbUrl, dbName) {
    let villages = lulcData.filter(x => (x['metadata']['lc_code'] == 'BURV') || (x['metadata']['lc_code'] == 'BURH'));

    let nSchools = (Math.abs(0.5 - Math.random()) * 10) % villages.length + 1;
    let nHospitals = (Math.abs(0.5 - Math.random()) * 10) % villages.length + 1;

    villages.sort(function() { return Math.random() });   // shuffle
    let schoolsHere = villages.slice(0, nSchools);
    for (let each of schoolsHere) {
        each.location = each.centroid;
    }

    villages.sort(function() { return Math.random() });   // shuffle
    let hospitalsHere = villages.slice(0, nHospitals);
    for (let each of hospitalsHere) {
        each.location = each.centroid;
    }

    try {
        var conn = await MongoClient.connect(dbUrl);
        var db = conn.db(dbName);
    } catch (e) {
        console.log("error connecting", e);
        return;
    }

    try {
        await db.dropCollection('School');
        await db.dropCollection('Hospital');
    } catch (e) {}

    process.stdout.write(`Making schools at ${schoolsHere.length} out of ${villages.length} settlements ... `);
    await db.collection('School').insertMany(schoolsHere);
    db.collection('School').createIndex({location:"2dsphere"});
    process.stdout.write('DONE \n')

    process.stdout.write(`Making hospitals at ${hospitalsHere.length} out of ${villages.length} settlements`);
    await db.collection('Hospital').insertMany(hospitalsHere);
    db.collection('Hospital').createIndex({location:"2dsphere"});
    process.stdout.write('DONE \n')

    conn.close();
}

module.exports = {
    readAllCSV,
    readAllGeoJson,
    combineCSVandGeoJson,
    insertCombinedDataToMongo
};

if (require.main === module) {
    // console.log(readAllCSV('./dataset/Kurudu-csv'))
    // console.log(readAllGeoJson('./dataset/Kurudu-geojson'))

    let allCSV = readAllCSV("../dataset/Kurudu-csv");
    let allGeoJson = readAllGeoJson("../dataset/Kurudu-geojson");

    let combinedData = combineCSVandGeoJson(allCSV, allGeoJson);
    // console.log(combinedData);
    console.log(combinedData["LULC"][0]);
    console.log("hello world     ")
    let dbUrl = 'mongodb://localhost:27017/';
    let dbName = 'sih';

    markRandomSchoolsAndHospitals(combinedData['LULC'], dbUrl, dbName);
    insertCombinedDataToMongo(combinedData, dbUrl, dbName);
}
