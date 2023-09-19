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

let loginBtn = document.querySelector("#log-in-submit");
loginBtn.addEventListener("click", login);
let registerUserBtn = document.querySelector("#register-user-submit");
registerUserBtn.addEventListener("click", registerUser);

let registerSwitchBtn = document.querySelector("#register-switch-btn");
registerSwitchBtn.addEventListener("click", loginRegisterToggle);
let closeRegisterBtn = document.querySelector("#close-register-btn");
closeRegisterBtn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("register-popup").style.display = "none";});
let loginSwitchBtn = document.querySelector("#login-switch-btn");
loginSwitchBtn.addEventListener("click", loginRegisterToggle);

function loginRegisterToggle(){
    let loginForm = document.querySelector("#log-in-popup");
    let registerForm = document.querySelector("#register-popup");
    if (loginForm.style.display === "none"){
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    }
}
//Check login cookie
function checkAuthToken(){
    let username = localStorage.getItem("username");
    let cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.startsWith("AuthToken=")) {
            var authToken = cookie.split("=")[1].trim();

            var request = new XMLHttpRequest();
            request.open("POST", "http://localhost:8080/user/credentials/checkCookie", true);
            request.setRequestHeader("Content-Type", "application/json");
            request.setRequestHeader("AuthToken", authToken);
            request.onload = function () {
                if (request.status === 200){
                    sessionStorage.setItem("username", username);
                    console.log("Logged in using cookie as: " + username);

                } else {
                    console.log("Cookie not valid");
                }
            }
            request.onerror = function () {
                console.log("Error?!?! what hAppened??");
            }
            request.send();
        }
    }
}

//Check login credentials
function login(){
    let username = document.querySelector("#username").value;
    let password = document.querySelector("#password").value;

    //Vi burde vel egt ha kryptering før vi sender passordet rundt, men det finner vi ut av senere :)
    //Det fikses forsåvidt hvis vi går over til https
    let credentials = {"username": username, "password": password};
    console.log(credentials);
    let request = new XMLHttpRequest();
    request.open("POST", "http://localhost:8080/user/credentials/login", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.onload = function () {
        if (request.status === 200){
            sessionStorage.setItem("username", username);
            console.log("Logged in as: " + username);
        } else {
            console.log("Wrong username or password");
            console.log(request.status);
        }
    }
    request.onerror = function () {
        console.log("Error?!?! what hAppened??");
        console.log(request.status);
    }
    request.send(JSON.stringify(credentials));

}

function registerUser(){
    let username = document.querySelector("#username-reg").value;
    let password = document.querySelector("#password-reg").value;
    let passwordConf = document.querySelector("#password-reg-conf").value;
    if (password !== passwordConf){
        console.log("Passwords do not match");
        return;
    }
    let credentials = {"username": username, "password": password};
    let request = new XMLHttpRequest();
    request.open("POST", "http://localhost:8080/user/credentials/register", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.onload = function () {
        if (request.status === 200){
            console.log("Registered user: " + username);
        } else {
            console.log("Username already taken");
            console.log(request.status);
        }
    }
    request.onerror = function () {
        console.log("Error?!?! what hAppened??");
        console.log(request.status);
    }
    request.send(JSON.stringify(credentials));
}
