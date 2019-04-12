// this file maps intent from DialogFlow to respective query in queries.js

const queries = require('./queries');

let dbUrl = process.env.MONGO_URL;
let dbName = process.env.MONGO_DB;


queries.setupDatabase(dbUrl, dbName);


const mapping = {

    'Default Fallback Intent': async function (parameters) {
        return {
            message: 'Sorry, I could not recognize this command',
            geoInfo: [],
            showInCards: false,
            intent: {
                action: 'failure'
            }
        }
    },

    find_in_radius: async function (parameters) {

        let radius = parameters['unit-length']['amount'];
        radius = radius === undefined ? 100000 : radius
        // console.log(radius)
        let factor = 1;
        if (parameters['unit-length'].unit === 'm')
            factor = 1;
        else if (parameters['unit-length'].unit === 'km')
            factor = 1000;
        else if (parameters['unit-length'].unit === 'mi')
            factor = 1600;
        let distance = radius * factor;

        switch (parameters.poi) {
            case 'schools':
                let schools = await queries.findSchoolsInRadius(distance);
                for (let each of schools) {
                    each['showInCards'] = true
                    color: '#fff'
                }
                return {
                    message: `There are ${schools.length} schools in given radius.`,
                    geoInfo: schools,
                    intent: {
                        action: 'plot'
                    }
                }
                break;

            case 'hospitals':
                let hospitals = await queries.findHospitalsInRadius(distance);
                for (let each of schools) {
                    each['showInCards'] = true
                    color: '#fff'
                }
                return {
                    message: `There are ${hospitals.length} hospitals in given radius.`,
                    geoInfo: hospitals,
                    intent: {
                        action: 'plot'
                    }
                }
                break;
        }
    },

    find_future_X: async function (parameters) {

        let number = parameters['number'];
        let budget = parameters['number'];

        var cas1 = parameters['availability'];
        var cas2 = parameters['current'];

        switch (cas1) {

            case 'findAvailabilityWasteLand':

                number = number == '' ? 100 : number
                let area = 0.000000009643762973 * number;
                // area = 0
                let futureX = await queries.findWasteLand();

                let filteredAnswer = [];

                for (var i = futureX.length - 1; i >= 0; i--) {
                    console.log(futureX[i].metadata.Shape_Area, area)
                    console.log(typeof (futureX[i].metadata.Shape_Area), typeof (area))
                    if (futureX[i].metadata.Shape_Area >= area) {
                        futureX[i]["showInCards"] = true;
                        filteredAnswer.push(futureX[i]);
                    }
                }
                console.log(filteredAnswer);
                return {
                    message: `We found ${filteredAnswer.length} suitable location.`,
                    geoInfo: filteredAnswer,
                    intent: { action: 'plot' },
                    showInCards: true
                }
                break;
        }

        switch (cas2) {
            case 'getKuchaRoads':
                ans = await queries.genericFind('Road', { 'metadata.type': 'Kutchha Road' })
                budget = parameters['number'];
                if (!budget)
                    budget = 10000
                filteredans = await queries.filterRoadByBudget(budget, ans)
                for (let each of filteredans) {
                    each["metadata"]["Shape_Area"] = 0
                    each['showInCards'] = true
                }
                // console.log(filteredans);
                message = `${filteredans.length} Kutchha roads can be developed with given budget of ${budget} crores`
                return {
                    message: message,
                    geoInfo: filteredans,
                    intent: { action: 'plot' },
                    showInCards: true
                }
        }

    },

    find_current_X: async function (parameters) {
        let current;

        if (typeof (parameters['current']) == 'string') {
            current = parameters['current']
        } else {
            current = parameters['current'][0]
        }

        let cursor;
        let ans = [];
        let message = 'Cannot determine the command';

        switch (current) {
            case 'getReservoir':
                ans = await queries.genericFind('LULC', { 'metadata.lc_code': 'WBRT' })
                message: `Found ${ans.length} reservoirs.`
                break;
            case 'getCanal':
                ans = await queries.genericFind('LULC', { 'metadata.dscr2': 'Canal' })
                message: `Found ${ans.length} canals.`
                break;
            case 'getAgriculture':
                ans = await queries.genericFind('LULC', { 'metadata.lc_code': { $in: ['AGPL', 'AGCR'] } })
                message = `Found ${ans.length} agriculture lands.`
                for (let each of ans) {
                    each['showInCards'] = true
                    switch (each.metadata.lc_code) {
                        case 'AGPL':
                            each['color'] = '#7ed321'
                            break

                        case 'AGCR':

                            each['color'] = '#d0cb00'
                            break
                        default:
                            each['color'] = 'blue'
                    }
                }
                break;
            case 'getAllWater':
                ans = await queries.genericFind('LULC', { 'metadata.dscr1': 'Water bodies' })
                console.log('ans', ans)
                for (let each of ans) {
                    each['showInCards'] = true

                    switch (each.metadata.lc_code) {
                        case 'WBCN':
                            each['color'] = '#299ef4'
                            break

                        case 'WBLP':
                        case 'WBRS':
                            each['color'] = '#144ba2'
                            break

                        case 'WBRT':
                            each['color'] = '#00e1e1'
                            break

                        default:
                            each['color'] = 'blue'
                    }
                }
                message = `Found ${ans.length} water sources.`
                break;

            case 'getMines':
                ans = await queries.genericFind('LULC', { 'metadata.dscr3': 'Mining / Industrial' })
                message = `Found ${ans.length} mines.`
                break;

            case 'getDrainage':
                ans = await queries.genericFind('LULC', { 'metadata.dscr3': '' })
                message = `Found ${ans.length} drainages.`
                break;

            case 'getTransport':
                ans = await queries.genericFind('LULC', { 'metadata.dscr3': 'Transportation' })
                message = `Found ${ans.length} transport locations.`
                break;

            case 'population':
                ans = queries.describeDemography()
                message = `There are ${ans.population} people with sex ratio ${ans.sex_ratio} and ${ans['0_6_age']} children.`
                ans = null
                break

            default:
                console.log('no match')
        }
        return {
            message: message,
            geoInfo: ans,
            showInCards: true,
            intent: { action: 'plot' }
        }
    },

    find_nearest_NH: async function (parameters) {
        let result = await queries.findNearestNationalHighway();
        result.gp['color'] = '#c0ea56'
        result.gp['showInCards'] = false
        result.nh['color'] = '#fff'
        result.nh['showInCards'] = false

        return {
            message: `Nearest national highway is at approximately ${result.distance} kilometers`,
            geoInfo: [result.gp, result.nh],
            intent: { action: 'plot' },
            showInCards: false
        };
    },
    find_nearest_schools: async function (parameters) {
        let result = await queries.findNearestSchoolsToVillage();
        // result['showInCards'] = false
        return {
            message: `Nearest school to the village at approximately ${result.schools[0].distance} kilometers`,
            geoInfo: [result.village, ...result.schools],

            intent: { action: 'plot' },
            showInCards: false
        }
    },
    navigate: async function (parameters) {
        let village = parameters.navigate_to
        if (village === 'chandlodiya') {
            return {
                message: `Navigating to ${village}.`,
                intent: {
                    action: 'moveTo',
                    loc: {
                        lng: 72.5410875, lat: 23.0632311
                    },
                    zoom: 21
                },
                geoInfo: []
            }
        } else {
            return {
                message: `Navigating to ${village}.`,
                intent: {
                    action: 'moveTo',
                    loc: { lng: 84.1538802, lat: 18.5337648 },
                    zoom: 14
                },
                geoInfo: []
            }
        }

    },
    switch_language: async function (parameters) {
        let language_initials = parameters.poi.slice(0, 2)
        return {
            message: `Changing language to ${parameters.poi}`,
            intent: {
                action: 'changeLanguage',
                lang: language_initials
            },
            geoInfo: []
        }

    }

}


module.exports = { mapping }
