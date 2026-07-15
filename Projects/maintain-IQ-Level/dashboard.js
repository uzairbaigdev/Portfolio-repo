import {
  auth, db, collection, addDoc, updateDoc, doc, getDocs,
  query, where,serverTimestamp, getAuth, signOut, onSnapshot
} from "./firebaseConfig.js";

let currentUID = null;
let currentDocID = null;

//getting DOM elements
const userNameLabel = document.getElementById("userNameLabel");
const logoutBtn = document.getElementById("logoutBtn");
const nextBtn = document.getElementById("toStep2Btn");
const techPopup = document.getElementById("techPopup");
const popupTechList = document.getElementById("popupTechList");
const closePopupBtn = document.getElementById("closePopupBtn");
const cancelPopupBtn = document.getElementById("cancelPopupBtn");
const confirmPopupBtn = document.getElementById("confirmPopupBtn");

const backToStep1Btn = document.getElementById("backToStep1Btn");
const toStep3Btn = document.getElementById("toStep3Btn");
const backToStep2Btn = document.getElementById("backToStep2Btn");
const sendRequestBtn = document.getElementById("sendRequestBtn");
const problemDescInput = document.getElementById("problemDescInput");

const userHistoryList = document.getElementById("userHistoryList");
const userHistoryCount = document.getElementById("userHistoryCount");
const userHistoryEmpty = document.getElementById("userHistoryEmpty");

const rolePill = document.getElementById("rolePill");
const loadingView = document.getElementById("loadingView");
const noRoleView = document.getElementById("noRoleView");
const userView = document.getElementById("userView");
const technicianView = document.getElementById("technicianView");
const adminView = document.getElementById("adminView");

const pendingList = document.getElementById("pendingList");
const pendingCount = document.getElementById("pendingCount");
const pendingEmpty = document.getElementById("pendingEmpty");

const disputedList = document.getElementById("disputedList");
const disputedCount = document.getElementById("disputedCount");
const disputedEmpty = document.getElementById("disputedEmpty");

const activeList = document.getElementById("activeList");
const activeCount = document.getElementById("activeCount");
const activeEmpty = document.getElementById("activeEmpty");

const techHistoryList = document.getElementById("techHistoryList");
const techHistoryCount = document.getElementById("techHistoryCount");
const techHistoryEmpty = document.getElementById("techHistoryEmpty");

// --- Admin dashboard elements ---
const statTotal = document.getElementById("statTotal");
const statPending = document.getElementById("statPending");
const statDisputed = document.getElementById("statDisputed");
const statActive = document.getElementById("statActive");
const statDone = document.getElementById("statDone");
const statRejected = document.getElementById("statRejected");

const adminTechnicianSelect = document.getElementById("adminTechnicianSelect");
const adminProblemDescInput = document.getElementById("adminProblemDescInput");
const adminSendRequestBtn = document.getElementById("adminSendRequestBtn");
const adminWizardError = document.getElementById("adminWizardError");
const adminWizardErrorText = document.getElementById("adminWizardErrorText");

const adminSearchInput = document.getElementById("adminSearchInput");
const adminStatusFilter = document.getElementById("adminStatusFilter");
const adminList = document.getElementById("adminList");
const adminCount = document.getElementById("adminCount");
const adminEmpty = document.getElementById("adminEmpty");

const doneWorkPopup = document.getElementById("doneWorkPopup");
const doneDescInput = document.getElementById("doneDescInput");
const doneDescError = document.getElementById("doneDescError");
const closeDonePopupBtn = document.getElementById("closeDonePopupBtn");
const cancelDonePopupBtn = document.getElementById("cancelDonePopupBtn");
const confirmDoneBtn = document.getElementById("confirmDoneBtn");

const arguePopup = document.getElementById("arguePopup");
const argueDescInput = document.getElementById("argueDescInput");
const argueDescError = document.getElementById("argueDescError");
const closeArguePopupBtn = document.getElementById("closeArguePopupBtn");
const cancelArguePopupBtn = document.getElementById("cancelArguePopupBtn");
const confirmArgueBtn = document.getElementById("confirmArgueBtn");

// Remembers which request is currently being marked as done via the popup
let pendingDoneRequestId = null;

// Remembers which request the user is currently disputing via the argue popup
let pendingArgueRequestId = null;

// Remembers the logged-in user's own name/email so it can be attached to requests they submit
let currentUserName = null;
let currentUserEmail = null;

