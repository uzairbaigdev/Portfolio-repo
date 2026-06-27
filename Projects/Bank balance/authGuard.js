import { getAuth, onAuthStateChanged,auth } from "./firebaseConfig.js";

export function redirectIfAuthenticated() {
  try {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe(); // Stop listening immediately
      
      // Only redirect if they are already logged in AND not currently trying to authenticate
      if (user && !window.location.search.includes('apiKey')) {
        window.location.replace("./Bank balance.html");
      }
    });
  } catch (error) {
    console.error("Auth Guard Error:", error);
  }
}

// Rename this one to use on your private dashboard pages (like Bank balance.html)
// export function requireAuth() {
//   try {
//     auth.onAuthStateChanged((user) => {
//       if (!user) {
//         // If NO user is found, kick them back to login
//         window.location.replace("./login.html");
//       }
//     });
//   } catch (error) {
//     console.error("Auth Guard Error:", error);
//   }
// }


export function requireGuest() {
  try {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe(); 
      if (!user) {
        window.location.replace("./index.html");
      } 
    });
  } catch (error) {
    console.log(error);
  }
}