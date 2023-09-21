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

//ON SUBMIT, ADD NEW GROUP TO PAGE
btn.addEventListener("click",(event)=> {event.preventDefault();
    /*TODO*/})
