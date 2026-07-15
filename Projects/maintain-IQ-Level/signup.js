import {
auth, db, collection, addDoc, serverTimestamp, provider, signInWithPopup, getAdditionalUserInfo,
createUserWithEmailAndPassword,query, where, getDocs} from "./firebaseConfig.js";

// getting DOM elements 
const nameinp = document.getElementById("name");
const emailinp = document.getElementById("email");
const passwordinp = document.getElementById("password");
const signupbtn = document.getElementById("signupbtn");
const googlebtn = document.getElementById("googlebtn");

// DOM elements for Errors Container and HTML Error Tags
const errorsContainer = document.getElementById("errorsContainer");
const errEmptyFields = document.getElementById("err-empty-fields");
const errInvalidName = document.getElementById("err-invalid-name");
const errEmailPattern = document.getElementById("err-email-pattern");
const errEmailTaken = document.getElementById("err-email-taken");
const errPasswordLen = document.getElementById("err-password-len");

// Function to reset all active UI error classes
const clearErrorsUI = () => {
  errorsContainer.classList.remove("show-container");
  errEmptyFields.classList.remove("show-error");
  errInvalidName.classList.remove("show-error");
  errEmailPattern.classList.remove("show-error");
  errEmailTaken.classList.remove("show-error");
  errPasswordLen.classList.remove("show-error");
};

// Fetch and store the existing user's Document ID
const fetchAndStoreDocId = async (uid) => {
  try {
    const q = query(collection(db, "Users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      window.localStorage.setItem("DocID", docId);
      console.log("Found existing DocID and saved to storage:", docId);
      return docId;
    } else {
      console.warn("No user document found for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user document ID: ", error);
    throw error;
  }
};

// working on adding user data to database 
const addUserDataToDatabase = async (name, email,UID) => {
  try {
    const docRef = await addDoc(collection(db, "Users"), {
      name: name,
      email: email,
      Role:null,
      uid:UID,
      createdAt: serverTimestamp()
    });
    console.log("Document written with ID: ", docRef.id);
    window.localStorage.setItem("DocID",docRef.id);
  } catch (error) {
    console.error("Firestore Write Error: ", error);
  }
};

// working on creating user account via Email/Password
const signupUser = () => {
  // Clear any existing errors on the UI before evaluating
  clearErrorsUI();

  const nameValue = nameinp.value.trim();
  const emailValue = emailinp.value.trim();
  const passwordValue = passwordinp.value;

  let hasError = false;

  // 1. Check if any fields are completely empty
  if (!nameValue || !emailValue || !passwordValue) {
    errEmptyFields.classList.add("show-error");
    hasError = true;
  }

  // 2. Validate full name structure (must contain letters, at least 2 characters)
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  if (nameValue && !nameRegex.test(nameValue)) {
    errInvalidName.classList.add("show-error");
    hasError = true;
  }

  // 3. Validate corporate email address pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailValue && !emailRegex.test(emailValue)) {
    errEmailPattern.classList.add("show-error");
    hasError = true;
  }

  // 4. Validate password length (must be at least 8 characters)
  if (passwordValue && passwordValue.length < 8) {
    errPasswordLen.classList.add("show-error");
    hasError = true;
  }

  // If any frontend validations fail, display the main container and halt execution
  if (hasError) {
    errorsContainer.classList.add("show-container");
    return;
  }

  // If validation passes, proceed to Firebase Authentication
  createUserWithEmailAndPassword(auth, emailValue, passwordValue)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log(user);
      addUserDataToDatabase(nameValue, emailValue,user.uid).then(()=> {
        window.localStorage.setItem("CurrentUID",user.uid);
        window.location.replace("continue.html")
      })
      
      // Clear fields upon successful registration
      nameinp.value = "";
      emailinp.value = "";
      passwordinp.value = "";
      clearErrorsUI();
    })
    .catch((error) => {
      console.error("Email signup error: ", error.code, error.message);
      
      // 5. Catch Firebase "auth/email-already-in-use" error state
      if (error.code === "auth/email-already-in-use") {
        errorsContainer.classList.add("show-container");
        errEmailTaken.classList.add("show-error");
      }
    });
};

signupbtn.addEventListener("click", () => signupUser());

// working on continue with google 
const googleAuthenticate = () => {
  clearErrorsUI();
  
  signInWithPopup(auth, provider)
    .then(async(result) => {
      const user = result.user;
      const details = getAdditionalUserInfo(result);
      
      // Save the UID immediately so it's available for both new and returning users
      window.localStorage.setItem("CurrentUID", user.uid);
      if (details && details.isNewUser) {
        console.log("New Google user detected. Adding to database...");
        addUserDataToDatabase(user.displayName || "Google User", user.email,user.uid).then(() => {
          window.location.replace("continue.html");
        });
      } else {
        console.log("Existing Google user logged in. Database entry skipped.");
        await fetchAndStoreDocId(user.uid);
        window.location.replace("continue.html");
      }
    })
    .catch((error) => {
      console.error("Google Auth Error: ", error.message);
    });
};

googlebtn.addEventListener("click", () => googleAuthenticate());