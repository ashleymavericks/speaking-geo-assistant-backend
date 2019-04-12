const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
var dotenv = require('dotenv');
dotenv.load();

const makeNLPQuery = require('./dialog').makeQuery;
const queryMapping = require('./queryMapping').mapping;
const translate = require('./googletranslate').translation;

// const geoSpatialQuery = require('./concat_geo').concatGeoJsons;

// makeNLPQuery('suggest a place to build a hospital')

app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(cors({credentials: true, origin: true}))

let dbUrl = process.env.MONGO_URL;
let dbName = process.env.MONGO_DB;

app.get('/nlp', async (req, res) => {
    let q = req.query.q;
    let lang = req.query.lang;
    console.log(q, lang)

    if (lang == 'hi') {
        q = await translate(q)
    }
    if (lang == 'bn') {
        q = await translate(q, 'bn', 'en')
    }
    console.log(q)

    let d = await makeNLPQuery(q);
    console.log(d);
    console.log(lang);
  
    let r = await queryMapping[d.metadata](d.parameters);
    console.log(r.message)

   
    if (lang == 'hi') {
        console.log('translating', r.message, await translate(r.message, 'en', 'hi'))
        r['message'] = await translate(r.message, 'en', 'hi')
        console.log('translated string', r['message'])
    }
    if (lang == 'bn') {
        console.log('translating', r.message, await translate(r.message, 'en', 'bn'))
        r['message'] = await translate(r.message, 'en', 'bn')
        console.log('translated string', r['message'])
    }
    console.log(r.message)

    // let r = await geoSpatialQuery(dbUrl, dbName);
    res.json(r);
});

app.get('/', (req, res) => {
    res.send('api in nlp');
})
	
app.listen(process.env.PORT);
console.log(`Running on port ${process.env.PORT}...`);
