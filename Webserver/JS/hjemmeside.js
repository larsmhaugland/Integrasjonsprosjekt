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
    const groupName = document.querySelector("#gruppenavn").value;
    newGroup(groupName);});

function newGroup(groupName){
    let display = document.querySelector(".groups-container");

    let groupBlock = document.createElement("div");
    groupBlock.setAttribute("id","group-block");
    groupBlock.textContent = groupName;
    display.appendChild(groupBlock);
};