// Keep a handle on the live database listeners so we never attach duplicates
let unsubscribeUserRequests = null;
let unsubscribeTechnicianRequests = null;
let unsubscribeAdminRequests = null;

// Holds the latest full set of requests the admin listener has received, so search/filter
// changes can re-render instantly without re-querying Firestore.
let adminRequestsCache = [];

// Maps technician uid -> name for the admin's "submit a new request" form
let adminTechniciansMap = {};

// Shows the correct dashboard section for the user's role
const showView = (view) => {
    [loadingView, noRoleView, userView, technicianView, adminView].forEach((v) => v.classList.remove("active"));
    view.classList.add("active");
};

// Remembers which technician was picked in the popup so Step 3 can use it
let selectedTechUID = null;
let selectedTechName = null;

//getting current user UID from Localstorage
const getUserFromLocalStorage = () => {
    currentUID = window.localStorage.getItem("CurrentUID");
    currentDocID = window.localStorage.getItem("DocID");
    console.log("Current User UID =>", currentUID);
    console.log("current user document ID =>",currentDocID);
    return currentUID; 
};
getUserFromLocalStorage();

//working on getting user from Database 
const getUserFromDatabase = async()=> {
    try {
const q = query(collection(db, "Users"), where("uid", "==", currentUID));
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
  console.log(doc.id, " => ", doc.data());
  const data = doc.data();
  userNameLabel.innerText = data.name;
  currentUserName = data.name || "";
  currentUserEmail = data.email || data.Email || (auth.currentUser ? auth.currentUser.email : "") || "";

  const role = data.Role;
  if (role === "technician") {
      rolePill.innerText = "technician";
      showView(technicianView);
      loadTechnicianRequests();
  } else if (role === "admin") {
      rolePill.innerText = "admin";
      showView(adminView);
      loadAdminRequests();
      loadAdminTechnicianOptions();
  } else if (role) {
      rolePill.innerText = role;
      showView(userView);
      loadUserRequests();
  } else {
      showView(noRoleView);
  }
});
    } catch (error) {
        console.error(error);
    }
}
getUserFromDatabase();

//working on log out 
const logout = ()=> {
signOut(auth).then(() => {
window.localStorage.removeItem("CurrentUID")
window.localStorage.removeItem('DocID');
window.location.replace("index.html");
}).catch((error) => {
  console.error(error);
});
}   
logoutBtn.addEventListener("click",()=> logout());

// Helper function to show/hide popup
const togglePopup = (show) => {
    techPopup.style.display = show ? "flex" : "none";
};

// Close actions
closePopupBtn.addEventListener("click", () => togglePopup(false));
cancelPopupBtn.addEventListener("click", () => togglePopup(false));

// Update your gettingTechnician function to load users into the simple popup
const gettingTechnician = async () => {
    try {
        popupTechList.innerHTML = '<div style="text-align: center; padding: 12px; color: var(--slate-600);">Loading technicians...</div>';
        togglePopup(true);

        const q = query(collection(db, "Users"), where("Role", "==", "technician"));
        const querySnapshot = await getDocs(q);
        popupTechList.innerHTML = "";

        if (querySnapshot.empty) {
            popupTechList.innerHTML = '<div class="empty-note">No technicians found.</div>';
            return;
        }

        let isFirst = true;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Create selection elements inside popup
            const card = document.createElement("label");
            card.className = `option-card ${isFirst ? "selected" : ""}`;
            card.setAttribute("data-uid", data.uid);
            card.setAttribute("data-name", data.name);
            card.innerHTML = `
                <input type="radio" name="techSelect" value="${data.uid}" ${isFirst ? "checked" : ""}>
                <div class="option-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                    <div class="option-text-title">${data.name}</div>
                    <div class="option-text-sub">Field Specialist</div>
                </div>
            `;
            popupTechList.appendChild(card);
            isFirst = false;
        });

    } catch (error) {
        console.error("Error displaying technicians:", error);
        popupTechList.innerHTML = '<div style="color: var(--error-700)">Error loading technicians.</div>';
    }
};

