//CALL ON START/RELOAD
retrieveGroups();

//EVENT LISTENERS:

//On click, display pop-up window
let btn = document.querySelector("#new-group-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.querySelector("#new-group-popup").style.display = "block";});

/*      UNCOMMENT HVIS IKKE FUNKER MED ALEKSANDER SITT
//On submit create new group
btn = document.querySelector("#submit-group-btn");
btn.addEventListener("click", (event) => {
    event.preventDefault();
    KOMMENTER DENNE IF SETNINGEN
    if (!checkAuthToken()) {
        alert("Du er ikke innlogget!")
        return;
    }
    const groupName = document.querySelector("#gruppenavn").value;
    newGroup(groupName);

});
*/
/*
//On click, close pop-up window
btn = document.querySelector("#close-group-popup");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("new-group-popup").style.display = "none";});
*/


/********** ALEKSANDER FORSØK PÅ CREATE GROUP *******************/

const form = document.querySelector(".create-group-form");
const modal = document.querySelector("#search-member-modal");
const memberSuggestionsList = modal.querySelector(".member-suggestions");
const searchInput = document.querySelector("#search-input");
const memberList = document.querySelector("#member-list");
const openModalButton = document.querySelector("#add-member-button");
const closeModalButton = modal.querySelector(".close-modal");
const createGroupCloseButton = document.querySelector("#close-group-popup");
const imageInput = document.querySelector("#group-img");
// Close the modal when the close button is clicked
closeModalButton.addEventListener("click", function () {
    modal.style.display = "none";
});

openModalButton.addEventListener("click", function () {
    modal.style.display = "block";
});
createGroupCloseButton.addEventListener("click", function () {
    document.querySelector("#new-group-popup").style.display = "none";
});



form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get the form elements by their IDs
    const groupName = document.getElementById("group-name").value;
    // Create an array of member names from the list 
    const memberList = Array.from(document.querySelectorAll(".member-list li")).map(li => li.textContent);
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

        /*
        const file =  imgInput.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(API_IP + "/image/", {
                method: "POST",
                body: formData,
            }).then((response) => {
                console.log("Response:", response)
                return response.json();
            }).then((data) => {
                console.log("Data:", data);
                groupImage = data["filename"];
            }).catch((error) => {
                console.log(error);
                alert("Det skjedde en feil med opplasting av bildet");
            });
            console.log("File: " + groupImage);
        } catch (error) {
            console.log(error);
            alert("Det skjedde en feil med opplasting av bildet");
            return;
        }

         */

    }
    // Prepare the data to be sent to the API endpoint
    const groupId = generateRandomId(20);
    const chatID = generateRandomId(20);
    const group = {
        documentID: groupId,
        name: groupName,
        owner: sessionStorage.getItem("username"),
        members: memberMap,
        image: groupImage,
    };
    fetch(API_IP + `/group/new?chatID=${chatID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(group)
    })
        .then((response) => {
            if (response.status === 201) {
                console.log("Group created");
                // Decode group id from response body
                return response.json(); // Return the JSON parsing Promise
            } else {
                console.log("Error creating group");
                throw new Error("Failed to create group");
            }
        })
        .then((data) => {
            console.log("I got here YAY");
            // Now, data contains the parsed JSON
            console.log("Data returned from creating group: " + data);
            const groupNew = data;
            console.log("GroupNew: " + groupNew);
            let groups;
            try {
                groups = JSON.parse(sessionStorage.getItem('groups'));
            } catch (e) {
                console.log("I was null!");
                groups = null;
            }
            console.log("groups: " + groups)
            if (groups === null){
                console.log("I was null!");
                groups = [];
            }
            console.log("Groups: " + groups);
            //const groups = JSON.parse(sessionStorage.getItem("groups") || stringify([]));
            groups.push(groupNew);
            console.log("I got past push!");
            let username = sessionStorage.getItem("username");
            sessionStorage.setItem("groups", JSON.stringify(groups));
            console.log("Group added to session storage:", groups);

            let display = document.querySelector(".groups-container");
            let groupContainer = document.createElement("a");
            groupContainer.setAttribute("href", "#");
            let groupBlock = document.createElement("div");
            groupBlock.setAttribute("id","group-block");
            let groupNameParagraph = document.createElement("p");
            groupNameParagraph.textContent = "Gruppenavn: " + data.name;


            let groupIdParagraph = document.createElement("p");
            groupIdParagraph.textContent = "Gruppe-ID: " + data.documentID;

            groupBlock.appendChild(groupNameParagraph);
            groupBlock.appendChild(groupIdParagraph);
            groupContainer.appendChild(groupBlock);
            display.appendChild(groupContainer);
            console.log(memberList)
            memberList.forEach((member) => {
                console.log("member: " + member);
                fetch(API_IP + `/user/groups?username=${member}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(groupId),
                })
                    .then((response) => {
                        if (response.status === 200) {
                            console.log("Group added to user");
                            window.location.reload();
                        } else {
                            console.log("Error adding group to user");
                            throw new Error("Failed to add group to user");
                        }
                    })
                    .catch((error) => {
                        console.log("Error adding group to user: " + error);
                    })
            })  
        })
        .catch((error) => {
            console.log("Error creating group: " + error);
        });
});

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

// Handle search input changes
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
        image.src = IMAGEDIR + "person-icon-transparent.png";
        image.alt = username;

        // Create the span element for the username
        const usernameSpan = document.createElement("span");
        usernameSpan.textContent = username;

        // Create the button for adding the member
        const addButton = document.createElement("button");
        addButton.className = "add-member-btn2";

        const addImage = document.createElement("img");
        addImage.src = IMAGEDIR + "add-icon.png";
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

