/**
 * @file hjemmeside.js
 * @brief hjemmeside.js contains the functions that are used on the homepage.
 */
/* jshint esversion: 8 */
/* jshint loopfunc: true */

retrieveGroups();

/***************************   DOM ELEMENTS  ***************************/

const form = document.querySelector(".create-group-form");
const modal = document.querySelector("#search-member-modal");
const memberSuggestionsList = modal.querySelector(".member-suggestions");
const searchInput = document.querySelector("#search-input");
const memberList = document.querySelector("#member-list");
const openModalButton = document.querySelector("#add-member-button");
const closeModalButton = modal.querySelector(".close-modal");
const createGroupCloseButton = document.querySelector("#close-group-popup");
const imageInput = document.querySelector("#group-img");


/***************************   EVENT LISTENERS  ***************************/

// Close the modal when the close button is clicked
closeModalButton.addEventListener("click", function () {
    modal.style.display = "none";
});

//On click, display pop-up window
let btn = document.querySelector("#new-group-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.querySelector("#new-group-popup").style.display = "block";});

// Event listener to open the modal when the button is clicked
openModalButton.addEventListener("click", function () {
    modal.style.display = "block";
    searchInput.value = "";
});

// Event listener to close the create group popup when the close button is clicked
createGroupCloseButton.addEventListener("click", function () {
    document.querySelector("#new-group-popup").style.display = "none";
});

// Event listener to add the form data to the database when the form is submitted
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get the form elements by their IDs
    const groupName = document.getElementById("group-name").value;
    // Create an array of member names from the list 
    const memberList = Array.from(document.querySelectorAll(".member-list li span")).map(span => span.textContent);
    memberList.push(sessionStorage.getItem("username"));

    // Turn the list of members into a map where the username is the key and the value is 'member'
    const memberMap = memberList.reduce((map, username) => {
        map[username] = 'member';
        return map;
      }, {});
    let imgInput = document.getElementById("group-img");
    let groupImage = "";

    if (imgInput.files.length > 0) {
        groupImage = await uploadImage(imgInput.files[0]);
        if(groupImage === null){
            alert("Det skjedde en feil med opplasting av bildet");
            return;
        }
    }
    // Prepare the data to be sent to the API endpoint
    const groupId = generateRandomId(20);
    const chatID = generateRandomId(20);
    const shoppingListID = generateRandomId(20);
    const group = {
        documentID: groupId,
        name: groupName,
        owner: sessionStorage.getItem("username"),
        members: memberMap,
        image: groupImage,
        "shopping-lists": [shoppingListID],
    };

    // API call with POST request to create a new group in the database
    fetch(API_IP + `/group/new?chatID=${chatID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(group)
    })
        .then((response) => {
            if (response.status === 201) {
                // Decode group id from response body
                return response.json(); // Return the JSON parsing Promise
            } else {
                console.log("Error creating group");
                throw new Error("Failed to create group");
            }
        })
        .then((data) => {
            // Now, data contains the parsed JSON
            const groupNew = data;
            let groups;
            try {
                groups = JSON.parse(sessionStorage.getItem('groups'));
            } catch (e) {
                groups = null;
            }
            if (groups === null){
                groups = [];
            }

            groups.push(groupNew);
            let username = sessionStorage.getItem("username");
            sessionStorage.setItem("groups", JSON.stringify(groups));

            // Set elements for displaying the groups
            let display = document.querySelector(".groups-container");
            let groupContainer = document.createElement("a");
            groupContainer.setAttribute("href", "#");
            let groupBlock = document.createElement("div");
            groupBlock.setAttribute("id","group-block");
            let groupNameParagraph = document.createElement("p");
            groupNameParagraph.textContent = "Gruppenavn: " + data.name;


            let groupIdParagraph = document.createElement("p");
            groupIdParagraph.textContent = "Gruppe-ID: " + data.documentID;

            // Add the elements  for the group to the groupContainer
            groupBlock.appendChild(groupNameParagraph);
            groupBlock.appendChild(groupIdParagraph);
            groupContainer.appendChild(groupBlock);
            display.appendChild(groupContainer);
            
            // Go through the list of members and add the group to their list of groups
            memberList.forEach((member) => {
                // API call with PATCH request to add the group to the user
                fetch(API_IP + `/user/groups?username=${member}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(groupId),
                })
                    .then((response) => {
                        if (response.status === 200) {
                            window.location.reload();
                        } else {
                            console.log("Error adding group to user");
                            throw new Error("Failed to add group to user");
                        }
                    })
                    .catch((error) => {
                        console.log("Error adding group to user: " + error);
                    });
            });  
        })
        .catch((error) => {
            console.log("Error creating group: " + error);
        });
});

// Event listener to handle when the user selects an image to upload
imageInput.addEventListener("change", function (event){
    if(this.files.length === 1){
        let image = document.querySelector("#group-img-preview img");
        image.setAttribute("src", URL.createObjectURL(this.files[0]));
        image.style.display = "inline-flex";
    } else {
        let image = document.querySelector("#group-img-preview img");
        image.setAttribute("src", "");
        image.style.display = "none";
    }
});

