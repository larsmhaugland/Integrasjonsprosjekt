/**
 * @file gruppe.js
 * @brief gruppe.js contains the functions that are used on the group page.
 */

/**
 * Listens for the DOMContentLoaded event. When the event is fired, the function is run.
 * */
document.addEventListener("DOMContentLoaded", function () {
    /***        DOM ELEMENTS       ***/
    const groupMembersList = document.querySelector("#group-members-list");
    const editButton = document.querySelector("#edit-button");
    const groupNameElement = document.querySelector("#group-name");
    const handlelisteLink = document.querySelector("#handleliste-href");
    const kalenderLink = document.querySelector("#kalender-href");
    const chatLink = document.querySelector("#chat-href");
    const LoggedInUsername = sessionStorage.getItem("username");
    const leaveGroupButton = document.querySelector("#leave-group");

    /***        VARIABLES       ***/
    let groupNamePass;
    let GroupOwner;
    const Administrators = [];
    const redirectURL = "../index.html";
    // Global variables and constants
    let groupID;

    onPageReloadGroup();


    /***       EVENT LISTENERS       ***/

    /**
     * Event listener for the edit button. When the button is clicked, the function is run.
     */
    editButton.addEventListener("click", function () {
        // Construct the URL with the groupID parameter
        const url = `groupSettings.html?groupID=${encodeURIComponent(groupID)}`;
        // Redirect to the groupSettings.html page with the groupID parameter
        window.location.href = url;
    });

    /**
     * Event listener for the handleliste link. When the link is clicked, the function is run.
     */
    handlelisteLink.addEventListener("click", function () {
        const url = `../Handleliste/index.html?groupID=${encodeURIComponent(groupID)}`;
        window.location.href = url;
    });

    /**
     * Event listener for the kalender link. When the link is clicked, the function is run.
     */
    kalenderLink.addEventListener("click", function () {
        const url = `../Kalender/index.html?groupID=${encodeURIComponent(groupID)}`;
        window.location.href = url;
    });
    /**
     * Event listener for the chat link. When the link is clicked, the function is run.
     */
    chatLink.addEventListener("click", function () {
        const url = `../Chat/index.html?groupID=${encodeURIComponent(groupID)}`;
        window.location.href = url;
    });

    /**
     * Event listener for the leave group button. When the button is clicked, the function is run.
     */
    leaveGroupButton.addEventListener("click", function(){
        leaveGroup(groupID);
    });

    /***       FUNCTIONS       ***/

    /**
     * Function to run when the page is loaded or reloaded. Gets the gropupID from the URL,
     *  and fetches the group name and members. Displays the edit chat button if the logged in user is 
     * the owner or an administrator.
     * @returns {void}
     */
    async function onPageReloadGroup() {
        const urlParams = new URLSearchParams(window.location.search);
        groupID = urlParams.get('groupID');
        if (groupID){
            const groupName = await getGroupName(groupID);
            groupNamePass = groupName;
            groupNameElement.textContent = "Instillinger for: " + groupName;
            await fetchGroupMembers(groupID);
            displayEditIfOwnerOrAdmin();
        } else {
            alert("No groupID was passed to the groupSettings.html page");
            window.location.href = redirectURL;
        }
    }

   /**
    * Function to get the group name from the database by making the API call. 
    * @async - To make sure the function waits for the fetch operation to complete,
    *           so group name is returned before it is supposed to be displayed.
    * @param {string} groupID - unique ID for the group
    * @returns 
    */
    async function getGroupName(groupID){
        // URL for the API endpoint
        const url = `${API_IP}/group/groupName?groupID=${groupID}`;
        
        try {
            // Send GET request to the api endpoint
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

    /**
     * Function to fetch the group members from the database by making the API call.
     * @async - To make sure the function waits for the fetch operation to complete,
     *          so the group members are displayed after they are retrieved.
     * @param {string} groupID - unique ID for the group
     * @returns {void}
     */
    async function fetchGroupMembers(groupID) {
        // URL for the API endpoint
        const url = `${API_IP}/group/members?groupID=${encodeURIComponent(groupID)}`;
        try {
            // Send GET request to the api endpoint
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error with request to endpoint. Status: ${response.status}`);
            }
            const data = await response.json();
            // Call the function to render the group members after the response from the API is received
            renderGroupMembers(data); 
        } catch (error) {
            console.error('Error fetching group members:', error);
            alert("Server error when trying to get group members");
        }
    } 

    /**
    * Renders the group members on the page by creating the corresponding list items.
    * @param {string} groupMembers - array of group members
    * @returns {void}
    */
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

    /**
     * Function to display the edit button if the logged in user is the owner or an administrator.
     */
    function displayEditIfOwnerOrAdmin(){
        if (LoggedInUsername === GroupOwner || Administrators.includes(LoggedInUsername)){
            editButton.style.display = "block";
            leaveGroupButton.style.display = "none";
        } else {
            leaveGroupButton.style.display = "block";
            editButton.style.display = "none";
        }
    }

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
});
