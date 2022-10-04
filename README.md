# torrust-js
A node.js app for interacting with the Torrust API

# How to use
You can get started with
```js
const Torrust = require("torrust-js");
//  Default port should be 443 for HTTPS but can be something else if needed
const client = new Torrust("username", "password", "torrust.domain.tld", 443);

client.login()
  .then(() => {
    console.log(client.token);
    client.getTorrents()
      .then(torrents => {
        console.log(torrents)
      });
  })
```

Please note that the current form of the verifyToken function only exists as a workaround for the current lack of user token verification, which would lead to an improper personal announce URL. Torrust already has this fixed but rpdl is still working to catch up to the latest updates.
