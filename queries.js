const MongoClient = require("mongodb").MongoClient;
const demographics = require('./demographic.json')

var conn, db;

function euclideanDistance(coord1, coord2) {
    let x_square = Math.pow((coord1[0] - coord2[0]), 2);
    let y_square = Math.pow((coord1[1] - coord2[1]), 2);
    return Math.sqrt(x_square + y_square);
}

function getMinPos(sequence) {
    if (sequence.length == 0) {
        return 0;
    }
    let minPos = 0, minValue = sequence[0]
    for (let i = 1; i < sequence.length; i++) {
        if (sequence[i] < minValue) {
            minValue = sequence[i];
            minPos = i;
        }
    }
    return minPos;
}

async function setupDatabase(dbUrl, dbName) {
    try {
        conn = await MongoClient.connect(dbUrl);
        db = conn.db(dbName);
    } catch (e) {
        console.log("error connecting to database", e);
        return;
    }
}

async function cursorToArray(cursor) {
    let result = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        result.push(doc);
    }
    return result;
}

async function findSchools() {
    let cursor = await db.collection("School").find();
    let schools = await cursorToArray(cursor);
    return schools;
}

async function findHospitals() {
    let cursor = await db.collection("Hospital").find();
    let hospitals = await cursorToArray(cursor);
    return hospitals;
}

async function findDrainage() {
    let cursor = await db.collection("Drainage").find(
        {
            "metadata.dr_code": "DRST"
        }
        
    );
    let drainage = await cursorToArray(cursor);
    return drainage;
}

async function findCanals() {
    let cursor = await db
    .collection("Drainage")
    .find({ "metadata.dr_code": { $in: ["CANM", "CAND"] } });
    let canals = await cursorToArray(cursor);
    return canals;
}

async function slope(fcode) {
    //Translation from fcode from class should be done by dialogflow
    let cursor = await db.collection("Slope").find(
        {
            "metadata.fcode": fcode
        }
        
    );
    let slopes = await cursorToArray(cursor);
    return slopes;
}

async function findSchoolsInRadius(radius) {
    // there's just GP available this time. So, just consider that
    let kuruduGp = await db.collection("Panchayat").findOne();
    
    let cursor = await db.collection("School").find({
        location: {
            $near: {
                $geometry: kuruduGp.centroid,
                $maxDistance: radius,
                $minDistance: 0
            }
        }
    });
    
    let schools = await cursorToArray(cursor);
    return schools;
}

async function showPanchayatArea(){
    let cursor = await db.collection('Panchayat').find()
    let panchayat = await cursorToArray(cursor)
    return panchayat  
}

async function findByRoadType(type){
    let cursor = await db.collection('Road').find(
        {'metadata.type': type}
    )
    let roads = await cursorToArray(cursor)
    return roads
    
}
async function findByRoadStatus(status){
    let cursor = await db.collection('Road').find(
        {'metadata.status': status}
    )
    let roads = await cursorToArray(cursor)
    return roads
}
async function genericFind(collName, findQuery) {
  let cursor = db.collection(collName).find(findQuery)
  let result = await cursorToArray(cursor);
  return result;
}
async function showVillage(villname){
    //get villname somehow
    let cursor = await db.collection('Village').find(
        {'metadata.villname': villname}
    )
    let village = await cursorToArray(cursor)
    return village
}

async function findWasteLand() {
    let cursor = db.collection('LULC').find({'metadata.dscr3':'Barren rocky'})
    let wasteLands = await cursorToArray(cursor);
    
    return wasteLands;
}


async function findHospitalsInRadius(radius) {
    // there's just GP available this time. So, just consider that
    let kuruduGp = await db.collection("Panchayat").findOne();
    
    let cursor = await db.collection("Hospital").find({
        location: {
            $near: {
                $geometry: kuruduGp.centroid,
                $maxDistance: radius,
                $minDistance: 0
            }
        }
    });
    
    let hospitals = await cursorToArray(cursor);
    return hospitals;
}

async function findNearestNationalHighway() {
    // there's just GP available this time. So, just consider that
    let kuruduGp = await db.collection("Panchayat").findOne();
    
    let cursor = await db.collection("Road").find(
        { "metadata.status": "National Highway" }
    );
    
    let allNH = await cursorToArray(cursor);
    let distances = allNH.map(nh => euclideanDistance(nh.centroid.coordinates, kuruduGp.centroid.coordinates));
    let minPos = getMinPos(distances);

    return {
        gp: kuruduGp,
        nh: allNH[minPos],
        distance: distances[minPos]
    }
}
async function findNearestSchoolsToVillage(village_name){
  let village = (await genericFind('LULC', {'metadata.PI_code': village_name} ))[0]
  let schools = await genericFind('School',{})
  village['showInCards'] = false
  village['color']= '#c0ea56'
  for (let each of schools) {
    each['showInCards'] = true
    distance_from_village = euclideanDistance(each.centroid.coordinates, village.centroid.coordinates)
    each.distance = distance_from_village*100
    each[color]= '#000'
  }
  schools.sort((x,y ) =>x.distance> y.distance)
  console.log(schools)
  return {
    village: village,
    schools: schools
  }

}

async function filterRoadByBudget(budget, ans) {
  ans.sort(function(a, b){
      return a.metadata.Shape_Leng - b.metadata.Shape_Leng
  })
  ans_sorted = []
  cost_spent = 0
  budget_left = budget
  factor = 100;

  for (var i = 0 ; i < ans.length; i++) {
    if(parseFloat(ans[i].metadata.Shape_Leng) * factor <= budget_left) {
      budget_left -= ans[i].metadata.Shape_Leng * factor
      ans_sorted.push(ans[i]);
    }
  }

  return ans_sorted;
}


function describeDemography() {
    // return {
    //     gp: null
    // }
    return demographics.kurudu.people;
}

module.exports = {
    setupDatabase,
    // findSchools,
    // findHospitals,
    findDrainage,
    findCanals,
    findSchoolsInRadius,
    findHospitalsInRadius,
    findWasteLand,
    genericFind,
    findNearestNationalHighway,
    describeDemography,
    findNearestSchoolsToVillage,
    filterRoadByBudget
};


if (require.main === module) {

  async function _inner() {
    let dbUrl = process.env.MONGO_URL;
    let dbName = process.env.MONGO_DB;
    await setupDatabase(dbUrl, dbName);

    // console.log(await findSchoolsInRadius(1000));
    // console.log(await findHospitalsInRadius(2000));
    console.log(await findByRoadType('Kutchha Road'))
    console.log(await findByRoadStatus('Village Road'))
    
    conn.close();
  }
  _inner();

}
