import { auth, db, collection, query, where, or, onSnapshot, getDocs, addDoc, signOut, and, serverTimestamp, doc, deleteDoc, updateDoc } from "./firebaseConfig.js";
import { requireAuth } from "./authGuard.js";

// Make sure the user is logged in before showing the chat page
requireAuth();

// ================= Global State =================
let userid = null;
let activeChatUserId = null;
let Users = [];
let messages = [];
let incomingRequests = [];
let unsubscribeMessages = null;
let unsubscribeFriends = null;
let unsubscribeRequests = null;
let selectedMessageID = null;
let selectedMessageText = null;

// ================= DOM Elements =================
const contactName = document.getElementById("contactName");
const appShell = document.getElementById("appShell");
const Contactsdiv = document.getElementById("contactsListContainer");
const chatinp = document.getElementById("chatinp");
const sendbtn = document.getElementById("sendbtn");
const ChatBoxdiv = document.getElementById("chatbox");
const logoutbtn = document.getElementById("logoutbtn");
const backBtn = document.getElementById("mobileBackBtn");
const userProfileHeading = document.getElementById("userProfile");
const updatemsgbtn = document.getElementById("updatemsgbtn");
const deletemsgbtn = document.getElementById("deletemsgbtn");
const searchAccountBtn = document.getElementById("searchAccountbtn");

lucide.createIcons();

// ================= Small Reusable Helpers =================

// Builds the little HTML block used for every contact row (avatar + email)
function contactRowHTML(email) {
    if (!email) {
        email = "Unknown";
    }
    return '<div class="contact-avatar"><i data-lucide="user-round"></i></div>' +
           '<div class="contact-info"><h5>' + email + '</h5></div>';
}

// Creates one contact row element and attaches a click handler to it
function makeContactRow(user, onClickFunction) {
    let userelm = document.createElement("div");
    userelm.className = "userelm";
    userelm.innerHTML = contactRowHTML(user.email);
    userelm.addEventListener("click", onClickFunction);
    return userelm;
}

// Switches the UI into a chat with the given user and loads their messages.
// closeOverlayId is optional - used when opening a chat from the global search page.
function openChat(user, closeOverlayId) {
    activeChatUserId = user.uid;

    if (user.name) {
        contactName.innerText = user.name;
    } else if (user.email) {
        contactName.innerText = user.email;
    } else {
        contactName.innerText = "Unknown";
    }

    if (closeOverlayId) {
        document.getElementById(closeOverlayId).classList.remove("active");
    }

    appShell.classList.add("view-chat");
    getMessages();
}

// ================= Current User Profile =================
function getUIDfromLocalStorage() {
    userid = window.localStorage.getItem("useruid");
}
getUIDfromLocalStorage();

async function getCurrentUserProfile() {
    if (!userid) return;

    try {
        const q = query(collection(db, "Users"), where("uid", "==", userid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            if (userData && userProfileHeading) {
                userProfileHeading.innerText = userData.name || "Your Profile";
            }
        });
    } catch (error) {
        console.error("Error fetching current user profile: ", error);
    }
}
getCurrentUserProfile();

// ================= Friends List (real-time) =================
function trackFriendsList() {
    if (!userid) return;
    if (unsubscribeFriends) unsubscribeFriends();

    const q = query(collection(db, "requests"), where("status", "==", "accepted"));

    unsubscribeFriends = onSnapshot(q, async (snapshot) => {
        const friendUids = new Set();
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.from === userid) friendUids.add(data.to);
            if (data.to === userid) friendUids.add(data.from);
        });

        if (friendUids.size === 0) {
            Users = [];
            renderData();
            return;
        }

        try {
            const usersSnapshot = await getDocs(collection(db, "Users"));
            Users = [];
            usersSnapshot.forEach((docSnap) => {
                const userData = docSnap.data();
                if (friendUids.has(userData.uid)) {
                    Users.push(userData);
                }
            });
            renderData();
        } catch (error) {
            console.error("Error updating local friends cache: ", error);
        }
    });
}

