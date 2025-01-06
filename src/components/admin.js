const admin = require("firebase-admin");
const serviceAccount = require("./path/to/your-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
module.exports = auth;
