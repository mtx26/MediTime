importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBmad_HQKx0oyrhg2rEXn0Nlwgn6_rCqtc",
  authDomain: "meditime-462409.firebaseapp.com",
  projectId: "meditime-462409",
  storageBucket: "meditime-462409.firebasestorage.app",
  messagingSenderId: "259799675814",
  appId: "1:259799675814:web:9360d7a451afd8bef4d567",
  measurementId: "G-XCSFJJZFHC"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// Keep in mind that FCM will still show notification messages automatically 
// and you should use data messages for custom notifications.
// For more info see: 
// https://firebase.google.com/docs/cloud-messaging/concept-options