// Next button listener inside the popup
confirmPopupBtn.addEventListener("click", () => {
    const selectedRadio = popupTechList.querySelector('input[name="techSelect"]:checked');
    if (!selectedRadio) {
        alert("Please select a technician to proceed!");
        return;
    }

    const parentCard = selectedRadio.closest(".option-card");
    const techUid = parentCard.getAttribute("data-uid");
    const techName = parentCard.getAttribute("data-name");

    // Remember the choice for Step 3 (sending the request)
    selectedTechUID = techUid;
    selectedTechName = techName;

    // Put selected technician inside the main step-2 input element
    const mainTechContainer = document.getElementById("technicianList");
    mainTechContainer.innerHTML = `
        <label class="option-card selected">
            <input type="radio" value="${techUid}" checked>
            <div class="option-icon" style="background-color: var(--brand-primary); color: white;">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div>
                <div class="option-text-title">${techName}</div>
                <div class="option-text-sub">Selected Service Professional</div>
            </div>
        </label>
    `;

    // Hide Popup
    togglePopup(false);

    // Transition to Wizard Step 2 visual page
    document.getElementById("wizardStep1").style.display = "none";
    document.getElementById("wizardStep2").style.display = "block";
    document.getElementById("stepDot1").classList.remove("current");
    document.getElementById("stepDot1").classList.add("done");
    document.getElementById("stepDot2").classList.add("current");
});
nextBtn.addEventListener("click",()=> gettingTechnician());

// Back from Step 2 (technician) to Step 1 (category)
backToStep1Btn.addEventListener("click", () => {
    document.getElementById("wizardStep2").style.display = "none";
    document.getElementById("wizardStep1").style.display = "block";
    document.getElementById("stepDot2").classList.remove("current");
    document.getElementById("stepDot1").classList.remove("done");
    document.getElementById("stepDot1").classList.add("current");
});

// Next from Step 2 (technician) to Step 3 (describe the problem)
toStep3Btn.addEventListener("click", () => {
    document.getElementById("wizardStep2").style.display = "none";
    document.getElementById("wizardStep3").style.display = "block";
    document.getElementById("stepDot2").classList.remove("current");
    document.getElementById("stepDot2").classList.add("done");
    document.getElementById("stepDot3").classList.add("current");
});

// Back from Step 3 (describe the problem) to Step 2 (technician)
backToStep2Btn.addEventListener("click", () => {
    document.getElementById("wizardStep3").style.display = "none";
    document.getElementById("wizardStep2").style.display = "block";
    document.getElementById("stepDot3").classList.remove("current");
    document.getElementById("stepDot2").classList.remove("done");
    document.getElementById("stepDot2").classList.add("current");
});

// Resets the wizard back to Step 1 for the next time it's opened
const resetWizard = () => {
    problemDescInput.value = "";
    selectedTechUID = null;
    selectedTechName = null;

    document.getElementById("wizardStep3").style.display = "none";
    document.getElementById("wizardStep2").style.display = "none";
    document.getElementById("wizardStep1").style.display = "block";

    document.getElementById("stepDot3").classList.remove("current", "done");
    document.getElementById("stepDot2").classList.remove("current", "done");
    document.getElementById("stepDot1").classList.remove("done");
    document.getElementById("stepDot1").classList.add("current");
};

// Send the request to the selected technician
sendRequestBtn.addEventListener("click", async () => {
    const problemText = problemDescInput.value.trim();

    if (!selectedTechUID) {
        alert("Please select a technician to proceed!");
        return;
    }
    if (!problemText) {
        alert("Please describe the problem to proceed!");
        return;
    }

    try {
        sendRequestBtn.disabled = true;
        await addDoc(collection(db, "Requests"), {
            userUid: currentUID,
            userDocId: currentDocID,
            userName: currentUserName || "Unknown user",
            userEmail: currentUserEmail || "",
            technicianUid: selectedTechUID,
            technicianName: selectedTechName,
            problem: problemText,
            status: "pending",
            createdAt: serverTimestamp()
        });

        resetWizard();
        // No manual reload needed: the live listener (onSnapshot) already showing
        // "My requests" will pick up this new request automatically.
    } catch (error) {
        console.error("Error sending request:", error);
        alert("Something went wrong while sending your request. Please try again.");
    } finally {
        sendRequestBtn.disabled = false;
    }
});

