import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";

import {getFirestore, collection, addDoc, doc, onSnapshot, query, where, getDocs,orderBy,deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9g2cmq0mQx517NBcQMLenbTwtsg9l8u0",
  authDomain: "ecommerce-web-1-ae670.firebaseapp.com",
  projectId: "ecommerce-web-1-ae670",
  storageBucket: "ecommerce-web-1-ae670.firebasestorage.app",
  messagingSenderId: "266350906778",
  appId: "1:266350906778:web:342c543c9d47da7b62fe23",
  measurementId: "G-4LY6ZBP9DF"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db, collection, addDoc, doc, onSnapshot, query, where, getDocs,orderBy,deleteDoc, updateDoc };