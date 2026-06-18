import { getAuth, createUserWithEmailAndPassword, auth, collection,
addDoc, db, GoogleAuthProvider, provider, signInWithPopup,getAdditionalUserInfo } from "./firebaseConfig.js";
import { redirectIfLoggedIn } from "./auth-guard.js";

// getting elements
const emailinp = document.getElementById("email-inp");
const passwordinp = document.getElementById("password-inp");
const resgister = document.getElementById("sign-up-btn");
const accountsuccess = document.getElementById("box-button-success");
const Loading = document.getElementById("box-btn-load");
const googleBtn = document.getElementById("google-btn");

//error 
const FillInputsError = document.getElementById("fill-inputs-error");
const emailInpError = document.getElementById("email-error");
const passwordInpError = document.getElementById("password-error");
const emailInUseError = document.getElementById("email-in-use");

let user = null; // Global user reference

redirectIfLoggedIn();

// Helper function to quickly reset UI feedback
const resetUI = () => {
  FillInputsError.style.display = "none"; 
  emailInpError.style.display = "none"; 
  passwordInpError.style.display = "none";
  emailInUseError.style.display = "none";
  accountsuccess.style.display = "none";
};

// registration function
const registration = async() => {
  resetUI();
  Loading.style.display = "block"; 

  //checking validation
  if (emailinp.value.length < 1 || passwordinp.value.length < 1) {
    Loading.style.display = "none";
    FillInputsError.style.display = "block";
    return;
  }
  else if (!emailinp.checkValidity()) { 
    Loading.style.display = "none";
    emailInpError.style.display = "block";
    return;
  }
  else if (passwordinp.value.length < 8) {
    Loading.style.display = "none";
    passwordInpError.style.display = "block";
    return; 
  }

  // working on registration
  createUserWithEmailAndPassword(auth, emailinp.value, passwordinp.value)
    .then((userCredential) => {
      // Set the global user variable
      user = userCredential.user;
      console.log("Email signup success:", user);
      
      adduser().then(()=> {
        Loading.style.display = "none";
        accountsuccess.style.display = "block";
        emailinp.value = "";
        passwordinp.value = "";
        window.location.replace("./todo.html");
      });
    })
    .catch((error) => {
      Loading.style.display = "none";
      if (error.code === "auth/email-already-in-use") {
        emailInUseError.style.display = "block";
      } else {
        console.error("Email signup error:", error);
      }
    });
};

resgister.addEventListener("click", () => registration());

//add user data to firestore after registration
const adduser = async () => {
  try {
    // if (!user) throw new Error("No authenticated user found to save to database.");

    const docRef = await addDoc(collection(db, "users"), {
      email: user.email,
      uid: user.uid,
      createdAt: new Date(),
    });

    console.log("Document written with ID:", docRef.id);

    const userData = {
      docId: docRef.id,
    };

    localStorage.setItem("userData", JSON.stringify(userData));
    return docRef;
  } catch (error) {
    console.error("Firestore Error =>", error);
    throw error;
  }
};

// working on google signup
const googleSignup = () => {
  resetUI();
  Loading.style.display = "block"; 

  signInWithPopup(auth, provider)
    .then((result) => {
      user = result.user; 
      console.log("Google signup success:", user);

      // Check if this is the very first time this user has logged into your app
      const details = getAdditionalUserInfo(result);
      
      if (details.isNewUser) {
        // Only create a Firestore document if they are brand new!
        adduser().then(() => {
          Loading.style.display = "none";
          accountsuccess.style.display = "block";
          window.location.replace("./todo.html");
        });
      } else {
        // They already had an account, just redirect them quietly without duplicating data
        Loading.style.display = "none";
        window.location.replace("./todo.html");
      }
    })
    .catch((error) => {
      Loading.style.display = "none";
      console.error("Google Auth Error:", error);
      
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Popup closed before completing sign-in.");
      }
    });
};

googleBtn.addEventListener("click",()=> googleSignup());