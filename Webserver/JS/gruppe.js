document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const groupMembersList = document.querySelector("#group-members-list");
    const editButton = document.querySelector("#edit-button");
    const groupNameElement = document.querySelector("#group-name");
    const handlelisteLink = document.querySelector("#handleliste-link");
    const kalenderLink = document.querySelector("#kalender-link");
    const chatLink = document.querySelector("#chat-link");
    const LoggedInUsername = sessionStorage.getItem("username");
    let groupNamePass;
    let GroupOwner;
    const Administrators = [];
    const redirectURL = "../index.html";
    // Global variables and constants
    var groupID;

    // Needed to make it async because getGroupName is async and the fetch in it would not finish before 
    // the group name was set in the html so it became undefined.
    // TODO: Fix this to use window.onload without crashing with the window.onload in JS.js
    onPageReloadGroup()
    async function onPageReloadGroup() {
        const urlParams = new URLSearchParams(window.location.search);
        groupID = urlParams.get('groupID');
        if (groupID){
            const groupName = await getGroupName(groupID);
            groupNamePass = groupName;
            groupNameElement.textContent = "Instillinger for: " + groupName;
            await fetchGroupMembers(groupID);
            displayEditIfOwner()
        } else {
            alert("No groupID was passed to the groupSettings.html page");
            window.location.href = redirectURL;
        }
    };

    // Add a click event listener to the button
    editButton.addEventListener("click", function () {
        // Construct the URL with the groupID parameter
        const url = `groupSettings.html?groupID=${encodeURIComponent(groupID)}`;
        // Redirect to the groupSettings.html page with the groupID parameter
        window.location.href = url;
    });

    handlelisteLink.addEventListener("click", function () {
        const url = `../Handleliste/index.html?groupID=${encodeURIComponent(groupID)}`;
        window.location.href = url;
    });

    kalenderLink.addEventListener("click", function () {
        const url = `../Kalender/index.html?groupID=${encodeURIComponent(groupID)}`;
        window.location.href = url;
    });

    chatLink.addEventListener("click", function () {
        const url = `../Chat/index.html?groupID=${encodeURIComponent(groupID)}`;
        window.location.href = url;
    });

    // Needs to be async because it uses await to wait for the response from the server before returning the data.
    async function getGroupName(groupID){
        const url = `${API_IP}/group/groupName?groupID=${groupID}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error:", error);
            alert("Server error occurred, could not get the group name.");
        }
    }

    // Function to fetch group members data
    async function fetchGroupMembers(groupID) {
        const url = `${API_IP}/group/members?groupID=${encodeURIComponent(groupID)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error with request to endpoint. Status: ${response.status}`);
            }
            const data = await response.json();
            renderGroupMembers(data); // Move this line here to wait for the fetch operation to complete
        } catch (error) {
            console.error('Error fetching group members:', error);
            alert("Server error when trying to get group members");
        }
    } 

    // Function to render the group members based on the retrieved data
    function renderGroupMembers(groupMembers) {
        // Clear existing members (if any)
        groupMembersList.innerHTML = '';

        // Iterate through the group members and create the corresponding list items
        groupMembers.forEach((member) => {
            const listItem = document.createElement('li');

            // Create the members image
            const img = document.createElement('img');
            img.src = '../Images/person-icon-transparent.png';
            img.alt = `Member ${member.username}`;

            // Create the members name as a span element
            const span = document.createElement('span');
            span.textContent = member.username;

            // Append the elements to the list item
            listItem.appendChild(img);
            listItem.appendChild(span);

            // Append the list item to the group members list
            groupMembersList.appendChild(listItem);

            if (member.roleName.toLowerCase() === "owner"){
                GroupOwner = member.username;
            }
            if (member.roleName.toLowerCase() === "administrator"){
                Administrators.push(member.username);
            }
        });
    }
    function displayEditIfOwner(){
        console.log("GroupOwner: " + GroupOwner);
        if (LoggedInUsername === GroupOwner || Administrators.includes(LoggedInUsername)){
            editButton.style.display = "block";
        }
    }
});