// ================= Incoming Friend Requests (real-time) =================
function trackIncomingRequests() {
    if (!userid) return;
    if (unsubscribeRequests) unsubscribeRequests();

    const q = query(
        collection(db, "requests"),
        where("to", "==", userid),
        where("status", "==", "pending")
    );

    unsubscribeRequests = onSnapshot(q, async (snapshot) => {
        const requestDataArray = [];

        for (const docSnap of snapshot.docs) {
            const requestItem = docSnap.data();
            requestItem.id = docSnap.id;

            const userQuery = query(collection(db, "Users"), where("uid", "==", requestItem.from));
            const userSnapshot = await getDocs(userQuery);

            let senderEmail = "Unknown Account";
            userSnapshot.forEach((uDoc) => {
                senderEmail = uDoc.data().email || uDoc.data().Email || senderEmail;
            });

            requestItem.senderEmail = senderEmail;
            requestDataArray.push(requestItem);
        }

        incomingRequests = requestDataArray;
        updateRequestBadgeUI();
        renderRequestsPageUI();
    });
}

function updateRequestBadgeUI() {
    const menuBtn = document.getElementById("menuActionsBtn");
    if (!menuBtn) return;

    const existingBadge = menuBtn.querySelector(".badge-count");
    if (existingBadge) existingBadge.remove();

    if (incomingRequests.length > 0) {
        const badge = document.createElement("span");
        badge.className = "badge-count";
        badge.style.cssText = "position: absolute; top: 2px; right: 2px; background-color: var(--danger); color: white; border-radius: 50%; width: 8px; height: 8px; font-size: 0px; display: inline-block; border: 1px solid var(--panel-bg);";
        menuBtn.appendChild(badge);
    }
}

// ================= Contacts List UI =================
function renderData() {
    Contactsdiv.innerHTML = "";

    if (!Users || Users.length === 0) {
        Contactsdiv.innerHTML =
            '<div class="no-friends-state" style="padding: 30px 15px; text-align: center; color: var(--wa-text-muted, #8696a0);">' +
                '<i data-lucide="users" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.7;"></i>' +
                '<h5 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 500;">No friends exist</h5>' +
                '<p style="margin: 0; font-size: 13px; line-height: 1.4;">Use the global search button to look up network accounts and send requests.</p>' +
            '</div>';
        lucide.createIcons();
        return;
    }

    for (let i = 0; i < Users.length; i++) {
        const user = Users[i];
        const row = makeContactRow(user, function () {
            openChat(user);
        });
        Contactsdiv.appendChild(row);
    }

    lucide.createIcons();
}

// ================= Messages =================
function getMessages() {
    if (!activeChatUserId || !userid) return;
    if (unsubscribeMessages) unsubscribeMessages();

    const q = query(
        collection(db, "messages"),
        or(
            and(where("from", "==", userid), where("To", "==", activeChatUserId)),
            and(where("from", "==", activeChatUserId), where("To", "==", userid))
        )
    );

    unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
        messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ ID: doc.id, ...doc.data() });
        });

        messages.sort((a, b) => (a.timestamp?.toDate?.() || 0) - (b.timestamp?.toDate?.() || 0));
        renderMessages();
    }, (error) => {
        console.error("Error fetching messages: ", error);
    });
}

function renderMessages() {
    ChatBoxdiv.innerHTML = "";

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const msgElm = document.createElement("div");
        const isOutgoing = msg.from === userid;

        if (isOutgoing) {
            msgElm.className = "message outgoing";
        } else {
            msgElm.className = "message incoming";
        }

        msgElm.onclick = function () {
            if (isOutgoing) {
                selectedMessageID = msg.ID;
                selectedMessageText = msg.text || "";
                sendbtn.style.display = "none";
                chatinp.value = selectedMessageText;
                deletemsgbtn.style.display = "inline";
                updatemsgbtn.style.display = "inline";
            } else {
                selectedMessageID = null;
                selectedMessageText = null;
                deletemsgbtn.style.display = "none";
                updatemsgbtn.style.display = "none";
            }
        };

        // --- UPDATED: Generate content depending on whether it's an image or text ---
        let innerHTMLContent = "";
        if (msg.imageUrl) {
            innerHTMLContent += `<img src="${msg.imageUrl}" style="max-width: 100%; max-height: 250px; display: block; border-radius: 6px; margin-bottom: 4px; object-fit: cover;" alt="Shared Image">`;
        }
        if (msg.text) {
            innerHTMLContent += "<p>" + msg.text + "</p>";
        }
        
        msgElm.innerHTML = innerHTMLContent;
        ChatBoxdiv.appendChild(msgElm);
    }

    ChatBoxdiv.scrollTop = ChatBoxdiv.scrollHeight;
}

