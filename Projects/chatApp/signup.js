//importing 
import {db, auth, createUserWithEmailAndPassword, collection, addDoc,provider, signInWithPopup,
GoogleAuthProvider,getAdditionalUserInfo  } from "./firebaseConfig.js";
import { requireGuest } from "./authGuard.js";

requireGuest();

//getting element 
const emailinp = document.getElementById("email");
const passwordinp = document.getElementById("password");
const nameinp = document.getElementById("name");
const signupbtn = document.getElementById("signupbtn");
//errors
const errorEmpty = document.getElementById("error-empty");
const errorNameInvalid = document.getElementById("error-name-invalid");
const errorEmailInvalid = document.getElementById("error-email-invalid");
const errorPasswordLength = document.getElementById("error-password-length");
const errorEmailExists = document.getElementById("error-email-exists");
const googleBtn = document.getElementById("googleBtn");

//working on reset UI 
const resetUI = ()=> {
    errorEmpty.style.display = "none";
    errorNameInvalid.style.display = "none";
    errorEmailInvalid.style.display = "none";
    errorPasswordLength.style.display = "none";
    errorEmailExists.style.display = "none";
}


//working on user signup
const userSignUp = async () => {
    try {
//validation        
resetUI();
if (nameinp.value.trim() === "" || emailinp.value.trim() === "" || passwordinp.value === "") {
            errorEmpty.style.display = "block";
            return;
        }
        
        // Check name length correctly using .length
        if (nameinp.value.trim().length < 3) {
            errorNameInvalid.style.display = "block";
            return;
        }
        
        // Check email validity on the element itself
        if (!emailinp.checkValidity()) {
            errorEmailInvalid.style.display = "block";
            return;
        }
        
        // Check password length correctly using .length
        if (passwordinp.value.length < 8) {
            errorPasswordLength.style.display = "block";
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, emailinp.value, passwordinp.value);
        const user = userCredential.user;
        console.log("User created:", user);

        await addUserToDatabase(user.email, user.uid);
        window.location.replace("chat.html");

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            errorEmailExists.style.display = "block";
        }
        console.error("Error during signup flow:", error);
    }
};

signupbtn.addEventListener("click", () => userSignUp());

//working on adding user credentials to database 
const addUserToDatabase = async (useremail, useruid) => {
    try {
        const docRef = await addDoc(collection(db, "Users"), {
            name: nameinp.value,
            email: useremail,
            uid: useruid
        });
        console.log("Document written with ID: ", docRef.id);
        window.localStorage.setItem("useruid",useruid);

    } catch (error) {
        console.error("Error adding document: ", error);
        throw error; // Re-throw the error so userSignUp knows something went wrong
    }
};

//working on google signup
const googleSignup = async () => {
    try {
        resetUI();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
// Check if the user is completely new to app
        const details = getAdditionalUserInfo(result);        
        if (details.isNewUser) {
            console.log("New Google user detected. Reusing database function...");
            if (nameinp.value.trim() === "") {
                nameinp.value = user.displayName || "Google User";
            }
//adding new user credentials to database 
        await addUserToDatabase(user.email, user.uid);
        } else {
            console.log("Existing Google user logged in.");
            window.localStorage.setItem("useruid", user.uid);
        }
    window.location.replace("chat.html");
    } catch (error) {
        console.error("Error during Google Sign-In:", error);
    }
};
googleBtn.addEventListener("click", () => googleSignup());  