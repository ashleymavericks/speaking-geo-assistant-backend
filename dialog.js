const axios = require('axios');

async function makeQuery (query) {
  let body = {
    "query": query,
    lang: 'en',
    sessionId: '54ce265e-94ef-454a-9e87-9516d5b68d05',
    timezone: 'Asia/Kolkata'
  }
  
  let headers = {
    'Authorization': 'Bearer 268e0269e1d849a5b47196434218496d'
  };
  let res = {}
  await axios.get('https://api.dialogflow.com/v1/query?v=20170712',{
    params: body,
    headers: headers
    })
    .then(function (response) {

      response = response.data
      res = {
        resolvedQuery : response.result.resolvedQuery,
        parameters : response.result.parameters,
        metadata : response.result.metadata.intentName,
      }
      return res
    })
    .catch(function (error) {
    console.log(error);
    });
  return res
}


module.exports = {
  makeQuery
} 