async function addMessage() {
    if (!activeChatUserId) {
        alert("Please select a contact to message first!");
        return;
    }

    // Only allow messaging accepted friends
    const isFriend = Users.some((u) => u.uid === activeChatUserId);
    if (!isFriend) {
        alert("Security Lock: You can only send messages to accepted friends!");
        return;
    }

    if (!chatinp.value.trim()) {
        return;
    }

    try {
        await addDoc(collection(db, "messages"), {
            text: chatinp.value,
            To: activeChatUserId,
            from: userid,
            timestamp: serverTimestamp(),
        });
        chatinp.value = "";
    } catch (error) {
        console.error("Error adding message: ", error);
    }
}

sendbtn.addEventListener("click", () => addMessage());

chatinp.addEventListener("keydown", (e) =>  {
    if (e.key === "Enter") {
        addMessage();
    }
});

backBtn.addEventListener("click", () => {
    appShell.classList.remove("view-chat");
});

// ================= Logout =================
function logout() {
    signOut(auth).then(() => {
        window.location.replace("index.html");
    }).catch((error) => {
        console.error("Logout Error: ", error);
    });
}
logoutbtn.addEventListener("click", () => logout());

// ================= Local Contact Search (sidebar) =================
function filterContacts() {
    const currentSearchInput = document.getElementById("globalSearchInput");
    const searchResultsContainer = document.getElementById("searchResultsContainer");
    const searchQuery = currentSearchInput.value.toLowerCase().trim();

    if (searchQuery === "") {
        searchResultsContainer.innerHTML =
            '<div class="search-empty-state">' +
                '<i data-lucide="search" style="width: 32px; height: 32px; color: var(--wa-text-muted);"></i>' +
                '<p>Search for global threads, channels, and records.</p>' +
            '</div>';
        lucide.createIcons();
        return;
    }

    const filteredUsers = Users.filter((user) => {
        const userEmail = (user.email || "").toLowerCase();
        return userEmail.includes(searchQuery);
    });

    if (filteredUsers.length === 0) {
        searchResultsContainer.innerHTML = '<div class="no-results-found" style="padding: 15px; text-align: center; color: gray;"><h5>No contacts found</h5></div>';
        return;
    }

    searchResultsContainer.innerHTML = "";
    for (let i = 0; i < filteredUsers.length; i++) {
        const user = filteredUsers[i];
        const row = makeContactRow(user, function () {
            openChat(user);
        });
        searchResultsContainer.appendChild(row);
    }
    lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", function () {
    const contactsContainer = document.getElementById("contacts");
    const triggerBox = document.getElementById("searchTriggerBox");
    const closeSearchBtn = document.getElementById("closeSearchBtn");
    const currentSearchInput = document.getElementById("globalSearchInput");
    const searchResultsContainer = document.getElementById("searchResultsContainer");

    if (triggerBox && contactsContainer && closeSearchBtn && currentSearchInput) {
        triggerBox.addEventListener("click", function () {
            contactsContainer.classList.add("search-mode-active");
            setTimeout(() => currentSearchInput.focus(), 50);
        });

        closeSearchBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            contactsContainer.classList.remove("search-mode-active");
            currentSearchInput.value = "";

            if (searchResultsContainer) {
                searchResultsContainer.innerHTML =
                    '<div class="search-empty-state">' +
                        '<i data-lucide="search" style="width: 32px; height: 32px; color: var(--wa-text-muted);"></i>' +
                        '<p>Search for global threads, channels, and records.</p>' +
                    '</div>';
                lucide.createIcons();
            }

            renderData();
        });

        currentSearchInput.addEventListener("input", filterContacts);
    }

    injectGlobalRequestsOverlayDOM();
    trackFriendsList();
    trackIncomingRequests();
});

// ================= Edit / Delete Messages =================
async function deleteMessage() {
    try {
        await deleteDoc(doc(db, "messages", selectedMessageID));
        renderMessages();
        deletemsgbtn.style.display = "none";
        updatemsgbtn.style.display = "none";
        sendbtn.style.display = "inline";
    } catch (error) {
        console.log(error);
    }
}
deletemsgbtn.addEventListener("click", () => deleteMessage());

