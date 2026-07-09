import { auth, signInWithEmailAndPassword ,provider, signInWithPopup,
GoogleAuthProvider,getAdditionalUserInfo,addDoc,collection,db,sendPasswordResetEmail } from "./firebaseConfig.js";
import { requireGuest } from "./authGuard.js";

requireGuest();

const emailinp = document.getElementById("email");
const passwordinp = document.getElementById("password");
const loginbtn = document.getElementById("loginbtn");
const googleBtn = document.getElementById("googleBtn");
const forgotbtn = document.getElementById("forgotbtn");

// UI elements for messages
const errorEmpty = document.getElementById("error-empty");
const errorInvalidCredentials = document.getElementById("error-invalid-credentials");
const successMessage = document.getElementById("success-message");

//working on login 
const userLogin = async () => {
//Remove the old UID from localStorage right away when they try to log in
    window.localStorage.removeItem("useruid");
// Hide previous errors on new attempt
    errorEmpty.style.display = "none";
    errorInvalidCredentials.style.display = "none";
    successMessage.style.display = "none";

    // Simple check for empty fields
    if (emailinp.value.trim() === "" || passwordinp.value === "") {
        errorEmpty.style.display = "block";
        return;
    }

    signInWithEmailAndPassword(auth, emailinp.value, passwordinp.value)
        .then((userCredential) => {
            const user = userCredential.user;
            //Save the new logged-in user's UID to localStorage
            window.localStorage.setItem("useruid", user.uid);
            console.log("User logged in successfully:", user.uid);
            //Redirect to the chat page
            window.location.replace("chat.html");
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login failed:", errorCode, errorMessage);
            
            // Show the match error for any credential issue
            errorInvalidCredentials.style.display = "block";
        });
}

loginbtn.addEventListener("click", () => userLogin());

//working on google google login
const googleLogin = async () => {
    try {
    errorEmpty.style.display = "none";
    errorInvalidCredentials.style.display = "none";    
    successMessage.style.display = "none";
        // Sign in using popup
        const result = await signInWithPopup(auth, provider);
        const user = result.user;        
        // Use Firebase built-in helper to check if this is a newly registered user
        const details = getAdditionalUserInfo(result);
        
        if (details.isNewUser) {
            console.log("New Google user detected. Adding to database...");
            // Pass the Google display name as fallback if the name field is empty
            const displayName = user.displayName || "Google User";
            
//pushing user credentials to database 
            await addDoc(collection(db, "Users"), {
                name: displayName,
                email: user.email,
                uid: user.uid
            });
            window.localStorage.setItem("useruid", user.uid);
        } else {
            console.log("Existing Google user logged in.");
            window.localStorage.setItem("useruid", user.uid);
        }

        // Redirect both new and old users to the chat page
        window.location.replace("chat.html");

    } catch (error) {
        console.error("Error during Google Sign-In:", error);
        
        // Handle specific account-exists errors if necessary
        if (error.code === 'auth/account-exists-with-different-credential') {
            alert("An account already exists with the same email address but different sign-in credentials.");
        }
    }
};
googleBtn.addEventListener("click", () => googleLogin());

// working on forgot password
const forgotPassword = async () => {    
const emailValue = emailinp.value.trim();

// Reset previous screen messages
errorEmpty.style.display = "none";
errorInvalidCredentials.style.display = "none";
if (successMessage) successMessage.style.display = "none";

if (emailValue === "") {
    errorEmpty.innerText = "Please enter your work email first.";
    errorEmpty.style.display = "block";
    return;
}
sendPasswordResetEmail(auth, emailValue)
.then(() => {
    successMessage.innerText = "A password reset link has been sent to your email!";
    successMessage.style.display = "block";
            
// Clear inputs
    emailinp.value = "";
    passwordinp.value = "";
        })
        .catch((error) => {
            const errorCode = error.code;
            console.error("Error sending reset email:", errorCode, error.message);
            
            // Route errors gracefully straight to your error labels
            if (errorCode === "auth/invalid-email") {
                errorInvalidCredentials.innerText = "Please enter a valid email address structure.";
            } else if (errorCode === "auth/user-not-found") {
                errorInvalidCredentials.innerText = "No account found matching this email.";
            } else {
                errorInvalidCredentials.innerText = "Unable to process request. Try again later.";
            }
            errorInvalidCredentials.style.display = "block";
        });
};

forgotbtn.addEventListener("click", () => forgotPassword());