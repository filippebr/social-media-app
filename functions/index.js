const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login } = require('./handlers/users');

// Scream routes
app.get('/screams', getAllScreams);
// Post one scream
app.post('/scream', FBAuth, postOneScream);

// Signup route
app.post('/signup', signup);
// Login route
app.post('/login', login);


exports.api = functions.region('us-central1').https.onRequest(app);