import { auth, onAuthStateChanged } from "./firebaseConfig.js";



export function requireAuth() {
    onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("./todo.html");
    // ...
  } 
});
}

export function redirectIfLoggedIn() {
  auth.authStateReady().then(() => {
    if (auth.currentUser) {
      window.location.replace("./todo.html");
    }
  });
}

export function requireGuest() {
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("./index.html");
  }
});
}