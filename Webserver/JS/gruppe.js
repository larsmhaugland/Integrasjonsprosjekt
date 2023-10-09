const groupMembersList = document.querySelector("#group-members-list");
//const API_IP = "https://" + window.location.hostname + ":8080";
const editButton = document.getElementById("edit-button");

const tmpGroupID = "ysS2hJ2C5qhLBZC0k5DU";
var groupID;

window.onload = function () {
    groupID = tmpGroupID; 
    fetchGroupMembers(groupID);
};

// Add a click event listener to the button
editButton.addEventListener("click", function () {
    // Construct the URL with the groupID parameter
    const url = `groupSettings.html?groupID=${encodeURIComponent(groupID)}`;
    // Redirect to the groupSettings.html page with the groupID parameter
    window.location.href = url;
});

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