async function updateMessage() {
    try {
        if (chatinp.value.trim() === "") {
            updatemsgbtn.style.display = "none";
            deletemsgbtn.style.display = "none";
            sendbtn.style.display = "inline";
            return;
        }

        const messageRef = doc(db, "messages", selectedMessageID);
        await updateDoc(messageRef, {
            text: chatinp.value,
            timestamp: serverTimestamp(),
        });

        renderMessages();
        chatinp.value = "";
        updatemsgbtn.style.display = "none";
        deletemsgbtn.style.display = "none";
        sendbtn.style.display = "inline";
    } catch (error) {
        console.log(error);
    }
}
updatemsgbtn.addEventListener("click", ()=> updateMessage());

// ================= Friend Requests =================
async function sendFriendRequest(targetUser, buttonElm) {
    const originalContent = buttonElm.innerHTML;
    buttonElm.disabled = true;
    buttonElm.innerHTML = '<span class="btn-spinner btn-spinner-light"></span>';

    try {
        const checkQuery = query(
            collection(db, "requests"),
            and(
                or(
                    and(where("from", "==", userid), where("to", "==", targetUser.uid)),
                    and(where("from", "==", targetUser.uid), where("to", "==", userid))
                ),
                where("status", "in", ["pending", "accepted"])
            )
        );

        const snapshot = await getDocs(checkQuery);
        if (!snapshot.empty) {
            const existingData = snapshot.docs[0].data();
            if (existingData.status === "accepted") {
                alert("You are already friends with this user!");
            } else {
                alert("A pending friend request already exists between these accounts.");
            }
            buttonElm.disabled = false;
            buttonElm.innerHTML = originalContent;
            return;
        }

        await addDoc(collection(db, "requests"), {
            from: userid,
            to: targetUser.uid,
            status: "pending",
            timestamp: serverTimestamp(),
        });
        
        alert("request sended successfully");
    } catch (error) {
        console.error("Error sending request: ", error);
        alert("Failed to send request.");
    } finally {
        buttonElm.disabled = false;
        buttonElm.innerHTML = originalContent;
    }
}

// ================= Global Account Search =================
async function filterAccountsFromDB() {
    const searchInput = document.getElementById("globalAccountSearchInput");
    const resultsContainer = document.getElementById("globalAccountResultsContainer");
    const searchQuery = searchInput.value.toLowerCase().trim();

    if (searchQuery === "") {
        resultsContainer.innerHTML =
            '<div class="search-empty-state">' +
                '<i data-lucide="users" style="width: 48px; height: 48px; color: var(--wa-text-muted); margin-bottom: 8px;"></i>' +
                '<p>Type a profile email to look up global network accounts.</p>' +
            '</div>';
        lucide.createIcons();
        return;
    }

    try {
        const q = query(
            collection(db, "Users"),
            where("email", ">=", searchQuery),
            where("email", "<=", searchQuery + "\uf8ff")
        );

        const querySnapshot = await getDocs(q);
        resultsContainer.innerHTML = "";

        let visibleMatchesCount = 0;

        querySnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            if (user.uid === userid) return;

            visibleMatchesCount++;

            const userelm = document.createElement("div");
            userelm.className = "userelm";
            userelm.style.display = "flex";
            userelm.style.alignItems = "center";
            userelm.style.justifyContent = "space-between";
            userelm.style.width = "100%";

            userelm.innerHTML =
                '<div class="contact-clickable-area" style="display: flex; flex-grow: 1; align-items: center; cursor: pointer;">' +
                    contactRowHTML(user.email) +
                '</div>' +
                '<button class="request-btn" style="padding: 6px 14px; margin-right: 10px; border: none; background-color: #007bff; color: #fff; border-radius: 4px; font-weight: 500; cursor: pointer;">' +
                    'Request' +
                '</button>';

            userelm.querySelector(".contact-clickable-area").addEventListener("click", function () {
                const isFriend = Users.some((u) => u.uid === user.uid);
                if (!isFriend) {
                    alert("You can only open chats with accepted friends. Please send a request instead!");
                    return;
                }
                openChat(user, "globalAccountSearchPage");
            });

            const reqBtn = userelm.querySelector(".request-btn");
            reqBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                sendFriendRequest(user, reqBtn);
            });

            resultsContainer.appendChild(userelm);
        });

        if (visibleMatchesCount === 0) {
            resultsContainer.innerHTML =
                '<div class="no-results-found" style="padding: 20px; text-align: center; color: var(--wa-text-muted);">' +
                    '<h5>No accounts found matching "' + searchInput.value + '"</h5>' +
                '</div>';
            return;
        }

        lucide.createIcons();
    } catch (error) {
        console.error("Error running database global query lookup: ", error);
    }
}