// Handle search input changes for seraching on members to add to the group
searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim();
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

/***************************   FUNCTIONS ***************************/

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
    if (results === null || results.length === 0) {
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
        image.src = ICONDIR + "person-icon-transparent.png";
        image.alt = username;

        // Create the span element for the username
        const usernameSpan = document.createElement("span");
        usernameSpan.textContent = username;

        // Create the button for adding the member
        const addButton = document.createElement("a");
        addButton.className = "add-member-btn2";

        const addImage = document.createElement("img");
        addImage.src = ICONDIR + "add-icon.png";
        addImage.alt = "Add member";

        addButton.appendChild(addImage);

        // Add an event listener to handle adding a member to the group when clicking the icon
        addButton.addEventListener("click", function () {
            const username = addButton.parentElement.querySelector("span").textContent;
            addMemberToAddList(username);
            modal.style.display = "none";
        });

        // Append the elements to the list item
        listItem.appendChild(image);
        listItem.appendChild(usernameSpan);
        listItem.appendChild(addButton);

        memberSuggestionsList.appendChild(listItem);
    });
}

/**
 * Adds a member to the list of members to add
 * @param username - The username of the member to add
 * @returns {void}
 */
function addMemberToAddList(username) {
    // Get the list of members
    const memberListItem = document.createElement("li");
    const memberName = document.createElement("span");
    memberName.textContent = username;
    
    const removeButton = document.createElement("button");
    removeButton.className = "remove-member-button";
    removeButton.textContent = "Fjern";
    removeButton.addEventListener("click", function () {
        removeMemberFromList(username);
    });

    memberListItem.appendChild(memberName);
    memberListItem.appendChild(removeButton);
    memberList.appendChild(memberListItem);
}

/**
 * Removes a member from the list of members to add
 * @param username - The username of the member to remove
 * @returns {void}
 */
function removeMemberFromList(username){
    var memberListItem;
    // Get all the list items in the member list
    const listItems = document.querySelectorAll("#member-list li");
    // Iterate through the list items and find the one with the matching username
    for (const listItem of listItems) {
        const span = listItem.querySelector("span");
        if (!span){console.log("span is null");}
        if (span.textContent === username) {
            // Found the list item with the matching username
            memberListItem = listItem;
        }
    }
    memberList.removeChild(memberListItem);
}

/**
 * retrieveGroups - Fetches all the groups that the user is a member of.
 * @returns {void}
 */
function retrieveGroups(){

    if (!checkLoginStatus()) return;

    // Get the username and groups the user is a part of from the sessionStorage
    let userName = sessionStorage.getItem("username");
    let groups = JSON.parse(sessionStorage.getItem("groups"));

    if(userName === null){
        return;
    }

    // API call with GET request to get all the groups that the user is a member of
    fetch(API_IP + `/user/groups?username=${userName}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        if (response.status === 200){
            return response.json();
        } else {
            console.log("Error retrieving groups");
            throw new Error("Failed to retrieve groups");
        }
    }).then(data=>{
        // Add the groups to the sessionStorage
        sessionStorage.setItem("groups", JSON.stringify(data));
        displayGroups(data);})
    .catch(error => {
        console.log("Error retrieving groups: " + error);
    });
}

/**
 * displayGroups - Displays the groups on the homepage
 * @param {*} groups - The groups to display
 * @returns {void}
 */
function displayGroups(groups){
    let display = document.querySelector(".groups-container");
    if(groups === null) {
        return;
    }

   // Iterate through the groups and create the corresponding elements to display them
   for(let i = 0; i < groups.length; i++){
       let groupContainer = document.createElement("a");
       const url = `./Grupper/index.html?groupID=${encodeURIComponent(groups[i].documentID)}`;
       groupContainer.setAttribute("href", url);
       let groupBlock = document.createElement("div");
       groupBlock.setAttribute("id","group-block");

       // Group image was not uploaded from user, set it to defualt image 
       if (groups[i].image !== "") {
           checkImageExists(IMAGEDIR + groups[i].image + ".jpeg", function (exists) {
               if (exists) {
                   groupBlock.classList.add("has-img");
                   groupBlock.style.background = "none";
                   groupBlock.style.backgroundColor = "#FFFFFF";
                   groupBlock.style.backgroundImage = `url(${IMAGEDIR}${groups[i].image}.jpeg)`;
                   groupBlock.style.backgroundSize = "70% 70%";
                   groupBlock.style.backgroundPosition = "center top";
                   groupBlock.style.backgroundRepeat = "no-repeat";
               }
           });
       }
       let groupNameParagraph = document.createElement("p");
       groupNameParagraph.textContent = groups[i].name;

       // Append the elements for the group to the groupContainer and then the display
       groupBlock.appendChild(groupNameParagraph);
       groupContainer.appendChild(groupBlock);
       display.appendChild(groupContainer);
    }
}

