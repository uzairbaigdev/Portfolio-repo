import { auth, onAuthStateChanged } from "./firebaseConfig.js";

/**
 * Combined function for BOTH login and signup pages.
 * Checks if a user is already logged in. If they are, 
 * it redirects them straight to the todo page.
 */
export function checkGuestStatus() {
  auth.authStateReady().then(() => {
    if (auth.currentUser) {
      window.location.replace("./todo.html");
    }
  });
}

/**
 * Protects the private todo page (todo.html).
 * If a logged-out user tries to access it, they are sent back to the login page.
 */
export function requireAuth() {
  auth.authStateReady().then(() => {
    if (!auth.currentUser) {
      window.location.replace("./login.html");
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