// Populates the admin's "assign to technician" dropdown and keeps a uid -> name lookup
// so the admin's own request-submission form can attach a readable technician name.
const loadAdminTechnicianOptions = async () => {
    if (!adminTechnicianSelect) return;
    try {
        adminTechnicianSelect.innerHTML = '<option value="">Loading technicians...</option>';

        const q = query(collection(db, "Users"), where("Role", "==", "technician"));
        const querySnapshot = await getDocs(q);

        adminTechniciansMap = {};

        if (querySnapshot.empty) {
            adminTechnicianSelect.innerHTML = '<option value="">No technicians found</option>';
            return;
        }

        adminTechnicianSelect.innerHTML = '<option value="">Select a technician&hellip;</option>';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            adminTechniciansMap[data.uid] = data.name || "Unnamed technician";

            const option = document.createElement("option");
            option.value = data.uid;
            option.textContent = data.name || "Unnamed technician";
            adminTechnicianSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading technicians for admin:", error);
        adminTechnicianSelect.innerHTML = '<option value="">Error loading technicians</option>';
    }
};

// Lets the admin raise a new request on the organization's behalf, just like a regular
// user can, so the admin never has to log in as someone else to get a job started.
if (adminSendRequestBtn) {
    adminSendRequestBtn.addEventListener("click", async () => {
        const problemText = (adminProblemDescInput.value || "").trim();
        const selectedTechUid = adminTechnicianSelect.value;
        const selectedTechName = adminTechniciansMap[selectedTechUid];

        adminWizardError.classList.remove("show-error");

        if (!selectedTechUid) {
            adminWizardErrorText.innerText = "Please select a technician to proceed!";
            adminWizardError.classList.add("show-error");
            return;
        }
        if (!problemText) {
            adminWizardErrorText.innerText = "Please describe the problem to proceed!";
            adminWizardError.classList.add("show-error");
            return;
        }

        try {
            adminSendRequestBtn.disabled = true;
            await addDoc(collection(db, "Requests"), {
                userUid: currentUID,
                userDocId: currentDocID,
                userName: currentUserName || "Admin",
                userEmail: currentUserEmail || "",
                technicianUid: selectedTechUid,
                technicianName: selectedTechName || "Technician",
                problem: problemText,
                status: "pending",
                createdAt: serverTimestamp()
            });

            adminProblemDescInput.value = "";
            adminTechnicianSelect.value = "";
            // No manual reload needed: the live listener on "All requests" picks up
            // this new request automatically.
        } catch (error) {
            console.error("Error sending admin request:", error);
            adminWizardErrorText.innerText = "Something went wrong while sending the request. Please try again.";
            adminWizardError.classList.add("show-error");
        } finally {
            adminSendRequestBtn.disabled = false;
        }
    });
}

// Turns a raw status value into the label shown on screen. The "argued" state reads
// as "argued pending" on the user's side (they're waiting) and "argued" on the
// technician's side (it needs their attention).
const getStatusLabel = (status, viewer) => {
    if (status === "argued") return viewer === "technician" ? "argued" : "argued pending";
    if (status === "argued-accepted") return "argued accepted";
    return status;
};

// Loads the current user's submitted requests into the "My requests" section.
// Uses a live database listener (onSnapshot) so the moment a technician accepts,
// rejects, completes, or responds to a dispute, it updates on screen without needing a refresh.
const loadUserRequests = () => {
    if (unsubscribeUserRequests) return; // already listening, avoid duplicate subscriptions

    const q = query(collection(db, "Requests"), where("userUid", "==", currentUID));

    unsubscribeUserRequests = onSnapshot(q, (querySnapshot) => {
        userHistoryList.innerHTML = "";

        if (querySnapshot.empty) {
            userHistoryCount.innerText = "0";
            userHistoryEmpty.style.display = "block";
            return;
        }

        userHistoryEmpty.style.display = "none";
        userHistoryCount.innerText = String(querySnapshot.size);

        sortDocsByNewest(querySnapshot).forEach((docSnap) => {
            const data = docSnap.data();
            const reqId = docSnap.id;
            const status = data.status || "pending";
            const statusLabel = getStatusLabel(status, "user");

            const card = document.createElement("div");
            card.className = "req-card";
            card.innerHTML = `
                <div class="req-card-top">
                    <div>
                        <div class="req-category">${escapeHtml(data.technicianName) || "Technician"}</div>
                        <div class="req-meta">Assigned technician</div>
                    </div>
                    <span class="status-badge status-${status}">${statusLabel}</span>
                </div>
                <div class="req-date">${formatRequestDate(data.createdAt)}</div>
                <div class="req-problem">${escapeHtml(data.problem)}</div>
                ${data.solution ? `
                <div class="req-solution">
                    <div class="req-solution-label">Resolution</div>
                    ${escapeHtml(data.solution)}
                </div>` : ""}
                ${(status === "argued" || status === "argued-accepted") && data.disputeReason ? `
                <div class="req-dispute">
                    <div class="req-dispute-label">Your dispute</div>
                    ${escapeHtml(data.disputeReason)}
                </div>` : ""}
                ${status === "done" ? `
                <div class="req-actions">
                    <button class="btn-argue" data-id="${reqId}" data-action="argue">Argue</button>
                </div>` : ""}
            `;
            userHistoryList.appendChild(card);
        });
    }, (error) => {
        console.error("Error loading your requests:", error);
    });
};