function searchAccount() {
    const searchPage = document.getElementById("globalAccountSearchPage");
    const searchInput = document.getElementById("globalAccountSearchInput");

    searchPage.classList.add("active");
    setTimeout(() => searchInput.focus(), 50);
}
searchAccountBtn.addEventListener("click", ()=> searchAccount());

document.getElementById("closeGlobalSearchBtn").addEventListener("click", () => {
    const searchPage = document.getElementById("globalAccountSearchPage");
    const searchInput = document.getElementById("globalAccountSearchInput");
    const resultsContainer = document.getElementById("globalAccountResultsContainer");

    searchPage.classList.remove("active");
    searchInput.value = "";

    resultsContainer.innerHTML =
        '<div class="search-empty-state">' +
            '<i data-lucide="users" style="width: 48px; height: 48px; color: var(--wa-text-muted); margin-bottom: 8px;"></i>' +
            '<p>Type a profile email to look up global network accounts.</p>' +
        '</div>';
    lucide.createIcons();
});

document.getElementById("globalAccountSearchInput").addEventListener("input", filterAccountsFromDB);

// ================= Requests Overlay Page =================
function injectGlobalRequestsOverlayDOM() {
    if (document.getElementById("globalRequestsPage")) return;

    const overlay = document.createElement("div");
    overlay.className = "full-page-search-view";
    overlay.id = "globalRequestsPage";
    overlay.innerHTML =
        '<div class="fps-header">' +
            '<div class="fps-header-content">' +
                '<button class="icon-btn" id="closeRequestsBtn" title="Close Page">' +
                    '<i data-lucide="arrow-left" style="width: 24px; height: 24px; color: var(--wa-teal);"></i>' +
                '</button>' +
                '<h3 style="color: var(--wa-text-main); font-size: 18px; font-weight: 500;">Connection Requests</h3>' +
            '</div>' +
        '</div>' +
        '<div class="fps-results-container">' +
            '<div class="fps-results-content" id="requestsResultsContainer" style="padding: 10px 0;">' +
                '<div class="search-empty-state">' +
                    '<i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--wa-text-muted); margin-bottom: 8px;"></i>' +
                    '<p>No incoming connection requests available.</p>' +
                '</div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    document.getElementById("closeRequestsBtn").addEventListener("click", function () {
        overlay.classList.remove("active");
    });

    // --- FIXED: Changed "requestOptionBtn" to "openRequestsOverlayBtn" ---
    const openRequestsBtn = document.getElementById("openRequestsOverlayBtn");
    if (openRequestsBtn) {
        openRequestsBtn.addEventListener("click", function (e) {
            e.preventDefault();
            overlay.classList.add("active");

            const dropdownContent = document.querySelector(".dropdown-content");
            if (dropdownContent) {
                dropdownContent.style.opacity = "0";
                dropdownContent.style.visibility = "hidden";

                setTimeout(() => {
                    dropdownContent.style.opacity = "";
                    dropdownContent.style.visibility = "";
                }, 200);
            }
        });
    }
}

function renderRequestsPageUI() {
    const container = document.getElementById("requestsResultsContainer");
    if (!container) return;

    if (incomingRequests.length === 0) {
        container.innerHTML =
            '<div class="search-empty-state" style="padding: 40px 20px; text-align: center;">' +
                '<i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--wa-text-muted); margin-bottom: 8px; opacity: 0.6;"></i>' +
                '<p style="color: var(--wa-text-muted);">No pending incoming connection requests available.</p>' +
            '</div>';
        lucide.createIcons();
        return;
    }

    container.innerHTML = "";

    for (let i = 0; i < incomingRequests.length; i++) {
        const req = incomingRequests[i];
        const item = document.createElement("div");
        item.className = "userelm";
        item.style.cssText = "display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 20px;";
        
        item.innerHTML =
            '<div style="display: flex; align-items: center; gap: 12px;">' +
                '<div class="contact-avatar">' +
                    '<i data-lucide="user-round"></i>' +
                '</div>' +
                '<div class="contact-info">' +
                    '<h5 style="margin: 0; font-size: 15px;">' + req.senderEmail + '</h5>' +
                '</div>' +
            '</div>' +
            '<div style="display: flex; gap: 8px; align-items: center;">' +
                '<button class="accept-req-btn" style="padding: 6px 14px; border: none; background-color: #111b21; color: #fff; border-radius: 4px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 75px; min-height: 31px;">Accept</button>' +
                '<button class="reject-req-btn" style="padding: 6px 14px; border: 1px solid var(--border-line); background-color: #fff; color: var(--text-muted); border-radius: 4px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 75px; min-height: 31px;">Decline</button>' +
            '</div>';

        const acceptBtn = item.querySelector(".accept-req-btn");
        const rejectBtn = item.querySelector(".reject-req-btn");

        acceptBtn.addEventListener("click", function () {
            handleRequestAction(req.id, "accepted", acceptBtn);
        });
        rejectBtn.addEventListener("click", function () {
            handleRequestAction(req.id, "rejected", rejectBtn);
        });

        container.appendChild(item);
    }

    lucide.createIcons();
}

