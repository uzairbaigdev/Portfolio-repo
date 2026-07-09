import { auth } from "./firebaseConfig.js";

/**
 * Protects private pages (like chat.html).
 * If a user is NOT logged in, it securely boots them back to the landing/login page.
 */
export function requireAuth() {
  auth.authStateReady().then(() => {
    if (!auth.currentUser) {
      console.log("Guard: Access denied. Redirecting guest to login...");
      window.location.replace("index.html"); // or "login.html" depending on your landing page
    } else {
      console.log("Guard: Access granted for UID:", auth.currentUser.uid);
    }
  });
}

/**
 * Protects guest-only pages (like login.html and signup.html).
 * If a user is ALREADY logged in, it redirects them straight to the main app interface.
 */
export function requireGuest() {
  auth.authStateReady().then(() => {
    if (auth.currentUser) {
      console.log("Guard: Active session found. Redirecting user to chat...");
      window.location.replace("chat.html");
    } else {
      console.log("Guard: No active session. Safe to stay on public page.");
    }
  });
}