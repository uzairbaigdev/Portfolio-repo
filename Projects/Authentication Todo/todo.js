  import { db } from "./firebaseConfig.js";
  import { collection, addDoc, getDocs, deleteDoc,
  doc , query,  orderBy,setDoc, getAuth, onAuthStateChanged,auth,signOut,deleteUser} from "./firebaseConfig.js";
  import { requireGuest } from "./auth-guard.js";

  let Todos = [];
  const todoinp = document.getElementById("todoinp");
  const addbtn = document.getElementById("addbtn");
  const child2 = document.getElementById("child2");
  const updatebtn = document.getElementById("updatebtn");
  const logoutbtn = document.getElementById("logoutbtn");
  const accountDeleteBtn = document.getElementById("delete-account-trigger");
  const deleteBox = document.getElementById("delete-modal-overlay");
  const cancelBtn = document.getElementById("modal-cancel-btn");
  const deleteAccountbtn = document.getElementById("modal-delete-btn")

requireGuest();

//signout 
const usersignout = async() => {

       await signOut(auth).then(() => {
        // Sign-out successful.
        console.log('success on sign out')
    }).catch((error) => {
        // An error happened.
        console.log('error on sign out => ', error)
    });
}
logoutbtn.addEventListener("click",()=> usersignout())



  // working on adding data
  addbtn.addEventListener("click", async () => {
    try {
      if(todoinp.value === "") {
      alert("enter todo");
      return;
      }
      child2.innerText = "Loading..."
      const todoObj = {
        Todo: todoinp.value,
        iscomplete:false,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, "Todos"), todoObj);
      getdata();
      console.log("Document written with ID:", docRef.id);
      // console.log(Todos);
      todoinp.value = "";
    } catch (error) {
      console.log("Error => " + error);
    }
  });
  //working on getting data 
  let getdata = async() => {
    try {
      child2.innerText = "Loading...";
        const q = query(
      collection(db, "Todos"),
      orderBy("createdAt", "asc")
    );

    const querySnapshot = await getDocs(q);
      Todos = [];
    querySnapshot.forEach((num)=> {
      // console.log(num.data());
     Todos.push({
     id: num.id,
     ...num.data()
     })
    })
    console.log(Todos);
    renderTodo();
    } catch (error) {
      console.log(error);
    }
  }
  getdata(); 
  //working on DOM
  let renderTodo = ()=> {
  child2.innerHTML = "";
  Todos.forEach((num)=> {
  let divelm = document.createElement("div");
      divelm.className = "box";

      let textelm = document.createElement("span");
      textelm.className = "box-text";
      textelm.innerText = num.Todo;
      divelm.appendChild(textelm);

      let actions = document.createElement("div");
      actions.className = "box-actions";

//working on deleting 
let deletebtn = document.createElement("button");
deletebtn.innerText = "Delete";
deletebtn.className = "delbtns";
actions.appendChild(deletebtn);
deletebtn.onclick = async()=> {
  await deleteDoc(doc(db, "Todos", num.id));
  getdata();
}
//working on edit 
let editbtn = document.createElement("button")
editbtn.innerText = "Edit";
editbtn.className = "editbtns";
actions.appendChild(editbtn);
editbtn.onclick = ()=> {
  addbtn.style.display = "none";
  editbtn.style.display = "none";
  deletebtn.style.display = "none";
  updatebtn.style.display = "inline";
  todoinp.value = num.Todo;
//working on update button
updatebtn.onclick = async()=> {
  if(todoinp.value === "") {
    alert("enter todo");
    return;
  }
  child2.innerText = "Loading..."
await setDoc(doc(db, "Todos", num.id), {
    Todo: todoinp.value,
    iscomplete:false,
    createdAt: Date.now()
})
getdata();
addbtn.style.display = "inline";
editbtn.style.display = "inline";
deletebtn.style.display = "inline";
updatebtn.style.display = "none";
todoinp.value = "";
}
  }
//working on done 
let donebtn = document.createElement("button");
let notdonebtn = document.createElement("button");
donebtn.innerText = "Done";
donebtn.className = "donebtn"
actions.appendChild(donebtn);
notdonebtn.style.display = "none";
donebtn.onclick = async()=> {
await setDoc(doc(db, "Todos", num.id), {
    Todo: num.Todo,
    iscomplete:true,
    createdAt: Date.now()
})
donebtn.style.display = "none";
divelm.classList.add("completed");
notdonebtn.style.display = "inline";
}
//working on not done 
notdonebtn.innerText = "Not Done";
notdonebtn.className = "notdonebtn";
actions.appendChild(notdonebtn);
notdonebtn.onclick = async()=> {
 await setDoc(doc(db, "Todos", num.id), {
    Todo: num.Todo,
    iscomplete:false,
    createdAt: Date.now()
})
notdonebtn.style.display = "none";
donebtn.style.display = "inline";
divelm.classList.remove("completed");
}

if(num.iscomplete === true) {
    divelm.classList.add("completed");
    donebtn.style.display = "none";
    notdonebtn.style.display = "inline";
}

divelm.appendChild(actions);
child2.appendChild(divelm);

}
)}

//working on account deleting 
accountDeleteBtn.onclick = () => {
    deleteBox.style.display = "block";
}  
cancelBtn.onclick = () => {
    deleteBox.style.display = "none";
}
deleteAccountbtn.onclick = async () => {
  try {
    await deleteUserData(); // delete firestore document first

    const user = auth.currentUser;
    await deleteUser(user); // then delete auth account

    console.log("User and Firestore data deleted");
    localStorage.removeItem("userData");
  } catch (error) {
    console.log(error);
  }
};
//working on deleting user data from the database 
const deleteUserData = async ()=> {
  try {
    const userID = JSON.parse(window.localStorage.getItem("userData"));
  await deleteDoc(doc(db, "users", userID.docId));    
  } catch (error) {
    console.log(error);
  }
}