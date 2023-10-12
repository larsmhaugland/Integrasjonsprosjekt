/*
    POP-UP WINDOW
    Log in
*/
//TEST
let API_IP = "";
if (window.location.hostname === "localhost"){
     API_IP = "http://" + window.location.hostname + ":8080";
} else{
    API_IP = "https://" + window.location.hostname + ":8080";
}

let b = document.querySelector("#log-in-btn");
b.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("log-in-popup").style.display = "block";});

b = document.querySelector("#close-login-popup");
b.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("log-in-popup").style.display = "none";});

let loginBtn = document.querySelector("#log-in-submit");
loginBtn.addEventListener("click", login);
let registerUserBtn = document.querySelector("#register-user-submit");
registerUserBtn.addEventListener("click", registerUser);

let registerSwitchBtn = document.querySelector("#register-switch-btn");
registerSwitchBtn.addEventListener("click", loginRegisterToggle);
let closeRegisterBtn = document.querySelector("#close-register-popup");
closeRegisterBtn.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("register-popup").style.display = "none";});
let loginSwitchBtn = document.querySelector("#login-switch-btn");
loginSwitchBtn.addEventListener("click", loginRegisterToggle);
let logoutBtn = document.querySelector("#log-out-btn");
logoutBtn.addEventListener("click", logout);



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
async function checkAuthToken(){
    let username = sessionStorage.getItem("username");
    let loggedIn = sessionStorage.getItem("loggedIn");

    if(loggedIn){
        return true;
    }
    if (username === null){
        return false;
    }

    const response = await fetch (API_IP + "/user/credentials/checkCookie", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (response.status === 200){
        sessionStorage.setItem("loggedIn", "true");
        sessionStorage.setItem("username", username);
        console.log("Logged in using authtoken as: " + username);
        updateLoginStatus();
        return true;
    } else {
        console.log("Invalid Auth token");
        return false;
    }
}

//Check login credentials
function login(){
    let username = document.querySelector("#username").value;
    let password = document.querySelector("#password").value;

    let credentials = {"username": username, "password": password};
    console.log(credentials);
    navigator.cookieEnabled = true;
    fetch(API_IP + "/user/credentials/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
    }).then(response => {
        let wrongpassword = document.querySelector("#wrong-password");

        if (response.status === 200){
            sessionStorage.setItem("loggedIn", "true");
            sessionStorage.setItem("username", username);
            console.log("Logged in as: " + username);
            let loginForm = document.querySelector("#log-in-popup");
            loginForm.style.display = "none";
            wrongpassword.style.display = "none";
            updateLoginStatus();

        } else {
            wrongpassword.style.display = "block";
        }
    })
    .catch(error => {
        console.log("Error when sending HTTPS request");
        console.log(error);
    });
}

function logout(){
    sessionStorage.removeItem("username");
    sessionStorage.setItem("loggedIn", "false");
    updateLoginStatus();
}

function updateLoginStatus(){
    let loggedIn = sessionStorage.getItem("loggedIn");
    let loginBtn = document.querySelector("#log-in-btn");
    let logoutBtn = document.querySelector("#log-out-btn");
    if (loggedIn === "true"){
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
    } else {
        loginBtn.style.display = "block";
        logoutBtn.style.display = "none";
    }
}

function registerUser(){
    let username = document.querySelector("#username-reg").value;
    let password = document.querySelector("#password-reg").value;
    let passwordConf = document.querySelector("#password-reg-conf").value;
    let name = document.querySelector("#name-reg").value;
    let passwordMismatch = document.querySelector("#password-mismatch");
    if (password !== passwordConf){
        passwordMismatch.style.display = "block";
        console.log("Passwords do not match");
        return;
    }
    let credentials = {"username": username, "password": password, "name": name};

    fetch(API_IP + "/user/credentials/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
    }).then(response => {
        let usernameTaken = document.querySelector("#username-taken");
        passwordMismatch.style.display = "none";
        if (response.status === 200){
            let registerForm = document.querySelector("#register-popup");
            registerForm.style.display = "none";
            usernameTaken.style.display = "none";
            console.log("Registered user: " + username);
            updateLoginStatus();
        } else {
            usernameTaken.style.display = "block";
            console.log("Username already taken");
            console.log(response.status);
        }
    })
    .catch(error => {
        alertDBconnectionRefused()
        console.log("Error when sending HTTPS request");
        console.log(error);
    });

}

function alertDBconnectionRefused(){
    alert("Could not connect to database");
}

function generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}