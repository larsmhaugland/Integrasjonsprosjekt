/* jshint esversion: 8 */

let API_IP = "";
let IMAGEDIR = "Images/";
let ICONDIR = "Images/";
const API_LOCAL = "http://localhost:8080";
const API_REMOTE = "https://10.212.174.249:8080"; //PEKER PÅ DEV SERVER


const chatLinkButton = document.querySelector("#Chat-link");
const kalenderLinkButton = document.querySelector("#Kalender-link");
const oppskriftLinkButton = document.querySelector("#Oppskrift-link");
const handlelisteLinkButton = document.querySelector("#Handleliste-link");
const hjemmeside = !window.location.href.includes("Chat/index.html") && !window.location.href.includes("Kalender/index.html")
    && !window.location.href.includes("Oppskrifter/index.html") && !window.location.href.includes("Handleliste/index.html");
const oppskriftside = window.location.href.includes("Oppskrift/index.html");

if (window.location.hostname === "localhost"){
     API_IP = "http://" + window.location.hostname + ":8080";
} else{
    API_IP = "https://" + window.location.hostname + ":8080";
    IMAGEDIR = "UsrImages/";
}

chatLinkButton.addEventListener("click", (event) => {
    const loginStatus = sessionStorage.getItem("loggedIn");
    if (loginStatus === "true") {
        if (hjemmeside){
            window.location.href = "Chat/index.html";
        } else if(!oppskriftside){
            window.location.href = "../Chat/index.html";
        } else{
            window.location.href = "../../Chat/index.html";
        }
    } else {
        alert("Du må logge inn for å få tilgang til denne siden");
    }
});

kalenderLinkButton.addEventListener("click", (event) => {
    const loginStatus = sessionStorage.getItem("loggedIn");
    if (loginStatus === "true") {
        if (hjemmeside){
            window.location.href = "Kalender/index.html";
        } else if(!oppskriftside){
            window.location.href = "../Kalender/index.html";
        } else {
            window.location.href = "../../Kalender/index.html";
        }
    } else {
        alert("Du må logge inn for å få tilgang til denne siden");
    }
});

oppskriftLinkButton.addEventListener("click", (event) => {
    const loginStatus = sessionStorage.getItem("loggedIn");
    if (loginStatus === "true") {
        if (hjemmeside){
            window.location.href = "Oppskrifter/index.html";
        } else if(!oppskriftside){
            window.location.href = "../Oppskrifter/index.html";
        } else {
            window.location.href = "../../Oppskrifter/index.html";
        }
    } else {
        alert("Du må logge inn for å få tilgang til denne siden");
    }
});

handlelisteLinkButton.addEventListener("click", (event) => {
    const loginStatus = sessionStorage.getItem("loggedIn");
    if (loginStatus === "true") {
        if (hjemmeside){
            window.location.href = "Handleliste/index.html";
        } else if(!oppskriftside){
            window.location.href = "../Handleliste/index.html";
        } else {
            window.location.href = "../../Handleliste/index.html";
        }
    } else {
        alert("Du må logge inn for å få tilgang til denne siden");
    }
});


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

const registerTextPoppup = document.querySelector(".register-btn");
registerTextPoppup.addEventListener("click", (event)=> {event.preventDefault();
    document.getElementById("register-popup").style.display = "block";
});

// Get password inputs
const passwordInput = document.querySelector("#password-reg");
const passwordConfirmInput = document.querySelector("#password-reg-conf");
const passwordValidationMessage = document.querySelector("#password-validation-message");
const passwordMatchMessage = document.querySelector("#password-match-message");
console.log(passwordInput);
passwordInput.addEventListener("input", function () {
    const password = passwordInput.value;
    const minLength = 8; // Minimum password length
    // Validate password length
    const lengthMessage = password.length >= minLength ? "" : `Passordet må være minst ${minLength} karakterer langt.`;

    // Validate if the password contains numbers, !, or ?
    const hasValidCharacters = /[0-9!?.]/.test(password);
    const characterMessage = hasValidCharacters ? "" : "Passordet må inneholde et nummer, ! eller ?";

    // Display validation messages
    passwordValidationMessage.innerHTML = lengthMessage + '<br>' + characterMessage;
});
passwordConfirmInput.addEventListener("input", function () {
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    // Validate if the passwords match
    const matchMessage = password === passwordConfirm ? "" : "Passordene er ikke like.";

    // Display validation message
    passwordMatchMessage.innerHTML = '<br>' + matchMessage;
});

window.onload = function () {
    if(!checkLoginStatus() && !window.location.hostname.includes("localhost")){
        if(!oppskriftside && !hjemmeside) {
            //redirect one level up
            window.location.href = "../index.html";
        } else if (oppskriftside){
            window.location.href = "../../index.html";
        }
    }
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
async function checkLoginStatus(){
    let username = sessionStorage.getItem("username");
    let loggedIn = sessionStorage.getItem("loggedIn");

    //Check if logged in
    if(username && loggedIn === "true"){
        return true;
    }
    //Not logged in
    return false;
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
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("username", username);
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
    location.replace("https://" + window.location.hostname + "/index.html");
}

function updateLoginStatus(){
    let loggedIn = sessionStorage.getItem("loggedIn");
    let loginBtn = document.querySelector("#log-in-btn");
    let logoutBtn = document.querySelector("#log-out-btn");
    let notLoggedInDisplay = document.querySelector("#not-logged-in");
    let mainDisplay = document.querySelector("#main-display");
    let body = document.querySelector("body");

    if (loggedIn === "true"){
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
        notLoggedInDisplay.style.cssText = "display: none !important";
        if(mainDisplay !== null) {
            mainDisplay.style.display = "block";
        }
      body.style.backgroundColor = "white";
    } else {
        loginBtn.style.display = "block";
        logoutBtn.style.display = "none";
        notLoggedInDisplay.style.display= "block";
        notLoggedInDisplay.style.cssText = "display: flex !important";
        if(mainDisplay !== null) {
            mainDisplay.style.display = "none"
        }
        body.style.backgroundColor = "#80AB82";
    }
}

function registerUser(){
    let username = document.querySelector("#username-reg").value;
    let password = document.querySelector("#password-reg").value;
    let passwordConf = document.querySelector("#password-reg-conf").value;
    let name = document.querySelector("#name-reg").value;
    if (username === "" || password === "" || passwordConf === "" || name === ""){
        return;
    }

    if (password !== passwordConf){
        console.log("Passwords do not match");
        alert("Passordene er ikke like")
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