/*
    RETRIEVE GROUPS FROM DATABASE AND DISPLAY
*/
//retrieveAndDisplayGroups(); COMMENTED OUT BECAUSE THE FUNCTION ISN'T FINISHED YET
function retrieveAndDisplayGroups(){
    //TODO: Confirm that user is logged in
    //Might have to do another call to get group name and not group id but i am very bad at API and golang and tired
    let userName = sessionStorage.getItem("username");
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
        let display = document.querySelector(".groups-container");

        data.forEach(group => {
            let groupBlock = document.createElement("div");
            groupBlock.setAttribute("id","group-block");
            groupBlock.textContent = group.name;
            display.appendChild(groupBlock);
        })
    }).catch(error => {
        console.log("Error retrieving groups: " + error);
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
            return id;
        })
        .catch((error) => {
            console.log("Error creating group: " + error);
        });

    let display = document.querySelector(".groups-container");
    let groupBlock = document.createElement("div");
    groupBlock.setAttribute("id","group-block");
    groupBlock.textContent = groupName;
    display.appendChild(groupBlock);        //TODO: Delete this append afterwards (maybe in submitConfirm?) so that we won't get every group id on the page for every new group created
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
    accessCode.textContent = newGroup(groupName);
    display.appendChild(accessCode);
    document.getElementById("group-created-popup").style.display = "block";
}
btn = document.querySelector("#close-popup-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("group-created-popup").style.display = "none";});
