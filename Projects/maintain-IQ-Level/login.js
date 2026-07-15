import { auth, signInWithEmailAndPassword,provider,getAdditionalUserInfo,signInWithPopup,db,
collection, addDoc,serverTimestamp,query, where, getDocs} from "./firebaseConfig.js";

// getting DOM elements 
const emailinp = document.getElementById("email");
const passwordinp = document.getElementById("password");
const loginbtn = document.getElementById("loginbtn");
const googlebtn = document.getElementById("googlebtn");

// getting DOM elements for errors UI
const errorsContainer = document.getElementById("errorsContainer");
const errEmptyFields = document.getElementById("err-empty-fields");
const errEmailPattern = document.getElementById("err-email-pattern");
const errBadCredentials = document.getElementById("err-bad-credentials");
const errAccountNotFound = document.getElementById("err-account-not-found");
const errGeneric = document.getElementById("err-generic");
const genericMsg = document.getElementById("generic-msg");

// helper function to hide all active error layers
const resetErrors = () => {
  if (errorsContainer) errorsContainer.classList.remove("show-container");
  if (errEmptyFields) errEmptyFields.classList.remove("show-error");
  if (errEmailPattern) errEmailPattern.classList.remove("show-error");
  if (errBadCredentials) errBadCredentials.classList.remove("show-error");
  if (errAccountNotFound) errAccountNotFound.classList.remove("show-error");
  if (errGeneric) errGeneric.classList.remove("show-error");
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

//working adding user data to database 
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
    throw error;
  }
};


// working on user login 
const userLogin = () => {
  resetErrors();

  const email = emailinp.value.trim();
  const password = passwordinp.value;

  // Validate Client Side: Empty Fields
  if (!email || !password) {
    if (errorsContainer && errEmptyFields) {
      errorsContainer.classList.add("show-container");
      errEmptyFields.classList.add("show-error");
    }
    return;
  }

  // Validate Client Side: Simple Email Pattern Lookahead
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (errorsContainer && errEmailPattern) {
      errorsContainer.classList.add("show-container");
      errEmailPattern.classList.add("show-error");
    }
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      console.log("Logged in user:", user);
      emailinp.value = "";
      passwordinp.value = "";
      window.localStorage.setItem("CurrentUID",user.uid);
      await fetchAndStoreDocId(user.uid);
      window.location.replace("continue.html");
    })
    .catch((error) => {
      console.error("Firebase Authentication Error:", error.code, error.message);
      
      if (errorsContainer) {
        errorsContainer.classList.add("show-container");
        
        // Map exact Firebase error codes to matching HTML error components
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
          if (errBadCredentials) errBadCredentials.classList.add("show-error");
        } else if (error.code === "auth/user-not-found") {
          if (errAccountNotFound) errAccountNotFound.classList.add("show-error");
        } else if (error.code === "auth/invalid-email") {
          if (errEmailPattern) errEmailPattern.classList.add("show-error");
        } else {
          if (genericMsg) genericMsg.textContent = error.message;
          if (errGeneric) errGeneric.classList.add("show-error");
        }
      }
    });
};

loginbtn.addEventListener("click", () => userLogin());

//working on Google signup/signin
const googleAuthenticate = () => {  
  resetErrors();

  signInWithPopup(auth, provider)
    .then(async(result) => {
      const user = result.user;
      
      // Extract additional user information from the result
      const details = getAdditionalUserInfo(result);
      window.localStorage.setItem("CurrentUID", user.uid);
      
      // Check if the user is logging in for the very first time
      if (details && details.isNewUser) {
        console.log("New Google user detected. Adding to database...");
        addUserDataToDatabase(user.displayName || "Google User", user.email,user.uid).then(()=> {
          window.location.replace("continue.html");
        })
      } else {
        console.log("Existing Google user logged in. Database entry skipped.");
        await fetchAndStoreDocId(user.uid);
        window.location.replace("continue.html");
      }
    })
    .catch((error) => {
      console.error("Google Auth Error: ", error.message);
      
      if (errorsContainer && errGeneric) {
        errorsContainer.classList.add("show-container");
        if (genericMsg) genericMsg.textContent = error.message;
        errGeneric.classList.add("show-error");
      }
    });
};

googlebtn.addEventListener("click", () => googleAuthenticate());