import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
import {
  child,
  get,
  getDatabase,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxcoxFWo--olwwvxqZeJXofY7uSjvGAs4",
  authDomain: "blogpugna.firebaseapp.com",
  databaseURL: "https://blogpugna-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "blogpugna",
  storageBucket: "blogpugna.firebasestorage.app",
  messagingSenderId: "129907862361",
  appId: "1:129907862361:web:99ba7c1a54aced166c7a48",
  measurementId: "G-NML245WM09",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

window.blocpugnaFirebase = {
  app,
  analytics: null,
  database,
  child,
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
};

isSupported().then((supported) => {
  if (supported) window.blocpugnaFirebase.analytics = getAnalytics(app);
});

window.dispatchEvent(new Event("blocpugna-firebase-ready"));
