import {  auth, db, collection, onAuthStateChanged, query, where, getDocs, doc, updateDoc 
} from "./firebaseConfig.js";

let currentUID = null;
let documentID = null;
//getting DOM elements
const btnAdmin = document.getElementById("btn-admin");
const btnTechnician = document.getElementById("btn-technician");
const btnUser = document.getElementById("btn-user");

//getting current user UID from Localstorage
const getUserFromLocalStorage = () => {
    currentUID = window.localStorage.getItem("CurrentUID");
    documentID = window.localStorage.getItem("DocID");
    console.log("Current User UID =>", currentUID);
    console.log("current user document ID =>",documentID);
    return currentUID; 
};
getUserFromLocalStorage();

//working on grtting user data from database using query with UID 
const getUserData = async()=> {
    try {
const q = query(collection(db, "Users"), where("uid", "==", currentUID));
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
console.log(doc.id, " => ", doc.data());
if(doc.data().Role !== null) {
    window.location.replace("dashboard.html");
}
});
    } catch (error) {
        console.log(error);
    }
}
getUserData();

//working on updating Role 
const updateRole = async(roleName)=> {
try {
const washingtonRef = doc(db, "Users", documentID);
await updateDoc(washingtonRef, {
  Role:roleName
});
console.log("document updated");
window.location.replace("dashboard.html")
} catch (error) {
console.error(error);    
}
}

//admin access requires a password before role update
const ADMIN_PASSWORD = "mub@12345";

// Modal DOM elements
const modalOverlay = document.getElementById("admin-modal-overlay");
const modalCard = document.getElementById("admin-modal-card");
const modalForm = document.getElementById("admin-modal-form");
const passwordInput = document.getElementById("admin-password-input");
const errorMessage = document.getElementById("modal-error-message");
const cancelBtn = document.getElementById("admin-modal-cancel");
const confirmBtn = document.getElementById("admin-modal-confirm");
const confirmBtnText = document.getElementById("confirm-btn-text");
const confirmSpinner = document.getElementById("confirm-spinner");
const toggleVisibilityBtn = document.getElementById("toggle-password-visibility");
const eyeIcon = document.getElementById("eye-icon");

const openAdminModal = () => {
    modalOverlay.classList.add("is-open");
    passwordInput.value = "";
    passwordInput.classList.remove("input-error");
    errorMessage.classList.remove("is-visible");
    setTimeout(() => passwordInput.focus(), 150);
};

const closeAdminModal = () => {
    modalOverlay.classList.remove("is-open");
};

const showError = () => {
    passwordInput.classList.add("input-error");
    errorMessage.classList.add("is-visible");
    modalCard.classList.add("shake");
    passwordInput.focus();
    setTimeout(() => modalCard.classList.remove("shake"), 400);
};

const setLoadingState = (isLoading) => {
    confirmBtn.disabled = isLoading;
    cancelBtn.disabled = isLoading;
    confirmSpinner.style.display = isLoading ? "inline-block" : "none";
    confirmBtnText.textContent = isLoading ? "Verifying..." : "Verify & continue";
};

// clear the error state as soon as the user starts typing again
passwordInput.addEventListener("input", () => {
    passwordInput.classList.remove("input-error");
    errorMessage.classList.remove("is-visible");
});

// toggle password visibility
toggleVisibilityBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeIcon.innerHTML = isPassword
        ? `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.5a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"></path>`
        : `<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>`;
});

// cancel button + overlay click closes modal
cancelBtn.addEventListener("click", closeAdminModal);
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeAdminModal();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("is-open")) closeAdminModal();
});

// form submit handles the password check
modalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const enteredPassword = passwordInput.value.trim();

    setLoadingState(true);

    // tiny delay gives a "verifying" feel rather than an instant snap judgement
    setTimeout(() => {
        if (enteredPassword === ADMIN_PASSWORD) {
            updateRole("admin");
        } else {
            setLoadingState(false);
            showError();
        }
    }, 450);
});

btnAdmin.addEventListener("click", openAdminModal);
btnTechnician.addEventListener("click",()=> updateRole("technician"));
btnUser.addEventListener("click",()=> updateRole("user"));