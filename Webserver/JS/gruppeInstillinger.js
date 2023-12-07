/* jshint esversion: 8 */
// Wrapping in document.addEventListener("DOMContentLoaded") ensures that the code will run after
// the HTML document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    
    // DOM elements
    const modal = document.querySelector("#search-member-modal");
    const popupContent = document.querySelector(".popup");
    const closeModalButton = modal.querySelector(".close-modal");
    const searchInput = modal.querySelector("#search-input");
    const memberSuggestionsList = modal.querySelector(".member-suggestions");
    const groupMembersListSettings = document.querySelector("#group-members-list-settings");
    const deleteGroupButton = document.querySelector("#delete-group");
    const LoggedInUsername = sessionStorage.getItem("username");
    const groupNameElement = document.querySelector("#group-name");
    const leaveGroupButton = document.querySelector("#leave-group");

    // Global variables and constants
    const roles = ['Owner', 'Administrator', 'Member'];
    let groupID;
    let GroupOwner;
    let groupName;
    const Administrators = [];
    const redirectURL = "../index.html";
    const initialDropdownValues = {};

    onPageReload();

    /**
     * Function that runs when the page is loaded. It retrieves the groupID from the URL parameter,
     * then uses the groupID to retrieve the group name and the group members. It also hides the leave
     * group button if the user is the owner of the group and displays the delete group button if the user
     * is the owner of the group.
     */
    async function onPageReload() {
        const urlParams = new URLSearchParams(window.location.search);
        groupID = urlParams.get('groupID');
        if (groupID){
            groupName = await getGroupName(groupID);
            groupNameElement.textContent = "Innstillinger for: " + groupName;
            await fetchGroupMembers(groupID);
            hideLeaveIfOwner();
            displayDeleteIfOwner();
        } else {
            alert("No groupID was passed to the groupSettings.html page");
            window.location.href = redirectURL;
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

    // Close the modal when the close button is clicked
    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
        popupContent.style.display = "none";
    });

    // Delete the group when the deleteGroupButton is clicked
    deleteGroupButton.addEventListener("click", function(){
        deleteGroup(groupID);
    });
    
    // Leave the group when the leaveGroupButton is clicked
    leaveGroupButton.addEventListener("click", function(){
        leaveGroup(groupID);
    });

    /**
     * Removes the active user from the group by sending a delete request to the backend API with the
     * appropriate username and groupID
     * @param {string} groupID - Unique identifier of the group to leave
     * @returns {void}
     */
    function leaveGroup(groupID) {
        const url = `${API_IP}/group/leaveGroup?groupID=${groupID}&username=${LoggedInUsername}`;
        
        // URL the user is sent to after leaving the group
        const redirectURL = "../index.html";
        
        if (LoggedInUsername === GroupOwner){
            alert("Eieren kan ikke forlate gruppa.");
            return;
        }

        // Make sure the user intended to leave the group
        if (!window.confirm("Er du sikker på at du vil forlate gruppa?")){
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
     * Deletes a group based on the provided group ID. Only the owner of the group
     * can perform this action.
     * @param {string} groupID - TRhe unique identifier of the group to delete
     * @returns {void}
     */
    function deleteGroup(groupID) {
        
        const url = `${API_IP}/group/deleteGroup?groupID=${groupID}`;

        // URL to send the user to after deleting the group
        const redirectURL = "../index.html";

        // Only owner can delete the group
        if (LoggedInUsername !== GroupOwner){
            alert("Only the owner can delete the group");
            return;
        }
        
        // Make sure the owner intended to delete the group
        if (!window.confirm("Er du sikker på at du vil slette gruppa?")){
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
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Server error occured, could not delete the group.");
        });
    }

    /**
     * Gets the name of the group from the database based on the provided group ID
     * @asyn - To make sure that the function waits for the response from the server
     * @param {string} groupID - The unique identifier of the group to get the name for
     * @returns {string} - The name of the group
     */
    async function getGroupName(groupID){
        const url = `${API_IP}/group/groupName?groupID=${groupID}`;
        
        try {
            // Send a GET request to the server
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            // Return the name of the group
            return await response.json();
        } catch (error) {
            console.error("Error:", error);
            alert("Server error occurred, could not get the group name.");
        }
    }

    /**
     * Updates the suggestions for members to add after the user have entered in partial or full
     * username of the person they wish to add to their group
     * @param {*} results - The usernames of the users that corresponded to the search
     * @returns {void}
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
            const addButton = document.createElement("a");
            addButton.className = "add-member-btn2";

            const addImage = document.createElement("img");
            addImage.src = "../Images/add-icon.png";
            addImage.alt = "Add member";

            addButton.appendChild(addImage);

            // Add an event listener to handle adding a member to the group when clicking the icon
            addButton.addEventListener("click", function () {
                const username = addButton.parentElement.querySelector("span").textContent;
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
     * @returns {void}
     */
    function addMemberToGroup(username, groupID) {
        
        // Only owner and administrators can add members to the group
        if (LoggedInUsername !== GroupOwner && !Administrators.includes(LoggedInUsername)){
            alert("Only an owner or administrator can add a member to the group");
            return;
        }

        // URL for the backend endpoint
        const url = `${API_IP}/group/members`;
        
        // Request body with the information needed for the backend to correctly add member to group
        const requestBody = JSON.stringify({
            username: username,
            groupID: groupID,
        });

        // Send a POST request to the backend endpoint
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
                location.reload();
            } else {
                alert("Error adding member to the group");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("Server error when trying to add the user to the group");
        });
    }

    /**
     * Sends a GET request to the backend endpoint to retrieve the data for the group members
     * @async - needed to make sure the function waits for the response from the server before 
     *          trying to renderthe group members
     * @param {*} groupID - the group to retrieve the members from
     * @returns {void}
     */
    async function fetchGroupMembers(groupID) {
        // Endpoint URL
        const url = `${API_IP}/group/members?groupID=${encodeURIComponent(groupID)}`;
        
        try {
            // Send a GET request to the server
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error with request to endpoint. Status: ${response.status}`);
            }
            const data = await response.json();
            // Render the group members after the API response has been received
            renderGroupMembers(data); 
        } catch (error) {
            console.error('Error fetching group members:', error);
            alert("Server error when trying to get group members");
        }
    } 

    
    /**
     * Creates all the html elements to render for each group memeber and also gives them the correct
     * values and initializes eventlisteners where needed.
     * @param {*} groupMembers - the members of the group with their corresponding data fields
     * @returns {void}
     */
    function renderGroupMembers(groupMembers) {

        // Clear existing members (if any)
        if (groupMembersListSettings) {
            while (groupMembersListSettings.firstChild) {
                groupMembersListSettings.removeChild(groupMembersListSettings.firstChild);
            }
        } else {
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

            // Add the roles to the dropdown
            roles.forEach((role) => {
                const option = document.createElement('option');
                option.value = role.toLowerCase(); // Use lowercase value for consistency
                option.textContent = role;
                select.appendChild(option);
            });

            // Set the selected option based on the member's role
            select.value = member.roleName.toLowerCase(); 
            initialDropdownValues[member.username] = select.value;
            
            console.log(initialDropdownValues);

            // Add an event listener to handle role updates
            select.addEventListener('change', async (event) => {
                // Get the selected role from the dropdown menu
                const selectedRole = event.target.value;
                // Get the username for the member
                const parentElement = select.parentElement;
                const username = parentElement.querySelector("span").textContent;
                const initialValue = initialDropdownValues[username];
                // Function to update the role for the member
                const [validRole, groupOwnerChanged] = await updateRoleForMember(username, selectedRole, initialValue);
                // Update the initial value for the dropdown
                if (validRole){
                    initialDropdownValues[username] = selectedRole;
                    if (groupOwnerChanged) {
                        location.reload();
                    }
                }
                
            });
            
            // Store the owner and administrator usernames
            if (member.roleName.toLowerCase() === "owner"){
                GroupOwner = member.username;
            }
            if (member.roleName.toLowerCase() === "administrator"){
                Administrators.push(member.username);
            }

             // Create the delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'FJERN';
            deleteButton.className = 'delete-member-button';

            // Add an event listener to handle member deletion
            deleteButton.addEventListener('click', () => {
                if (LoggedInUsername !== member.username){
                    deleteMember(member.username);
                } else {
                    alert("You cannot delete yourself from the group");
                }
            });

            // Append the elements to the list item
            listItem.appendChild(img);
            listItem.appendChild(span);
            listItem.appendChild(select);
            listItem.appendChild(deleteButton);

            // Append the list item to the group members list
            groupMembersListSettings.appendChild(listItem);
        });

        // Create the add member button
        const addMemberButton = document.createElement('button');
        addMemberButton.textContent = 'Legg til medlem';
        addMemberButton.id = 'add-member-btn';
        addMemberButton.addEventListener('click', function () {
            modal.style.display = "block";
            popupContent.style.display = "block";
        });
        groupMembersListSettings.appendChild(addMemberButton);
    }

    /**
     * Sends a DELETE request to the backend with the username of the user to delete from the group
     * @param {string} username - Unique username to delete from the group
     * @returns {void}
     */
    function deleteMember(username) {
        // Only owner and administrators can delete members from the group
        if (LoggedInUsername !== GroupOwner && !Administrators.includes(LoggedInUsername)){
            alert("Only an owner or administrator can remove a member from the group");
            return;
        }

        // URL for the backend endpoint
        const url = `${API_IP}/group/members?groupID=${encodeURIComponent(groupID)}&username=${encodeURIComponent(username)}`;
        
        // Send a DELETE request to the backend endpoint
        fetch(url, {
            method: 'DELETE', 
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
     * @param {string} username     - username to update the role for
     * @param {string} newRole      - new role for the username
     * @param {string} initialValue - the initial role for the username
     */
    async function updateRoleForMember(username, newRole, initialValue){
        
        let newOwner = false;
        let previousOwner = GroupOwner;
        try {
            if (LoggedInUsername !== GroupOwner || initialValue === "owner") {
                resetDropdownValues(username, newRole, initialValue);
                alert("Only the owner can update a role. If you want to make another person owner, change their value to owner");
                return [false, false];
            }
    
            if (newRole === "owner") {
                if (!window.confirm("Are you sure you want to make this person the owner?")) {
                    resetDropdownValues(username, newRole, initialValue);
                    return [false, false];
                }
                newOwner = true;
            }
    
            if (newOwner) {
                const newRoleForOwner = "administrator"; // Assuming the new role for the owner is "administrator"
                const ownerUrl = `${API_IP}/group/members?username=${encodeURIComponent(GroupOwner)}&newRole=${encodeURIComponent(newRoleForOwner)}&groupID=${encodeURIComponent(groupID)}`;
                GroupOwner = username;
    
                const ownerResponse = await fetch(ownerUrl, {
                    method: 'PATCH',
                });
    
                if (!ownerResponse.status === 200) {
                    alert("Server error when trying to update the role for the previous owner");
                    return [false, false];
                }
            }
    
            const memberUrl = `${API_IP}/group/members?username=${encodeURIComponent(username)}&newRole=${encodeURIComponent(newRole)}&groupID=${encodeURIComponent(groupID)}`;
    
            const memberResponse = await fetch(memberUrl, {
                method: 'PATCH',
            });
    
            if (memberResponse.status === 200) {
                console.log("Role of group member updated");
                if (newOwner) return [true, true];
                else return [true, false];
            } else {
                alert("Server error when trying to update the role");
                return [false, false];
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server error when trying to update the role");
            return false;
        }
    }

    /**
     * Resets the dropdown values to the initial values
     * @returns {void}
     */
    function resetDropdownValues(username, newRole, initialValue){
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
    }

    /**
     * Hides the leave group button if the user is the owner of the group
     * @returns {void}
     */
    function hideLeaveIfOwner() {
        if (LoggedInUsername === GroupOwner){
            leaveGroupButton.style.display = "none";
        }
    }

    /**
     * Displays the delete group button if the user is the owner of the group
     * @returns {void}
     */
    function displayDeleteIfOwner() {
        if (LoggedInUsername === GroupOwner){
            deleteGroupButton.style.display = "block";
        }
    }
});

