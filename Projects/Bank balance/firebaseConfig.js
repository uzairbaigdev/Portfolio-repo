import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore,collection, addDoc, doc, getDocs,query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword ,onAuthStateChanged,signOut,signInWithEmailAndPassword,
GoogleAuthProvider,signInWithPopup,getAdditionalUserInfo, signInWithRedirect, 
getRedirectResult} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  apiKey: "AIzaSyCYs8JYsjt-bW5RzO51UiXO0wq-mBEWozI",
  authDomain: "bank-balance-project.firebaseapp.com",
  projectId: "bank-balance-project",
  storageBucket: "bank-balance-project.firebasestorage.app",
  messagingSenderId: "207462125467",
  appId: "1:207462125467:web:59e2ae408c1f2309575b3e",
  measurementId: "G-J235MHEVKH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { db,collection, addDoc, doc, getDocs,auth,getAuth, createUserWithEmailAndPassword,onAuthStateChanged
,signOut,signInWithEmailAndPassword,GoogleAuthProvider,provider,signInWithPopup,getAdditionalUserInfo,query, where
,signInWithRedirect,getRedirectResult};
