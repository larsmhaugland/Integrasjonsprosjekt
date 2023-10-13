document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const groupMembersList = document.querySelector("#group-members-list");
    const editButton = document.getElementById("edit-button");
    const groupNameElement = document.getElementById("group-name");
    let groupNamePass;
    const redirectURL = "../index.html";
    // Global variables and constants
    var groupID;

    // Needed to make it async because getGroupName is async and the fetch in it would not finish before 
    // the group name was set in the html so it became undefined.
    window.onload = async function () {
        const urlParams = new URLSearchParams(window.location.search);
        groupID = urlParams.get('groupID');
        console.log("gruppe id" + groupID);
        if (groupID){
            const groupName = await getGroupName(groupID);
            groupNamePass = groupName;
            groupNameElement.textContent = "Settings for: " + groupName;
            fetchGroupMembers(groupID);
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
    function fetchGroupMembers(groupID) {
        const url = `${API_IP}/group/members?groupID=${encodeURIComponent(groupID)}`;
        fetch(url) 
            .then((response) => response.json())
            .then((data) => {
                renderGroupMembers(data);
            })
            .catch((error) => {
                console.error('Error fetching group members:', error);
                alert("Server error when trying to get group members");
            });
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
        });
    }
});

let handlelisteLink = document.querySelector("#handleliste-link");
handlelisteLink.addEventListener("click", function(event){
    event.preventDefault();
    sendDropdownValue(groupNamePass);
});