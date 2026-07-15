// Import the required Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword,GoogleAuthProvider,signInWithPopup
,getAdditionalUserInfo,signInWithEmailAndPassword, onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc,serverTimestamp, 
query, where, getDocs, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCe7Mk6_0pVMXb5-MwX9pG8B3HTIXq9o-8",
  authDomain: "maintain-iq-86879.firebaseapp.com",
  projectId: "maintain-iq-86879",
  storageBucket: "maintain-iq-86879.firebasestorage.app",
  messagingSenderId: "190347685650",
  appId: "1:190347685650:web:ce3d6e6714b637d1ae0dcb",
  measurementId: "G-K11ET5M96Q"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export {auth,db,getAuth, createUserWithEmailAndPassword,collection, addDoc,serverTimestamp,
provider,signInWithPopup,getAdditionalUserInfo,signInWithEmailAndPassword,onAuthStateChanged,query, where, getDocs, doc, updateDoc
,onSnapshot,signOut };