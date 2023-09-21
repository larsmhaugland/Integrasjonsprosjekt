//FIND GROUPS FROM DATABASE AND DISPLAY ON PAGE

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
    const groupName = document.querySelector("#gruppenavn").value;
    newGroup(groupName);});
/*
    NEW GROUP
    Adds new group to groups-container, registers group in database
*/
function newGroup(groupName){
    let credentials = {"name": groupName};

    fetch(API_IP+"/group/", {        //TODO: Actual /group/ endpoint
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials)
        }
    ).then(response => {
        if (response.status === 200){
            console.log("Group created");
        } else {
            console.log("Error creating group");
        }
    })

    let display = document.querySelector(".groups-container");
    let groupBlock = document.createElement("div");
    groupBlock.setAttribute("id","group-block");
    groupBlock.textContent = groupName;
    display.appendChild(groupBlock);
    //TODO: Add group to database and assign the logged in user as admin
};

/*
    POP-UP WINDOW
    Group created, show access code (group id)
*/
function submitConfirm(){
    //TODO: Retrieve group id from database
    display = document.querySelector("#group-created-information");
    let accessCode = document.createElement("p");
    accessCode.setAttribute("id","access-code");
    accessCode.textContent = "1";           //TODO: Change to actual group id
    display.appendChild(accessCode);
    document.getElementById("group-created-popup").style.display = "block";
};
btn = document.querySelector("#close-popup-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("group-created-popup").style.display = "none";});
