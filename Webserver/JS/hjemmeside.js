/*
    RETRIEVE GROUPS FROM SESSION STORAGE OR DATABASE
*/
retrieveGroups(); 
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
           let groupBlock = document.createElement("div");
           groupBlock.setAttribute("id","group-block");
           let groupNameParagraph = document.createElement("p");
           groupNameParagraph.textContent = "Gruppenavn: " + groups[i].name;


           let groupIdParagraph = document.createElement("p");
           groupIdParagraph.textContent = "Gruppe-ID: " + groups[i].id;

           groupBlock.appendChild(groupNameParagraph);
           groupBlock.appendChild(groupIdParagraph);

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
    document.querySelector("#group-created-information").style.block = "block"
    document.getElementById("new-group-popup").style.display = "none";
    if (!checkAuthToken()) {
        alert("Du er ikke innlogget!")
        return;
    }
    const groupName = document.querySelector("#gruppenavn").value;
    newGroup(groupName);
    });
/*
    NEW GROUP
    Adds new group to groups-container, registers group in database
*/
function newGroup(groupName){
    let group = {name: groupName, owner: sessionStorage.getItem("username")};
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
            sessionStorage.setItem("groups", JSON.stringify(groups));
            submitConfirm(groupNew);
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
function submitConfirm(group){
    let display = document.querySelector("#group-created-information");
    display.innerHTML = "Check your email for the access code to your new group!";
        let accessCode = document.createElement("p");
        accessCode.setAttribute("id","access-code");
        accessCode.textContent = group.id;
        display.appendChild(accessCode);
        let name = document.createElement("p");
        name.setAttribute("id","gruppenavn");
        name.textContent = group.name;
        display.appendChild(name);
}
btn = document.querySelector("#close-popup-btn");
btn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("group-created-popup").style.display = "none";
    let display = document.querySelector("#group-created-information");
    display.getElementById("access-code").removeChild();
    display.getElementById("#gruppenavn").removeChild();
});
