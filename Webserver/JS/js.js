/*
    POP-UP WINDOW
    Log in
*/
//TEST
let API_IP = "";
let IMAGEDIR = "Images/";
const API_LOCAL = "http://localhost:8080";
const API_REMOTE = "https://10.212.174.249:8080"; //PEKER PÅ DEV SERVER

if (window.location.hostname === "localhost"){
     API_IP = "http://" + window.location.hostname + ":8080";
} else{
    API_IP = "https://" + window.location.hostname + ":8080";
    IMAGEDIR = "UsrImages/";
}

let b = document.querySelector("#log-in-btn");
b.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("log-in-popup").style.display = "block";});
b = document.querySelector("#log-in-btn2");
b.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("log-in-popup").style.display = "block";});

b = document.querySelector("#close-login-popup");
b.addEventListener("click", (event)=> {event.preventDefault();
    let inputs = document.querySelectorAll("#log-in-popup input");
    inputs.forEach(input => input.value = "");
    document.getElementById("log-in-popup").style.display = "none";});

let loginBtn = document.querySelector("#log-in-submit");
loginBtn.addEventListener("click", login);
let loginPassword = document.querySelector("#password");
loginPassword.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) { //Enter key
        event.preventDefault();
        loginBtn.click();
    }
});

let registerUserBtn = document.querySelector("#register-user-submit");
registerUserBtn.addEventListener("click", registerUser);
let registerPassword = document.querySelector("#password-reg-conf");
registerPassword.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) { //Enter key
        event.preventDefault();
        registerUserBtn.click();
    }
});

let registerSwitchBtn = document.querySelector("#register-switch-btn");
registerSwitchBtn.addEventListener("click", loginRegisterToggle);
let closeRegisterBtn = document.querySelector("#close-register-popup");
closeRegisterBtn.addEventListener("click", (event)=> {event.preventDefault();
    let inputs = document.querySelectorAll("#register-popup input");
    inputs.forEach(input => input.value = "");
    document.getElementById("register-popup").style.display = "none";});
let loginSwitchBtn = document.querySelector("#login-switch-btn");
loginSwitchBtn.addEventListener("click", loginRegisterToggle);
let logoutBtn = document.querySelector("#log-out-btn");
logoutBtn.addEventListener("click", logout);

window.onload = function () {
    checkAuthToken();
    updateLoginStatus();
};


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
            location.reload();
        } else {
            wrongpassword.style.display = "block";
        }
    })
    .catch(error => {
        alert("Det skjedde en feil ved innlogging");
        console.log("Error when sending HTTPS request");
        console.log(error);
    });
}

function logout(){
    sessionStorage.removeItem("username");
    sessionStorage.setItem("loggedIn", "false");
    console.log("Logged out: " + sessionStorage.getItem("loggedIn"));
    sessionStorage.removeItem("groups");
    updateLoginStatus();
    location.reload();
}

function updateLoginStatus(){
    let loggedIn = sessionStorage.getItem("loggedIn");
    let loginBtn = document.querySelector("#log-in-btn");
    let logoutBtn = document.querySelector("#log-out-btn");
    let notLoggedInDisplay = document.querySelector("#not-logged-in");
    let mainDisplay = document.querySelector("#main-display");
    let body = document.querySelector("body");
    console.log("Log in Status.: " + loggedIn);
    if (loggedIn === "true"){
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
        notLoggedInDisplay.style.cssText = "display: none !important";
       mainDisplay.style.display = "block";
      body.style.backgroundColor = "white";
    } else {
        loginBtn.style.display = "block";
        logoutBtn.style.display = "none";
        notLoggedInDisplay.style.display= "block"
        notLoggedInDisplay.style.cssText = "display: flex !important";
        mainDisplay.style.display = "none"
        body.style.backgroundColor = "#80AB82";
    }
}

function registerUser(){
    let username = document.querySelector("#username-reg").value;
    let password = document.querySelector("#password-reg").value;
    let passwordConf = document.querySelector("#password-reg-conf").value;
    let name = document.querySelector("#name-reg").value;
    let passwordMismatch = document.querySelector("#password-mismatch");
    if (username === "" || password === "" || passwordConf === "" || name === ""){
        alert("Alle feltene må fylles ut")
        return;
    }
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
        if (response.status === 201){
            let registerForm = document.querySelector("#register-popup");
            registerForm.style.display = "none";
            usernameTaken.style.display = "none";
            console.log("Registered user: " + username);
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("loggedIn", "true");
            updateLoginStatus();
        } else {
            usernameTaken.style.display = "block";
            console.log("Username already taken");
            console.log(response.status);
        }
    })
    .catch(error => {
        alert("Det skjedde en feil ved opprettelse av brukeren");
        console.log("Error when sending HTTPS request");
        console.log(error);
    });

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

function checkImageExists(url, callback) {
    fetch(url, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                callback(true); // image exists
            } else {
                callback(false); // image does not exist
            }
        })
        .catch(() => {
            callback(false); // request failed, assume image does not exist
        });
}

/*
    GET DATES FOR CURRENT WEEK
 */
function getDatesForCurrentWeek() {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.

    const startDate = new Date(today); // Clone the current date
    startDate.setDate(today.getDate() - currentDayOfWeek + 1); // Start of the week (Sunday as the last day)

    const datesForWeek = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        datesForWeek.push(date);
    }

    return datesForWeek;
}