function addMemberToAddList(username) {
    // Get the list of members
    const memberListItem = document.createElement("li");
    const memberName = document.createElement("span");
    memberName.textContent = username;
    
    const removeButton = document.createElement("button");
    removeButton.className = "remove-member-button";
    removeButton.addEventListener("click", function () {
        removeMemberFromList(username);
    });

    memberListItem.appendChild(memberName);
    memberListItem.appendChild(removeButton);
    memberList.appendChild(memberListItem);
}

function removeMemberFromList(username){
    var memberListItem;
    const listItems = document.querySelectorAll("#member-list li");
    for (const listItem of listItems) {
        console.log(listItem)
        const span = listItem.querySelector("span");
        if (!span){console.log("span is null");}
        if (span.textContent === username) {
            // Found the list item with the matching username
            memberListItem = listItem;
        }
    }
    memberList.removeChild(memberListItem);
}



//FUNCTIONS:
/*
    RETRIEVE GROUPS
 */
function retrieveGroups(){

    if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");
    let groups = JSON.parse(sessionStorage.getItem("groups"));

  /* if(groups && groups.length > 0){
       displayGroups(groups);
    }  else */{
    if(userName === null){
        console.log("User not logged in");
        return;
    }
    fetch(API_IP + `/user/groups?username=${userName}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => {
        if (response.status === 200){
            console.log("Groups retrieved");
            return response.json();
        } else {
            console.log("Error retrieving groups");
            throw new Error("Failed to retrieve groups");
        }
    }).then(data=>{
        sessionStorage.setItem("groups", JSON.stringify(data));
        displayGroups(data);})
    .catch(error => {
        console.log("Error retrieving groups: " + error);
    });
}
}
;

/*
    DISPLAY GROUPS
*/
function displayGroups(groups){
    let display = document.querySelector(".groups-container");
       for(let i = 0; i < groups.length; i++){
           let groupContainer = document.createElement("a");
           const url = `./Grupper/index.html?groupID=${encodeURIComponent(groups[i].documentID)}`;
           groupContainer.setAttribute("href", url);
           let groupBlock = document.createElement("div");
           groupBlock.setAttribute("id","group-block");

           if (groups[i].image !== "") {
               //console.log("Image: " + groups[i].image);
               checkImageExists(USRIMGDIR + groups[i].image + ".jpeg", function (exists) {
                   if (exists) {
                       groupBlock.classList.add("has-img");
                       //groupBlock.style.setProperty('--group-background-image', `url(${IMAGEDIR}${groups[i].image}.jpeg)`)
                       groupBlock.style.background = "none";
                       groupBlock.style.backgroundColor = "#FFFFFF";
                       groupBlock.style.backgroundImage = `url(${USRIMGDIR}${groups[i].image}.jpeg)`;
                       groupBlock.style.backgroundSize = "auto%";
                   }
               });
           }
           let groupNameParagraph = document.createElement("p");
           groupNameParagraph.textContent = groups[i].name;


           /*let groupIdParagraph = document.createElement("p");
           groupIdParagraph.textContent = "Gruppe-ID: " + groups[i].documentID;*/

           groupBlock.appendChild(groupNameParagraph);
           //groupBlock.appendChild(groupIdParagraph);
           groupContainer.appendChild(groupBlock);
           display.appendChild(groupContainer);
    }
}

/*
   ADD NEW GROUP AND PATCH USER INFO
*/
//TODO: Fix duplicate group ids in user when patching
function newGroup(groupName){
    const groupId = generateRandomId(20);
    const chatID = generateRandomId(20);
    const group = {
        documentID: groupId,
        name: groupName,
        owner: sessionStorage.getItem("username"),
    };
    fetch(API_IP + `/group/new?chatID=${chatID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(group)
    })
        .then((response) => {
            if (response.status === 201) {
                console.log("Group created");
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
            const groups = JSON.parse(sessionStorage.getItem("groups") || "[]");
            groups.push(groupNew);
            let username = sessionStorage.getItem("username");
            sessionStorage.setItem("groups", JSON.stringify(groups));
            console.log("Group added to session storage:", groups);

            let display = document.querySelector(".groups-container");
            let groupContainer = document.createElement("a");
            groupContainer.setAttribute("href", "#");
            let groupBlock = document.createElement("div");
            groupBlock.setAttribute("id","group-block");
            let groupNameParagraph = document.createElement("p");
            groupNameParagraph.textContent = "Gruppenavn: " + data.name;


            let groupIdParagraph = document.createElement("p");
            groupIdParagraph.textContent = "Gruppe-ID: " + data.documentID;

            groupBlock.appendChild(groupNameParagraph);
            groupBlock.appendChild(groupIdParagraph);
            groupContainer.appendChild(groupBlock);
            display.appendChild(groupContainer);


            fetch(API_IP + `/user/groups?username=${username}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(groupId),
            })
                .then((response) => {
                    if (response.status === 200) {
                        console.log("Group added to user");
                        return response.json();
                    } else {
                        console.log("Error adding group to user");
                        throw new Error("Failed to add group to user");
                    }
                })
                .then((data) => {
                    console.log("User updated with new group");
                    console.log(data);
                })
                .catch((error) => {
                    console.log("Error adding group to user: " + error);
                })
        })
        .catch((error) => {
            console.log("Error creating group2: " + error);
        });
}

