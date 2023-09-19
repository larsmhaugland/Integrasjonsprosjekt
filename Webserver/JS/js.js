/*
    POP-UP WINDOW
    Log in
*/
let b = document.querySelector("#log-in-btn");
b.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("log-in-popup").style.display = "block";});

b = document.querySelector("#close-login-btn");
b.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("log-in-popup").style.display = "none";});
