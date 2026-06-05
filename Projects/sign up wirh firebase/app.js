import { getAuth, createUserWithEmailAndPassword } from "./firebaseconfig.js";

// getting elements
const emailinp = document.getElementById("email-inp");
const passwordinp = document.getElementById("password-inp");
const resgister = document.getElementById("sign-up-btn");
const inpError = document.getElementById("box-button-error");
const accountsuccess = document.getElementById("box-button-success");
const Loading = document.getElementById("box-btn-load");
// validation
const validation = () => {
    if (emailinp.value.length < 3 || passwordinp.value.length < 8) {
        return false;
    }
    else if (!emailinp.checkValidity()) { 
        return false;
    }
    return true;
}

// registration function
const registration = () => {
    if (!validation()) {
        inpError.style.display = "block";
        accountsuccess.style.display = "none";
        return;
    }
    // working on registration
    Loading.style.display = "block"; 
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, emailinp.value, passwordinp.value)
        .then((userCredential) => {
            // Signed up 
            Loading.style.display = "none";
            const user = userCredential.user;
            console.log(user);
          // restarting everything 
            inpError.style.display = "none";
            accountsuccess.style.display = "block";
            emailinp.value = "";
            passwordinp.value = "";
        })
        .catch((error) => {
            // Added error catch for Firebase rejections (e.g., weak password)
            console.error(error);
            inpError.style.display = "block";
            accountsuccess.style.display = "none";
        });
}

resgister.addEventListener("click", () => registration());