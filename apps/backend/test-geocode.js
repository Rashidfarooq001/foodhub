const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});
client
  .reverseGeocode({ params: { latlng: [34.0837, 74.7973], key: 'FAKE_KEY' } })
  .then(console.log)
  .catch((e) => console.error(e.response ? e.response.data : e.message));