// Handles clicks on the Argue button inside the user's own request cards
const handleUserAction = (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

    if (btn.getAttribute("data-action") === "argue") {
        pendingArgueRequestId = btn.getAttribute("data-id");
        argueDescInput.value = "";
        argueDescError.classList.remove("show-error");
        arguePopup.style.display = "flex";
    }
};

userHistoryList.addEventListener("click", handleUserAction);

// Helper to open/close the argue (dispute) popup
const toggleArguePopup = (show) => {
    arguePopup.style.display = show ? "flex" : "none";
    if (!show) {
        pendingArgueRequestId = null;
        argueDescInput.value = "";
        argueDescError.classList.remove("show-error");
    }
};

closeArguePopupBtn.addEventListener("click", () => toggleArguePopup(false));
cancelArguePopupBtn.addEventListener("click", () => toggleArguePopup(false));

// Sends the user's dispute back to the technician: the description is required
confirmArgueBtn.addEventListener("click", async () => {
    const argueText = argueDescInput.value.trim();

    if (!argueText) {
        argueDescError.classList.add("show-error");
        return;
    }
    if (!pendingArgueRequestId) {
        toggleArguePopup(false);
        return;
    }

    try {
        confirmArgueBtn.disabled = true;
        await updateDoc(doc(db, "Requests", pendingArgueRequestId), {
            status: "argued",
            disputeReason: argueText,
            disputedAt: serverTimestamp()
        });
        toggleArguePopup(false);
        // No manual reload needed: the live listener (onSnapshot) picks up this
        // change automatically and re-renders the request history.
    } catch (error) {
        console.error("Error sending dispute:", error);
        alert("Something went wrong while sending your dispute. Please try again.");
    } finally {
        confirmArgueBtn.disabled = false;
    }
});

