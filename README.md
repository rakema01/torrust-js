# torrust-js
A node.js app for interacting with the Torrust API

# How to use
You can get started with
```js
const Torrust = require("torrust-js");
#  Default port should be 443 for HTTPS but can be something else if needed
const client = new Torrust(hostname, port, username, password);

client.getTorrents()
  .then(torrents => {
    console.log(torrents)
  });
```