async function handleRequestAction(requestId, nextStatus, buttonElm) {
    const originalContent = buttonElm.innerHTML;
    buttonElm.disabled = true;
    
    const isAccept = nextStatus === "accepted";
    const spinnerClass = isAccept ? "btn-spinner-light" : "btn-spinner-dark";
    buttonElm.innerHTML = `<span class="btn-spinner ${spinnerClass}"></span>`;

    try {
        const reqRef = doc(db, "requests", requestId);
        if (nextStatus === "accepted") {
            await updateDoc(reqRef, { status: "accepted" });
            alert("Connection request accepted!");
        } else {
            await deleteDoc(reqRef);
            alert("Request declined.");
        }
    } catch (error) {
        console.error("Error resolving request: ", error);
        buttonElm.disabled = false;
        buttonElm.innerHTML = originalContent;
    }
}
//working on image upload and sending it as a message
async function sendImageMessage(base64Data) {
    if (!activeChatUserId) {
        alert("Please select a contact to message first!");
        return;
    }

    const isFriend = Users.some((u) => u.uid === activeChatUserId);
    if (!isFriend) {
        alert("Security Lock: You can only send messages to accepted friends!");
        return;
    }

    try {
        await addDoc(collection(db, "messages"), {
            text: "",
            imageUrl: base64Data, // Stores base64 binary directly inside message document
            To: activeChatUserId,
            from: userid,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error uploading image message: ", error);
        alert("Failed to send image message.");
    }
}

// ================= DOM Initialization Setup & Event Hooks =================
document.addEventListener("DOMContentLoaded", function () {
    const contactsContainer = document.getElementById("contacts");
    const triggerBox = document.getElementById("searchTriggerBox");
    const closeSearchBtn = document.getElementById("closeSearchBtn");
    const currentSearchInput = document.getElementById("globalSearchInput");
    const searchResultsContainer = document.getElementById("searchResultsContainer");

    if (triggerBox && contactsContainer && closeSearchBtn && currentSearchInput) {
        triggerBox.addEventListener("click", function () {
            contactsContainer.classList.add("search-mode-active");
            setTimeout(() => currentSearchInput.focus(), 50);
        });

        closeSearchBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            contactsContainer.classList.remove("search-mode-active");
            currentSearchInput.value = "";

            if (searchResultsContainer) {
                searchResultsContainer.innerHTML =
                    '<div class="search-empty-state">' +
                        '<i data-lucide="search" style="width: 32px; height: 32px; color: var(--wa-text-muted);"></i>' +
                        '<p>Search for global threads, channels, and records.</p>' +
                    '</div>';
                lucide.createIcons();
            }

            renderData();
        });

        currentSearchInput.addEventListener("input", filterContacts);
    }

    // --- Native Attachment Hardware Device Hooks ---
    const attachBtn = document.getElementById('attachBtn');
    const imageUploadInp = document.getElementById('imageUploadInp');

    if (attachBtn && imageUploadInp) {
        attachBtn.addEventListener('click', () => {
            imageUploadInp.click();
        });

        imageUploadInp.addEventListener('change', (e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) {
                if (!selectedFile.type.startsWith('image/')) {
                    alert('Please select a valid image file.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    sendImageMessage(event.target.result);
                };
                reader.readAsDataURL(selectedFile);
                
                // Clear state so same image can be sent sequentially if desired
                imageUploadInp.value = "";
            }
        });
    }

    injectGlobalRequestsOverlayDOM();
    trackFriendsList();
    trackIncomingRequests();
});