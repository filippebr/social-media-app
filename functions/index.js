const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp({
  credential: admin.credential.cert(require('./keys/admin.json'))
});

const firebaseConfig = {
  apiKey: "AIzaSyCyXZu48T_WftI5Mx6m5hXle74GhparFSA",
  authDomain: "socialapp-cbc2c.firebaseapp.com",
  databaseURL: "https://socialapp-cbc2c.firebaseio.com",
  projectId: "socialapp-cbc2c",
  storageBucket: "socialapp-cbc2c.appspot.com",
  messagingSenderId: "225222865630",
  appId: "1:225222865630:web:aa481efa0347ae0e7b884f",
  measurementId: "G-JM21J39LB0"
};

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

app.get('/screams', (require, response) => {
  admin
  .firestore()
  .collection('screams')
  .orderBy('createdAt', 'desc')
  .get()
  .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({ 
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });

      return response.json(screams);
  })
  .catch((err) => console.error(err));
});

app.post('/scream', (request, response) => {

  const newScream = {
    body: request.body.body,
    userHandle: request.body.userHandle,
    createdAt: new Date().toISOString()
  };

  admin.firestore()
      .collection('screams')
      .add(newScream)
      .then(doc => {
        response.json({ message: `document ${doc.id} created successfully` });
      })
      .catch(err => {
        response.status(500).json({ error: 'something went wrong'});
        console.error(err);
      });
});

// Signup route
app.post('/signup', (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
  }

  // TODO validade data
  firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
      return response
        .status(201)
        .json({ message: `user ${data.user.uid} signed up successfully.` });
    })
    .catch(err => {
      console.error(err);
      return response.status(500).json({ error: err.code });
    })
})

exports.api = functions.region('us-central1').https.onRequest(app);