//CALL ON START/RELOAD
retrieveGroups();

//EVENT LISTENERS:
//On click, display pop-up window
let btn = document.querySelector("#new-group-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("new-group-popup").style.display = "block";});


//On submit create new group
btn = document.querySelector("#submit-group-btn");
btn.addEventListener("click", (event) => {
    event.preventDefault();
    /*if (!checkAuthToken()) {
        alert("Du er ikke innlogget!")
        return;
    }*/
    const groupName = document.querySelector("#gruppenavn").value;
    newGroup(groupName);

});

//On click, close pop-up window
btn = document.querySelector("#close-group-popup");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("new-group-popup").style.display = "none";});


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
              groupContainer.setAttribute("href", "./Grupper/index.html");
           let groupBlock = document.createElement("div");
           groupBlock.setAttribute("id","group-block");
           let groupNameParagraph = document.createElement("p");
           groupNameParagraph.textContent = "Gruppenavn: " + groups[i].name;


           let groupIdParagraph = document.createElement("p");
           groupIdParagraph.textContent = "Gruppe-ID: " + groups[i].documentID;

           groupBlock.appendChild(groupNameParagraph);
           groupBlock.appendChild(groupIdParagraph);
            groupContainer.appendChild(groupBlock);
           display.appendChild(groupContainer);
    };
};

/*
   ADD NEW GROUP AND PATCH USER INFO
*/
//TODO: Fix duplicate group ids in user when patching
function newGroup(groupName){
    const groupId = generateRandomId(20);
    const group = {
        documentID: groupId,
        name: groupName,
        owner: sessionStorage.getItem("username"),
    };
    fetch(API_IP + `/group/new?${groupName}`, {
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
            console.log("Error creating group: " + error);
        });
}

