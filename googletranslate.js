const axios = require('axios');
async function translation(input, lang='hi', target='en') {

  // 'hi','bn','gu','kn','ml','mr'
  let headers = {
    headers : {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ya29.c.El-PBRWR0e1AAK4ISk5WEw40rYYYmkWNYEsZCXDEpR6P2KnZc6nucGZBE7a6XJXKDvcBdgoFjnmmScMv9AC0k47XePM2EqcBKB5_c8yn5ATojHKOpUJWqarxWKhPYVSqFw'
    }
  };
  let data = {
    q: input,
    source: lang,
    target: target,
    format: 'text'
  };
  
  var translatedText = ''

  try {
    let response = await axios.post('https://translation.googleapis.com/language/translate/v2', data, headers)
    return response.data.data.translations[0].translatedText
  } catch (e) {
    console.error('some error in translate')
  }
    // .then((response) => {
    //   ttext = response.data.data.translations[0].translatedText
    //   // console.log(response.data.data)
    //   translatedText = ttext
    //   return ttext
    // })
    // .catch((error) => {
    //   // console.log(error)
    //   console.log('some error here')
    // })
}



module.exports = {
  translation
}

if (require.main === module) {

  async function _inner() {
    console.log(await translation('हिन्दी में टाइप करें', 'hi', 'en'))
    console.log(await translation('Type in Hindi', 'en', 'hi'))    
  }
  _inner();

}
