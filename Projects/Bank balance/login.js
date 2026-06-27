// importing
import { 
  auth, 
  doc, 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,     
  provider,               
  signInWithRedirect,     
  getRedirectResult,       
  getAdditionalUserInfo,  
  db,                     
  collection,             
  addDoc                  
} from "./firebaseConfig.js";
import { redirectIfAuthenticated } from "./authGuard.js";

// checking user is exist or not
redirectIfAuthenticated();

// getting elements
const emailinp = document.getElementById("email");
const passwordinp = document.getElementById("password");
const loginbtn = document.getElementById("loginbtn");
const googleBtn = document.getElementById("googlebtn"); 

// getting errors
const emptyError = document.getElementById("err-empty");
const emailError = document.getElementById("err-invalid");
const passwordError = document.getElementById("err-length");
const notFoundError = document.getElementById("err-notfound");

const loadingLayer = document.getElementById("loading-layer");

// Helper function to reset error messages before validation
const resetErrors = () => {
  emptyError.style.display = "none";
  emailError.style.display = "none";
  passwordError.style.display = "none";
  notFoundError.style.display = "none";
};

// Check if user is returning from Google Redirect Sign-In
const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      loadingLayer.classList.add("is-active"); 
      const user = result.user;
      
      // Check if the user signed up via Google for the very first time here
      const details = getAdditionalUserInfo(result);
      if (details.isNewUser) {
        await addUserCredential(user.uid, user.email);
      } else {
        // Returning user: Just store their UID so the dashboard can load their balance
        window.localStorage.setItem("userUID", user.uid);
      }
      
      loadingLayer.classList.remove("is-active");
      window.location.replace("./Bank balance.html");
    }
  } catch (error) {
    loadingLayer.classList.remove("is-active");
    console.error("Redirect Result Error:", error.code, error.message);
  }
};

handleRedirectResult();

// Helper function to add user credentials to database (same as signup)
const addUserCredential = async (userUID, useremail) => {
  try {
    const docRef = await addDoc(collection(db, "Users"), {
      email: useremail,
      UID: userUID,
      createdAt: new Date()
    });
    console.log("Document written with ID: ", docRef.id);
    window.localStorage.setItem("userUID", userUID);    
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error; 
  }
};

// working on user log in (Email/Password)
const userLogIn = () => {
  resetErrors();
  
  if (emailinp.value === "" || passwordinp.value === "") {
    emptyError.style.display = "block";
    return;
  }
  if (!emailinp.checkValidity()) {
    emailError.style.display = "block";
    return;
  }
  if (passwordinp.value.length < 8) {
    passwordError.style.display = "block";
    return;
  }

  loadingLayer.classList.add("is-active");
  
  signInWithEmailAndPassword(auth, emailinp.value, passwordinp.value)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log(user);
      
      window.localStorage.setItem("userUID", user.uid);
      loadingLayer.classList.remove("is-active");
      window.location.replace("./Bank balance.html");
    })
    .catch((error) => {
      loadingLayer.classList.remove("is-active");
      const errorCode = error.code;
      console.error("Login failed:", errorCode, error.message);
      
      if (errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password" || errorCode === "auth/invalid-credential") {
        notFoundError.style.display = "block";
      }
    });
};

// working with google login
const GoogleLogin = async () => {
  resetErrors();
  loadingLayer.classList.add("is-active"); 
  try {
    // Triggers redirect instead of a popup window
    await signInWithRedirect(auth, provider);
  } catch (error) {
    loadingLayer.classList.remove("is-active");
    console.error("Google Auth Error:", error.code, error.message);
  }
};

loginbtn.addEventListener("click", () => userLogIn());
googleBtn.addEventListener("click", () => GoogleLogin());