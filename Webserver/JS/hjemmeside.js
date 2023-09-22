/*
    RETRIEVE GROUPS FROM SESSION STORAGE OR DATABASE
*/
retrieveGroups(); 
function retrieveGroups(){
    //TODO: Confirm that user is logged in
    //Might have to do another call to get group name and not group id but i am very bad at API and golang and tired
    //TODO: Save groups to storage session so we don't have to retrieve them every time we refresh the page
    if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");
    let groups = JSON.parse(sessionStorage.getItem("groups"));

    if(groups && groups.length > 0){
        displayGroups(groups);
    }  else {
    let credentials = {"username": userName};
    fetch(API_IP + "/user/groups", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
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
}};

/*
    DISPLAY GROUPS
*/
function displayGroups(groups){
    let display = document.querySelector(".groups-container");

    groups.forEach(group => {
        let groupBlock = document.createElement("div");
        groupBlock.setAttribute("id","group-block");
        groupBlock.textContent = group.name;
        display.appendChild(groupBlock);
});
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

    fetch(API_IP + "/group/new", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
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
    //TODO: Confirm that user is logged in
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