// Escapes a small set of HTML-sensitive characters so request text can't break the markup
const escapeHtml = (str) => {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Turns a Firestore Timestamp into a readable "day, date month year, time" string,
// e.g. "Wed, 15 Jul 2026, 3:45 PM". Firestore's serverTimestamp() briefly reads back as
// null on the sender's own device until the server confirms it, so we fall back to
// "Just now" for that split second instead of showing a blank/broken date.
const formatRequestDate = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== "function") return "Just now";
    const d = timestamp.toDate();
    const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${dayName}, ${day} ${month} ${year}, ${time}`;
};

// Returns a millisecond value used purely for sorting requests newest-first. A request
// that was just sent may not have its server timestamp back yet, so it's treated as
// "right now" which keeps it correctly pinned at the top instead of sinking to the bottom.
const getRequestMillis = (timestamp) => {
    if (timestamp && typeof timestamp.toMillis === "function") return timestamp.toMillis();
    return Date.now();
};

// Sorts a Firestore querySnapshot's docs into a newest-first array based on createdAt
const sortDocsByNewest = (querySnapshot) => {
    return [...querySnapshot.docs].sort(
        (a, b) => getRequestMillis(b.data().createdAt) - getRequestMillis(a.data().createdAt)
    );
};

// Loads every request sent to the currently logged-in technician and sorts them into
// Incoming (pending), Disputed (argued), Active jobs (accepted / argued-accepted), and
// History (done / rejected). Uses a live database listener (onSnapshot) so new requests,
// disputes, and status changes are always reflected instantly and persist in Firestore.
const loadTechnicianRequests = () => {
    if (unsubscribeTechnicianRequests) return; // already listening, avoid duplicate subscriptions

    const q = query(collection(db, "Requests"), where("technicianUid", "==", currentUID));

    unsubscribeTechnicianRequests = onSnapshot(q, (querySnapshot) => {
        pendingList.innerHTML = "";
        disputedList.innerHTML = "";
        activeList.innerHTML = "";
        techHistoryList.innerHTML = "";

        let pendingItems = 0;
        let disputedItems = 0;
        let activeItems = 0;
        let historyItems = 0;

        sortDocsByNewest(querySnapshot).forEach((docSnap) => {
            const data = docSnap.data();
            const reqId = docSnap.id;
            const status = data.status || "pending";
            const requesterName = escapeHtml(data.userName || "Unknown user");
            const requesterEmail = escapeHtml(data.userEmail || "No email on file");
            const problemText = escapeHtml(data.problem || "");
            const statusLabel = getStatusLabel(status, "technician");
            const requestDate = formatRequestDate(data.createdAt);

            if (status === "pending") {
                pendingItems++;
                const card = document.createElement("div");
                card.className = "req-card";
                card.innerHTML = `
                    <div class="req-card-top">
                        <div>
                            <div class="req-category">${requesterName}</div>
                            <div class="req-meta">${requesterEmail}</div>
                        </div>
                        <span class="status-badge status-pending">pending</span>
                    </div>
                    <div class="req-date">${requestDate}</div>
                    <div class="req-problem">${problemText}</div>
                    <div class="req-actions">
                        <button class="btn-accept" data-id="${reqId}" data-action="accept">Accept request</button>
                        <button class="btn-reject" data-id="${reqId}" data-action="reject">Reject</button>
                    </div>
                `;
                pendingList.appendChild(card);
            } else if (status === "argued") {
                disputedItems++;
                const card = document.createElement("div");
                card.className = "req-card";
                card.innerHTML = `
                    <div class="req-card-top">
                        <div>
                            <div class="req-category">${requesterName}</div>
                            <div class="req-meta">${requesterEmail}</div>
                        </div>
                        <span class="status-badge status-argued">${statusLabel}</span>
                    </div>
                    <div class="req-date">${requestDate}</div>
                    <div class="req-problem">${problemText}</div>
                    ${data.solution ? `
                    <div class="req-solution">
                        <div class="req-solution-label">Your previous resolution</div>
                        ${escapeHtml(data.solution)}
                    </div>` : ""}
                    ${data.disputeReason ? `
                    <div class="req-dispute">
                        <div class="req-dispute-label">User's dispute</div>
                        ${escapeHtml(data.disputeReason)}
                    </div>` : ""}
                    <div class="req-actions">
                        <button class="btn-accept" data-id="${reqId}" data-action="accept-dispute">Accept dispute</button>
                    </div>
                `;
                disputedList.appendChild(card);
            } else if (status === "accepted" || status === "argued-accepted") {
                activeItems++;
                const card = document.createElement("div");
                card.className = "req-card";
                card.innerHTML = `
                    <div class="req-card-top">
                        <div>
                            <div class="req-category">${requesterName}</div>
                            <div class="req-meta">${requesterEmail}</div>
                        </div>
                        <span class="status-badge status-${status}">${statusLabel}</span>
                    </div>
                    <div class="req-date">${requestDate}</div>
                    <div class="req-problem">${problemText}</div>
                    ${data.disputeReason && status === "argued-accepted" ? `
                    <div class="req-dispute">
                        <div class="req-dispute-label">User's dispute</div>
                        ${escapeHtml(data.disputeReason)}
                    </div>` : ""}
                    <div class="req-actions">
                        <button class="btn-done" data-id="${reqId}" data-action="done">Done</button>
                    </div>
                `;
                activeList.appendChild(card);
            } else {
                // status is "done" or "rejected"
                historyItems++;
                const card = document.createElement("div");
                card.className = "req-card";
                card.innerHTML = `
                    <div class="req-card-top">
                        <div>
                            <div class="req-category">${requesterName}</div>
                            <div class="req-meta">${requesterEmail}</div>
                        </div>
                        <span class="status-badge status-${status}">${status}</span>
                    </div>
                    <div class="req-date">${requestDate}</div>
                    <div class="req-problem">${problemText}</div>
                    ${status === "done" && data.solution ? `
                    <div class="req-solution">
                        <div class="req-solution-label">Resolution</div>
                        ${escapeHtml(data.solution)}
                    </div>` : ""}
                `;
                techHistoryList.appendChild(card);
            }
        });

        pendingCount.innerText = String(pendingItems);
        pendingEmpty.style.display = pendingItems === 0 ? "block" : "none";

        disputedCount.innerText = String(disputedItems);
        disputedEmpty.style.display = disputedItems === 0 ? "block" : "none";

        activeCount.innerText = String(activeItems);
        activeEmpty.style.display = activeItems === 0 ? "block" : "none";

        techHistoryCount.innerText = String(historyItems);
        techHistoryEmpty.style.display = historyItems === 0 ? "block" : "none";
    }, (error) => {
        console.error("Error loading incoming requests:", error);
    });
};

// Handles clicks on Accept / Reject / Done buttons inside the technician's request cards
const handleTechnicianAction = async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

    const reqId = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");

    if (action === "accept") {
        btn.disabled = true;
        try {
            await updateDoc(doc(db, "Requests", reqId), { status: "accepted" });
            // No manual reload needed: the live listener (onSnapshot) picks up this
            // change automatically and re-renders the pending/active/history lists.
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Something went wrong while accepting this request. Please try again.");
            btn.disabled = false;
        }
    } else if (action === "reject") {
        const confirmed = window.confirm("Are you sure you want to reject this request?");
        if (!confirmed) return;
        btn.disabled = true;
        try {
            await updateDoc(doc(db, "Requests", reqId), { status: "rejected" });
        } catch (error) {
            console.error("Error rejecting request:", error);
            alert("Something went wrong while rejecting this request. Please try again.");
            btn.disabled = false;
        }
    } else if (action === "accept-dispute") {
        btn.disabled = true;
        try {
            await updateDoc(doc(db, "Requests", reqId), { status: "argued-accepted" });
            // No manual reload needed: the live listener (onSnapshot) picks up this
            // change automatically and moves the job into Active jobs.
        } catch (error) {
            console.error("Error accepting dispute:", error);
            alert("Something went wrong while accepting this dispute. Please try again.");
            btn.disabled = false;
        }
    } else if (action === "done") {
        // Open the popup so the technician must describe the problem and how it was solved
        pendingDoneRequestId = reqId;
        doneDescInput.value = "";
        doneDescError.classList.remove("show-error");
        doneWorkPopup.style.display = "flex";
    }
};

pendingList.addEventListener("click", handleTechnicianAction);
disputedList.addEventListener("click", handleTechnicianAction);
activeList.addEventListener("click", handleTechnicianAction);

// Recomputes the summary counters shown at the top of the admin dashboard
const updateAdminStats = (items) => {
    let pendingItems = 0;
    let disputedItems = 0;
    let activeItems = 0;
    let doneItems = 0;
    let rejectedItems = 0;

    items.forEach(({ data }) => {
        const status = data.status || "pending";
        if (status === "pending") pendingItems++;
        else if (status === "argued") disputedItems++;
        else if (status === "accepted" || status === "argued-accepted") activeItems++;
        else if (status === "done") doneItems++;
        else if (status === "rejected") rejectedItems++;
    });

    if (statTotal) statTotal.innerText = String(items.length);
    if (statPending) statPending.innerText = String(pendingItems);
    if (statDisputed) statDisputed.innerText = String(disputedItems);
    if (statActive) statActive.innerText = String(activeItems);
    if (statDone) statDone.innerText = String(doneItems);
    if (statRejected) statRejected.innerText = String(rejectedItems);
};

// Re-renders the admin's "All requests" list from the cached data, applying whatever
// search text and status filter are currently set. Runs on every snapshot update and
// every time the admin types in the search box or changes the filter dropdown.
const renderAdminList = () => {
    if (!adminList) return;

    const searchTerm = (adminSearchInput && adminSearchInput.value ? adminSearchInput.value : "").trim().toLowerCase();
    const statusFilter = adminStatusFilter && adminStatusFilter.value ? adminStatusFilter.value : "all";

    const filtered = adminRequestsCache.filter(({ data }) => {
        const status = data.status || "pending";
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (!searchTerm) return true;

        const haystack = [data.userName, data.userEmail, data.technicianName, data.problem]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");
        return haystack.includes(searchTerm);
    });

    adminList.innerHTML = "";
    adminCount.innerText = String(adminRequestsCache.length);
    adminEmpty.style.display = filtered.length === 0 ? "block" : "none";
    adminEmpty.innerText = adminRequestsCache.length === 0
        ? "No requests have been submitted yet."
        : "No requests match your search or filter.";

    filtered.forEach(({ id: reqId, data }) => {
        const status = data.status || "pending";
        const statusLabel = getStatusLabel(status, "technician");
        const requesterName = escapeHtml(data.userName || "Unknown user");
        const requesterEmail = escapeHtml(data.userEmail || "No email on file");
        const technicianName = escapeHtml(data.technicianName || "Unassigned");
        const problemText = escapeHtml(data.problem || "");
        const requestDate = formatRequestDate(data.createdAt);

        const canAccept = status === "pending";
        const canReject = status === "pending";
        const canAcceptDispute = status === "argued";
        const canMarkDone = status === "accepted" || status === "argued-accepted";
        const hasActions = canAccept || canReject || canAcceptDispute || canMarkDone;

        const card = document.createElement("div");
        card.className = "req-card";
        card.innerHTML = `
            <div class="req-card-top">
                <div>
                    <div class="req-category">${requesterName}</div>
                    <div class="req-meta">${requesterEmail} &middot; Assigned to ${technicianName}</div>
                </div>
                <span class="status-badge status-${status}">${statusLabel}</span>
            </div>
            <div class="req-date">${requestDate}</div>
            <div class="req-problem">${problemText}</div>
            ${data.solution ? `
            <div class="req-solution">
                <div class="req-solution-label">Resolution</div>
                ${escapeHtml(data.solution)}
            </div>` : ""}
            ${data.disputeReason ? `
            <div class="req-dispute">
                <div class="req-dispute-label">Dispute</div>
                ${escapeHtml(data.disputeReason)}
            </div>` : ""}
            ${hasActions ? `
            <div class="req-actions">
                ${canAccept ? `<button class="btn-accept" data-id="${reqId}" data-action="accept">Accept request</button>` : ""}
                ${canReject ? `<button class="btn-reject" data-id="${reqId}" data-action="reject">Reject</button>` : ""}
                ${canAcceptDispute ? `<button class="btn-accept" data-id="${reqId}" data-action="accept-dispute">Accept dispute</button>` : ""}
                ${canMarkDone ? `<button class="btn-done" data-id="${reqId}" data-action="done">Done</button>` : ""}
            </div>` : ""}
        `;
        adminList.appendChild(card);
    });
};

// Loads every request in the system (regardless of technician) so the admin has full,
// organization-wide visibility. Uses a live listener so new requests, disputes, and
// status changes appear instantly without a page refresh.
const loadAdminRequests = () => {
    if (unsubscribeAdminRequests) return; // already listening, avoid duplicate subscriptions

    unsubscribeAdminRequests = onSnapshot(collection(db, "Requests"), (querySnapshot) => {
        adminRequestsCache = sortDocsByNewest(querySnapshot).map((docSnap) => ({
            id: docSnap.id,
            data: docSnap.data()
        }));

        updateAdminStats(adminRequestsCache);
        renderAdminList();
    }, (error) => {
        console.error("Error loading all requests for admin:", error);
    });
};

// The admin's request cards use the exact same data-action buttons (accept / reject /
// accept-dispute / done) as the technician's, so the same handler and "mark done" popup
// can be reused here instead of duplicating that logic.
if (adminList) adminList.addEventListener("click", handleTechnicianAction);
if (adminSearchInput) adminSearchInput.addEventListener("input", renderAdminList);
if (adminStatusFilter) adminStatusFilter.addEventListener("change", renderAdminList);

// Helper to open/close the "mark done" popup
const toggleDonePopup = (show) => {
    doneWorkPopup.style.display = show ? "flex" : "none";
    if (!show) {
        pendingDoneRequestId = null;
        doneDescInput.value = "";
        doneDescError.classList.remove("show-error");
    }
};

closeDonePopupBtn.addEventListener("click", () => toggleDonePopup(false));
cancelDonePopupBtn.addEventListener("click", () => toggleDonePopup(false));

// Confirms completion of the job: the description is required
confirmDoneBtn.addEventListener("click", async () => {
    const solutionText = doneDescInput.value.trim();

    if (!solutionText) {
        doneDescError.classList.add("show-error");
        return;
    }
    if (!pendingDoneRequestId) {
        toggleDonePopup(false);
        return;
    }

    try {
        confirmDoneBtn.disabled = true;
        await updateDoc(doc(db, "Requests", pendingDoneRequestId), {
            status: "done",
            solution: solutionText,
            completedAt: serverTimestamp()
        });
        toggleDonePopup(false);
        // No manual reload needed: the live listener (onSnapshot) picks up this
        // change automatically and re-renders the pending/active/history lists.
    } catch (error) {
        console.error("Error marking request as done:", error);
        alert("Something went wrong while marking this project as done. Please try again.");
    } finally {
        confirmDoneBtn.disabled = false;
    }
});