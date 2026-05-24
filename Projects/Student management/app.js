import {  db, collection,addDoc,doc,onSnapshot,query,orderBy,deleteDoc, updateDoc, where, getDocs} from "./firebaseConfig.js";

let students = [];
const nameinp = document.getElementById("nameinp");
const ageinp = document.getElementById("ageinp");
const courseinp = document.getElementById("courseinp");
const addbtn = document.getElementById("addbtn");
const renderelm = document.getElementById("child2");
const updatebtn = document.getElementById("updatebtn");
const searchStudent = document.getElementById("searchstudent");
const searchname = document.getElementById("searchname");

// Add Button Event
addbtn.addEventListener("click", () => {
    if (nameinp.value === "" ||ageinp.value === "" ||courseinp.value === "") {
        alert("Fulfill all inputs");
        return;
    }
    addData();
});

// Adding Data
const addData = async () => {
    try {
        const docRef = await addDoc(collection(db, "Students"), {
            name: nameinp.value,
            age: ageinp.value,
            course: courseinp.value,
            createdAt: Date.now()
        });
        console.log("Document written with ID:", docRef.id);
        // Clear Inputs
        nameinp.value = "";
        ageinp.value = "";
        courseinp.value = "";
    } catch (error) {
        console.log(error);
    }
};

// Query for Ascending Order
const q = query(collection(db, "Students"),orderBy("createdAt", "asc"));

// Real-time Data Fetch
renderelm.innerText = "Loading..."
const unsubscribe = onSnapshot(q,(snapshot) => {
    students = [];
    snapshot.forEach((doc) => {
    students.push({
     ID: doc.id,
    ...doc.data()
    });
});
    console.log(students);
    renderData();
    },
    (error) => {
        console.log(error);
    }
);

// Render Data on DOM
const renderData = () => {
    renderelm.innerHTML = "";
    students.forEach((num) => {
const divelm = document.createElement("div");
divelm.innerText = num.name;
divelm.className = "box";
renderelm.appendChild(divelm);
//working on deleting 
const deletebtn = document.createElement("button");
deletebtn.innerText = "Delete";
deletebtn.className = "deletebtn"
divelm.appendChild(deletebtn);
deletebtn.onclick = async()=> {
await deleteDoc(doc(db, "Students", num.ID));
}
//working on edit 
const editbtn = document.createElement("button")
editbtn.innerText = "Edit";
editbtn.className = "editbtn";
divelm.appendChild(editbtn);
editbtn.onclick = ()=> {
addbtn.style.display = "none";
updatebtn.style.display = "inline";
deletebtn.style.display = "none";
editbtn.style.display = "none";
nameinp.value = num.name;
ageinp.value = num.age;
courseinp.value = num.course
//working on update
updatebtn.onclick = async()=> {
try {
    await  updateDoc(doc(db, "Students", num.ID), {
    name: nameinp.value,
    age: ageinp.value,
    course: courseinp.value,
});
} catch (error) {
    console.log(error);
}
updatebtn.style.display = "none";
addbtn.style.display = "inline";
editbtn.style.display = "inline";
deletebtn.style.display ="inline";
nameinp.value = "";
ageinp.value = "";
courseinp.value = "";
}    
}
    });

};
//checking the value exist or not
searchname.addEventListener("click", async () => {
  try {
const searchValue = searchStudent.value.toLowerCase().trim();
if(searchValue === "") {
    alert("enter name");
    return;
}
const matchedStudents = students.filter((student) => {
return student.name.toLowerCase().includes(searchValue);
        });

        if (matchedStudents.length === 0) {
            alert("No student found");
            searchStudent.value = "";
            return;
        }
        alert(searchStudent.value+" is exist")
        console.log(matchedStudents);
        searchStudent.value = "";
    } catch (error) {
        console.log(error);
    }

});