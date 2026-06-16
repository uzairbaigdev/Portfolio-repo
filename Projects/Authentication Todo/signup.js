import { getAuth, createUserWithEmailAndPassword,auth,collection, addDoc,db } from "./firebaseConfig.js";
import {redirectIfLoggedIn } from "./auth-guard.js";
// getting elements
const emailinp = document.getElementById("email-inp");
const passwordinp = document.getElementById("password-inp");
const resgister = document.getElementById("sign-up-btn");
const accountsuccess = document.getElementById("box-button-success");
const Loading = document.getElementById("box-btn-load");
//error 
const FillInputsError = document.getElementById("fill-inputs-error");
const emailInpError = document.getElementById("email-error");
const passwordInpError = document.getElementById("password-error");
const emailInUseError = document.getElementById("email-in-use");
let user = null;

redirectIfLoggedIn();
// registration function
const registration = async() => {

FillInputsError.style.display = "none"; 
emailInpError.style.display = "none"; 
passwordInpError.style.display = "none";
emailInUseError.style.display = "none";
Loading.style.display = "block"; 
//checking validation
 if (emailinp.value.length < 1 || passwordinp.value.length < 1) {
    Loading.style.display = "none";
    emailInpError.style.display = "none";
    passwordInpError.style.display = "none";
    emailInUseError.style.display = "none";
    FillInputsError.style.display = "block";
    return;
    }
  else if (!emailinp.checkValidity()) { 
    Loading.style.display = "none";
    FillInputsError.style.display = "none";
    passwordInpError.style.display = "none";
    emailInUseError.style.display = "none";
    emailInpError.style.display = "block";
    return;
  }
  else if (passwordinp.value.length < 8) {
    Loading.style.display = "none";
    FillInputsError.style.display = "none";
    emailInpError.style.display = "none";
    emailInUseError.style.display = "none";
    passwordInpError.style.display = "block";
    return; 
  }

    // working on registration
    createUserWithEmailAndPassword(auth, emailinp.value, passwordinp.value)
        .then((userCredential) => {
            // Signed up 
            user = userCredential.user;
            console.log(user);
            adduser().then(()=> {
            // restarting everything 
            accountsuccess.style.display = "block";
            emailinp.value = "";
            passwordinp.value = "";
            window.location.replace("./todo.html")
            })
          
        })
        .catch((error) => {
            Loading.style.display = "none";
            if (error.code === "auth/email-already-in-use") {
            FillInputsError.style.display = "none";
            emailInpError.style.display = "none";
            passwordInpError.style.display = "none";
            emailInUseError.style.display = "block";
            } else {
            console.error(error);
            }
        });
}

resgister.addEventListener("click", () => registration());


//add user data to firestore after registration
const adduser = async () => {
  try {
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
    console.log("Error =>", error);
    throw error;
  }
};