/* jshint esversion: 8 */
document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const groupMembersList = document.querySelector("#group-members-list");
    const editButton = document.querySelector("#edit-button");
    const groupNameElement = document.querySelector("#group-name");
    const handlelisteLink = document.querySelector("#handleliste-href");
    const kalenderLink = document.querySelector("#kalender-href");
    const chatLink = document.querySelector("#chat-href");
    const LoggedInUsername = sessionStorage.getItem("username");
    let groupNamePass;
    let GroupOwner;
    const Administrators = [];
    const redirectURL = "../index.html";
    // Global variables and constants
    var groupID;

    
    onPageReloadGroup();

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
        }
    }
    
});
