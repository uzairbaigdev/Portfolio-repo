import { getAuth, signInWithEmailAndPassword, auth, signInWithPopup, GoogleAuthProvider, provider, collection, addDoc, db, getAdditionalUserInfo } from "./firebaseConfig.js"; // 👈 Added getAdditionalUserInfo here
import { checkGuestStatus } from "./auth-guard.js";

const emailInp = document.getElementById("email-inp");
const passwordInp = document.getElementById("password-inp");
const loginBtn = document.getElementById("login-btn");
const googlebtn = document.getElementById("google-btn");

//errors
const accountError = document.getElementById("account-error");
const fillInputsError = document.getElementById("fill-inputs-error");
const emailInpError = document.getElementById("email-inp-error");
const passwordInpError = document.getElementById("password-inp-error");

// Checks if the user is already logged in on page load, redirects them if they are
checkGuestStatus();

// Independent function to record Google Sign-In users to database
const adduser = async (loggedInUser) => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      email: loggedInUser.email,
      uid: loggedInUser.uid,
      createdAt: new Date(),
    });

    console.log("Document written with ID:", docRef.id);

    const userData = {
      docId: docRef.id,
    };

    localStorage.setItem("userData", JSON.stringify(userData));
    return docRef;
  } catch (error) {
    console.error("Firestore Error inside login context =>", error);
    throw error;
  }
};

//working on user login
const userlogin = () => {
  //checking validation
  if(emailInp.value.length < 1 || passwordInp.value.length < 1 ) {
    emailInpError.style.display = "none";
    accountError.style.display = "none";
    passwordInpError.style.display = "none";
    fillInputsError.style.display = "block";
    return;
  }
  else if (!emailInp.checkValidity()) {
    fillInputsError.style.display = "none";
    accountError.style.display = "none";
    passwordInpError.style.display = "none";
    emailInpError.style.display = "block";
    return;
  }
  else if (passwordInp.value.length < 8) {
    fillInputsError.style.display = "none";
    emailInpError.style.display = "none";
    accountError.style.display = "none";
    passwordInpError.style.display = "block";
    return;
  }

  signInWithEmailAndPassword(auth, emailInp.value, passwordInp.value)
    .then((userCredential) => {
      fillInputsError.style.display = "none";
      emailInpError.style.display = "none";
      passwordInpError.style.display = "none";
      accountError.style.display = "none";

      const user = userCredential.user;
      console.log(user);
      window.location.replace("./todo.html");
    })
    .catch((error) => {
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        fillInputsError.style.display = "none";
        emailInpError.style.display = "none";
        passwordInpError.style.display = "none";  
        accountError.style.display = "block";
      }
    });
};

loginBtn.addEventListener("click", () => userlogin());

//working on google sign in
const googleSignIn = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Google login success:", user);
      
      // FIXED: Check if the user profile is brand new to prevent data duplicates
      const details = getAdditionalUserInfo(result);
      
      if (details.isNewUser) {
        // Save to database ONLY if they are completely new to your app
        adduser(user).then(() => {
          window.location.replace("./todo.html");
        });
      } else {
        // Existing user simply signs in and moves onto dashboard
        window.location.replace("./todo.html");
      }

    }).catch((error) => {
      console.error("Google Auth Login Error:", error);
    });
};

googlebtn.addEventListener("click", () => googleSignIn());