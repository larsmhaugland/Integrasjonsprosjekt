// Wrapping in document.addEventListener("DOMContentLoaded") ensures that the code will run after
// the HTML document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    
    // DOM elements
    const modal = document.querySelector("#search-member-modal");
    //const openAddMemberButton = document.querySelector("#add-member-btn");
    const closeModalButton = modal.querySelector(".close");
    const searchInput = modal.querySelector("#search-input");
    const memberSuggestionsList = modal.querySelector(".member-suggestions");
    const groupMembersListSettings = document.querySelector("#group-members-list-settings");
    const deleteGroupButton = document.querySelector("#delete-group");
    const LoggedInUsername = sessionStorage.getItem("username");
    const groupNameElement = document.querySelector("#group-name");
    const leaveGroupButton = document.querySelector("#leave-group");

    // Global variables and constants
   // let selectElementValue = "member";
    //const roleDropdownMenu = document.querySelectorAll("#role-dropdown");
    const tmpGroupID = "ysS2hJ2C5qhLBZC0k5DU";
    const roles = ['Owner', 'Administrator', 'Member'];
    var groupID;
    var GroupOwner;
    var groupName;
    const Administrators = [];

    // Needed to make it async because getGroupName is async and the fetch in it would not finish before 
    // the group name was set in the html so it became undefined.
    window.onload = async function () {
        groupID = tmpGroupID; 
        const groupName = await getGroupName(groupID);
        groupNameElement.textContent = "Settings for: " + groupName;
        fetchGroupMembers(groupID);
    };
    
    // Open the modal when the button is clicked
   /* openAddMemberButton.addEventListener('click', function () {
        modal.style.display = "block";
    });*/

    // Close the modal when the close button is clicked
    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    deleteGroupButton.addEventListener("click", function(){
        deleteGroup(groupID)
    })
    
    leaveGroupButton.addEventListener("click", function(){
        leaveGroup(groupID)
    });

    // Function to retrieve URL parameter by name
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    }


    function leaveGroup(groupID) {
        const url = `${API_IP}/group/leaveGroup?groupID=${groupID}&username=${LoggedInUsername}`;
        const redirectURL = "../index.html";
        if (LoggedInUsername == GroupOwner){
            alert("Eieren kan ikke forlate gruppa.");
            return;
        }
        const confirmation = window.confirm("Er du sikker på at du vil forlate gruppa?");
        if (!confirmation){
            return;
        } 
        // Send a DELETE request to the server
        fetch(url, {
            method: "DELETE",
        })
        .then((response) => {
            if (response.status === 200) {
                alert("Du forlot gruppa.");
                window.location.href = redirectURL;
            } else {
                alert("Serverfeil med å forlate gruppe.");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Server error occured, could not leave the group.");
        });
    }

    /**
     * Sends a DELETE request to the backend endpoint, that deletes the group specified
     * @param {*} groupID - ID of the group to be deleted.
     * @returns 
     */
    function deleteGroup(groupID) {
        const url = `${API_IP}/group/deleteGroup?groupID=${groupID}`;
        const redirectURL = "../index.html";
        if (LoggedInUsername != GroupOwner){
            alert("Only the owner can delete the group");
            return;
        }
        const confirmation = window.confirm("Er du sikker på at du vil slette gruppa?");
        if (!confirmation){
            return;
        } 
        // Send a DELETE request to the server
        fetch(url, {
            method: "DELETE",
        })
        .then((response) => {
            if (response.status === 200) {
                alert("Group deleted successfully.");
                window.location.href = redirectURL;
            } else {
                alert("Error deleting group.");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Server error occured, could not delete the group.");
        });
    }

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


    // Handle search input changes
    searchInput.addEventListener("input", function () {
        const query = searchInput.value.trim();
        console.log("Query is: " + query);
        if (query.length === 0) {
            return;
        }
        const url = `${API_IP}/user/search?partialUsername=${query}`;
        // Send a GET request to the firestore database via GO
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Update the member suggestions list with the results
                updateMemberSuggestions(data);
            })
            .catch(error => {
                console.error("Error fetching search results from database:", error);
            });
    });

    /**
     * Updates the suggestions for members to add after the user have entered in partial or full
     * username of the person they wish to add to their group
     * @param {*} results - The usernames of the users that corresponded to the search
     */
    function updateMemberSuggestions(results) {

        // Clear existing suggestions
        while (memberSuggestionsList.firstChild) {
            memberSuggestionsList.removeChild(memberSuggestionsList.firstChild);
        }

        // If there were no matching members dsiplay a message to the user
        if (results.length === 0) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.textContent = "No matching results found.";
            memberSuggestionsList.appendChild(noResultsMessage);
            return;
        }
        
        // Populate the suggestions list with results
        results.forEach(function (username) {
        const listItem = document.createElement("li");

        // Create the image element
        const image = document.createElement("img");
        image.src = "../Images/person-icon-transparent.png";
        image.alt = username;

        // Create the span element for the username
        const usernameSpan = document.createElement("span");
        usernameSpan.textContent = username;

        // Create the button for adding the member
        const addButton = document.createElement("button");
        addButton.className = "add-member-btn2";

        const addImage = document.createElement("img");
        addImage.src = "../Images/add-icon.png";
        addImage.alt = "Add member";

        addButton.appendChild(addImage);

        // Add an event listener to handle adding a member to the group when clicking the icon
        addButton.addEventListener("click", function () {
            const username = addButton.parentElement.querySelector("span").textContent;
            const groupID = tmpGroupID; // TODO: Must be changed to the actual dynamic groupID
            addMemberToGroup(username, groupID);
        });

        // Append the elements to the list item
        listItem.appendChild(image);
        listItem.appendChild(usernameSpan);
        listItem.appendChild(addButton);

        memberSuggestionsList.appendChild(listItem);
    });
    }

    /**
     * Adds the correct user to the group by sending a POST request to the backend that
     * then communicates and correctly adds the user to the group in the database.
     * @param {*} username - username for the user to be added to the group
     * @param {*} groupID - ID of the group the user will be added to
     */
    function addMemberToGroup(username, groupID) {
        if (LoggedInUsername != GroupOwner && !Administrators.includes(LoggedInUsername)){
            alert("Only an owner or administrator can add a member to the group");
            return;
        }
        const url = `${API_IP}/group/members`;
        
        // Request body with the information needed for the backend to correctly add member to group
        const requestBody = JSON.stringify({
            username: username,
            groupID: groupID,
        });
        // Send a POST request to the backend f
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: requestBody,
        })
        .then((response) => {
            if (response.status === 200) {
                // Member added successfully
                alert("Member added to the group successfully");
                location.reload();
            } else {
                alert("Error adding member to the group");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Server error when trying to add the user to the group")
        });
    }

    /**
     * Sends a GET request to the backend endpoint to retrieve the data for the group members
     * @param {*} groupID - the group to retrieve the members from
     */
    function fetchGroupMembers(groupID) {
    const url = `${API_IP}/group/members?groupID=${encodeURIComponent(groupID)}`;
    fetch(url) 
        .then((response) => response.json())
        .then((data) => {
            renderGroupMembers(data)
        })
        .catch((error) => {
            console.error('Error fetching group members:', error);
            alert("Error when trying to get the group members from the databse")
        });
    } 

    
    /**
     * Creates all the html elements to render for each group memeber and also gives them the correct
     * values and initializes eventlisteners where needed.
     * @param {*} groupMembers - the members of the group with their corresponding data fields
     */
    function renderGroupMembers(groupMembers) {

        // Clear existing members (if any)
        if (groupMembersListSettings) {
            while (groupMembersListSettings.firstChild) {
                groupMembersListSettings.removeChild(groupMembersListSettings.firstChild);
            }
        } else {
            // Handle the case where groupMembersList is null or doesn't exist
            console.error("groupMembersListSettings is null or doesn't exist.");
        }

        // Iterate through the group members and create the corresponding list items
        groupMembers.forEach((member) => {
            const listItem = document.createElement('li');
            const img = document.createElement('img');
            img.src = '../Images/person-icon-transparent.png';
            img.alt = `Member ${member.username}`;

            // Create the member's username as a span element
            const span = document.createElement('span');
            span.textContent = member.username;

            // Create the role dropdown
            const select = document.createElement('select');
            select.className = 'role-dropdown';

            roles.forEach((role) => {
                const option = document.createElement('option');
                option.value = role.toLowerCase(); // Use lowercase value for consistency
                option.textContent = role;
                select.appendChild(option);
            });
            
            // To store the value before it is changed in case member trying to update is not Owner
            select.addEventListener('focus', () => {
                initialValue = select.value;
            });

            select.addEventListener('change', (event) => {
                // Get the selected role from the dropdown menu
                const selectedRole = event.target.value;

                // Get the username for the member
                const parentElement = select.parentElement;
                const username = parentElement.querySelector("span").textContent;
                
                updateRoleForMember(username, selectedRole, initialValue);
            })
            
            // Set the selected option based on the member's role
            select.value = member.roleName.toLowerCase(); 
            
            if (member.roleName.toLowerCase() === "owner"){
                GroupOwner = member.username;
            }
            if (member.roleName.toLowerCase() === "administrator"){
                Administrators.push(member.username);
            }
             // Create the delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Fjern medlem';
            deleteButton.className = 'delete-member-button';

            // Add an event listener to handle member deletion
            deleteButton.addEventListener('click', () => {
                deleteMember(member.username);
            });

            // Append the elements to the list item
            listItem.appendChild(img);
            listItem.appendChild(span);
            listItem.appendChild(select);
            listItem.appendChild(deleteButton);

            // Append the list item to the group members list
            groupMembersListSettings.appendChild(listItem);
        });
        const addMemberButton = document.createElement('button');
        addMemberButton.textContent = 'Legg til medlem';
        addMemberButton.id = 'add-member-btn';
        addMemberButton.addEventListener('click', function () {
            modal.style.display = "block";
        });
        groupMembersListSettings.appendChild(addMemberButton);
    }

    /**
     * Sends a DELETE request to the backend with the username of the user to delete from the group
     * @param {*} username username to delete from the group
     */
    function deleteMember(username) {
        if (LoggedInUsername != GroupOwner && !Administrators.includes(LoggedInUsername)){
            alert("Only an owner or administrator can add a member to the group");
            return;
        }
        const groupID = tmpGroupID; // TODO get current group id
        const url = `${API_IP}/group/members?groupID=${encodeURIComponent(groupID)}&username=${encodeURIComponent(username)}`;
    
        fetch(url, {
            method: 'DELETE', // HTTP Delete method
        })
            .then((response) => {
                if (response.status === 200) {
                    // Member deleted successfully
                    alert(`Member ${username} deleted from the group.`);
                    // Update the group display
                    fetchGroupMembers(groupID);
                } else {
                    alert(`Error deleting member ${username} from the group.`);
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("Server error when trying to delete the user from the datbase");
            });
    }

    /**
     * Sends the PATCH request to the backend endpoint to update the role for the specficied user
     * @param {*} username - username to update the role for
     * @param {*} newRole - new role for the username
     */
    function updateRoleForMember(username, newRole, initialValue){
        console.log("GroupOwner: " + GroupOwner);
        console.log("LoggedInUsername: " + LoggedInUsername);
        if (LoggedInUsername != GroupOwner && !Administrators.includes(LoggedInUsername)){
            // Get the list items inside the ul element
            const listItems = groupMembersListSettings.querySelectorAll("li");
            listItems.forEach((listItem) => {
                // Find the Span and Select elements inside the list item
                const usernameSpan = listItem.querySelector("span");
                const roleSelect = listItem.querySelector(".role-dropdown");

                // Get the username from the Span element
                const nameForElement = usernameSpan.textContent;

                // Check if the username matches the target username
                if (nameForElement === username) {
                    // Set the Select element value to the initial value
                    roleSelect.value = initialValue;
                }
            });
            alert("Only the owner can update the role of a member");
            return;
        }
        const groupID = tmpGroupID// TODO dynamic group id
        const url = `${API_IP}/group/members?username=${encodeURIComponent(username)}&newRole=${encodeURIComponent(newRole)}&groupID=${encodeURIComponent(groupID)}`
        fetch(url, {
            method: 'PATCH',
        })
            .then((response) => {
                if (response.status === 200) {
                    console.log("Role of group member updated");
                } else {
                    alert("Server error when trying to update the role");
                }
            })
            .catch((error) =>{
                console.error("Error", error);
                alert("Server error when trying to update the role");
            })
    }
});

