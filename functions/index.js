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

const db = admin.firestore();

app.get('/screams', (require, response) => {
  db
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

  db
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

const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; 
  if (email.match(regEx)) return true;
  else return false;
}

const isEmpty = (string) => {
  if(string.trim() === '') return true;
  else return false; 
}

// Signup route
app.post('/signup', (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
  };

  let errors = {};

  if(isEmpty(newUser.email)) {
    errors.email = 'Must not be empty';
  } else if(!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address';
  }

  if(isEmpty(newUser.password)) errors.password = 'Must not be empty';
  if(newUser.password !== newUser.confirmPassword) 
    errors.confirmPassword = 'Passwords must match';
  if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

  if(Object.keys(errors).length > 0) return response.status(400).json(errors);

  // TODO validade data
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if ( doc.exists ) {
        return response.status(400).json({ handle: 'this handle is already taken' });
      } else {
        return firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return response.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if ( err.code === 'auth/email-already-in-use' ) {
        return response.status(400).json({ email: 'Email is already in use' });
      } else {
        return response.status(500).json({ error: err.code });
      }      
    })
});

app.post('/login', (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password
  };

  let errors = {};

  if(isEmpty(user.email)) errors.email = 'Must not be empty';
  if(isEmpty(user.password)) errors.password = 'Must not be empty';

  if(Object.keys(errors).length > 0) return response.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return response.json({token})
    })
    .catch(err => {
      console.error(err);
      if(err.code === 'auth/wrong-password') {
        return response.status(403).json({ general: 'Wrong Credentials, please try again'});
      } else return response.status(500).json({error: err.code});
    });
});

exports.api = functions.region('us-central1').https.onRequest(app);