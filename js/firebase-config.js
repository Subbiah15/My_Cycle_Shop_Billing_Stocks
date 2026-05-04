/* =============================================
 * FIREBASE CONFIGURATION
 * =============================================
 */

const firebaseConfig = {
    apiKey: "AIzaSyB1oUQi8RtiOwcD5PDmjv3aukmFAXdbe3k",
    authDomain: "cycle-shop-billing.firebaseapp.com",
    projectId: "cycle-shop-billing",
    databaseURL: "https://cycle-shop-billing-default-rtdb.firebaseio.com",
    storageBucket: "cycle-shop-billing.firebasestorage.app",
    messagingSenderId: "290742171729",
    appId: "1:290742171729:web:c1097f58588e98e77fe070",
    measurementId: "G-DFBX1QBPT9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore, Storage & Realtime Database
window.db = firebase.firestore();
window.storage = firebase.storage();
window.rtdb = firebase.database();

// ENABLE OFFLINE PERSISTENCE
// For Firestore
db.enablePersistence()
  .catch((err) => {
      console.warn("Firestore Persistence failed:", err.code);
  });

// For Realtime Database (Very important for your offline requirement)
firebase.database().setPersistenceEnabled(true);
