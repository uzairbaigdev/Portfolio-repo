import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword,signOut,signInWithEmailAndPassword,GoogleAuthProvider,
signInWithPopup,getAdditionalUserInfo,onAuthStateChanged,sendPasswordResetEmail  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc,query, where, getDocs, onSnapshot,or,and,serverTimestamp,
doc, deleteDoc,updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBoWu5RgFA_s6txm6V-8rRdQPVYet04eI",
  authDomain: "chatapp-project-2c0e0.firebaseapp.com",
  projectId: "chatapp-project-2c0e0",
  storageBucket: "chatapp-project-2c0e0.firebasestorage.app",
  messagingSenderId: "889961453105",
  appId: "1:889961453105:web:30c4e9786300c4b6cda710",
  measurementId: "G-8550HZ5E1D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, createUserWithEmailAndPassword, collection, addDoc,query, where, getDocs , onSnapshot,or
, signOut,signInWithEmailAndPassword ,getAuth ,and,serverTimestamp,provider, signInWithPopup,GoogleAuthProvider,
getAdditionalUserInfo,onAuthStateChanged,sendPasswordResetEmail,doc, deleteDoc,updateDoc };