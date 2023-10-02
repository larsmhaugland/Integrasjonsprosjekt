const groupMembersList = document.querySelector("#group-members-list");

window.onload = function () {
    const groupID = 'your_group_id'; // TODO dynamic group id
    const renderGroup1 = false;
    fetchGroupMembers(groupID, false);
};

// Function to fetch group members data
function fetchGroupMembers(groupID) {
    const url = `/group/members?groupID=${encodeURIComponent(groupID)}`;
    fetch(url) 
        .then((response) => response.json())
        .then((data) => {
            renderGroupMembers(data);
        })
        .catch((error) => {
            console.error('Error fetching group members:', error);
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