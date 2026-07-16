import {  auth, db, collection, onAuthStateChanged, query, where, getDocs, doc, updateDoc 
} from "./firebaseConfig.js";

let currentUID = null;
let documentID = null;
//getting DOM elements
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

// ---------------- Auth guard ----------------
// Blocks direct/unauthenticated access to this page. Nobody reaches the role
// selection screen without a real, currently-valid Firebase login session.
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // No logged-in session — bounce straight back to login, page stays hidden
        window.location.replace("login.html");
        return;
    }

    // Authenticated: reveal the page and continue the normal flow
    document.body.style.visibility = "visible";
    getUserFromLocalStorage();
    getUserData();
});

btnTechnician.addEventListener("click",()=> updateRole("technician"));
btnUser.addEventListener("click",()=> updateRole("user"));