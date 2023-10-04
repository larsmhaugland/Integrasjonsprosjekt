/*
    RETRIEVE GROUPS FROM SESSION STORAGE OR DATABASE
*/
retrieveGroups(); 
function retrieveGroups(){

    if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");
    let groups = JSON.parse(sessionStorage.getItem("groups"));

   if(groups && groups.length > 0){
       displayGroups(groups);
    }  else {
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
        console.log("Response data:", data);
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
           let groupBlock = document.createElement("div");
           groupBlock.setAttribute("id","group-block");
           groupBlock.textContent = groups[i].name;
           display.appendChild(groupBlock);
    };
};

/*
    POP-UP WINDOW
    Create new groups
*/
let btn = document.querySelector("#new-group-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("new-group-popup").style.display = "block";});


btn = document.querySelector("#close-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("new-group-popup").style.display = "none";});


//ON SUBMIT CREATE NEW GROUP AND GENERATE GROUP ID
btn = document.querySelector("#submit-group-btn");
btn.addEventListener("click",(event)=> {event.preventDefault();
    document.getElementById("new-group-popup").style.display = "none";
    submitConfirm();

    });
/*
    NEW GROUP
    Adds new group to groups-container, registers group in database
*/
function newGroup(groupName){
    let credentials = {"name": groupName, "owner": sessionStorage.getItem("username")};
    fetch(API_IP + "/user/groups", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials)   //Add correct body
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
            const id = data;
            console.log("Group id: " + id);
            const groups = JSON.parse(sessionStorage.getItem("groups") || "[]");
            groups.push({id, name: groupName});
            sessionStorage.setItem("groups", JSON.stringify(groups));
            return id;
        })
        .catch((error) => {
            console.log("Error creating group: " + error);
        });

    let display = document.querySelector(".groups-container");
    let groupBlock = document.createElement("div");
    groupBlock.setAttribute("id","group-block");
    groupBlock.textContent = groupName;
    display.appendChild(groupBlock);       
}

/*
    POP-UP WINDOW
    Group created, show access code (group id)
*/
function submitConfirm(){
    if (!checkAuthToken()) {
        alert("Du er ikke innlogget!")
        return;
    }
    display = document.querySelector("#group-created-information");
    const groupName = document.querySelector("#gruppenavn").value;
    let accessCode = document.createElement("p");
    accessCode.setAttribute("id","access-code");
    accessCode.textContent = newGroup(groupName);   //TODO: Actually post the group id as well
    display.appendChild(accessCode);    //TODO: Delete this append afterwards (maybe in submitConfirm?) so that we won't get every group id on the page for every new group created
    document.getElementById("group-created-popup").style.display = "block";
}
btn = document.querySelector("#close-popup-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("group-created-popup").style.display = "none";});
