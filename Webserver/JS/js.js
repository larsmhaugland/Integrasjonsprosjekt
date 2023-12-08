/***       GLOBAL VARIABLES        ***/
let API_IP = "";
let IMAGEDIR = "Images/";
let ICONDIR = "Images/";
const API_LOCAL = "http://localhost:8080";
const API_REMOTE = "https://10.212.174.249:8080"; //PEKER PÅ DEV SERVER
//Check if on homepage
const hjemmeside = !window.location.href.includes("Chat") && !window.location.href.includes("Kalender") && !window.location.href.includes("Grupper")
    && !window.location.href.includes("Oppskrifter") && !window.location.href.includes("Handleliste") && !window.location.href.includes("Oppskrift");
//Check if on oppskrift page
const oppskriftside = window.location.href.includes("Oppskrift/index.html");

/***        DOM ELEMENTS       ***/
const chatLinkButton = document.querySelector("#Chat-link");
const kalenderLinkButton = document.querySelector("#Kalender-link");
const oppskriftLinkButton = document.querySelector("#Oppskrift-link");
const handlelisteLinkButton = document.querySelector("#Handleliste-link");

//Set API_IP based on hostname (HTTP vs HTTPS)
if (window.location.hostname === "localhost"){
     API_IP = "http://" + window.location.hostname + ":8080";
} else{
    API_IP = "https://" + window.location.hostname + ":8080";
    IMAGEDIR = "UsrImages/";
}

/***        EVENT LISTENERS       ***/

//Event listener for chat navigation button
chatLinkButton.addEventListener("click", (event) => {
    //Check if logged in
    const loginStatus = sessionStorage.getItem("loggedIn");
    //If logged in, redirect to chat page
    if (loginStatus === "true") {
        //Based on which page the user is on, redirect to chat page correctly
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

//Event listener for calendar navigation button
kalenderLinkButton.addEventListener("click", (event) => {
    //Check if logged in
    const loginStatus = sessionStorage.getItem("loggedIn");
    //If logged in, redirect to calendar page
    if (loginStatus === "true") {
        //Based on which page the user is on, redirect to calendar page correctly
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

//Event listener for recipe navigation button
oppskriftLinkButton.addEventListener("click", (event) => {
    //Check if logged in
    const loginStatus = sessionStorage.getItem("loggedIn");
    //If logged in, redirect to recipe page
    if (loginStatus === "true") {
        //Based on which page the user is on, redirect to recipe page correctly
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

//Event listener for shopping list navigation button
handlelisteLinkButton.addEventListener("click", (event) => {
    //Check if logged in
    const loginStatus = sessionStorage.getItem("loggedIn");
    //If logged in, redirect to shopping list page
    if (loginStatus === "true") {
        //Based on which page the user is on, redirect to shopping list page correctly
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

//Event listener for login and register elements (only on homepage)
if(hjemmeside) {
    //Make login popup visible
    let b = document.querySelector("#log-in-btn");
    b.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("log-in-popup").style.display = "block";
    });
    //Make login popup visible
    b = document.querySelector("#log-in-btn2");
    b.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("log-in-popup").style.display = "block";
    });
    //Make login popup invisible
    b = document.querySelector("#close-login-popup");
    b.addEventListener("click", (event) => {
        event.preventDefault();
        let inputs = document.querySelectorAll("#log-in-popup input");
        inputs.forEach(input => input.value = "");
        document.getElementById("log-in-popup").style.display = "none";
    });
    //If the user presses "enter" in the password field or click the login button, try to log in
    let loginBtn = document.querySelector("#log-in-submit");
    loginBtn.addEventListener("click", login);
    let loginPassword = document.querySelector("#password");
    loginPassword.addEventListener("keyup", function (event) {
        if (event.keyCode === 13) { //Enter key
            event.preventDefault();
            loginBtn.click();
        }
    });

    //Try to register user on click or enter
    let registerUserBtn = document.querySelector("#register-user-submit");
    registerUserBtn.addEventListener("click", function (event) {
        event.preventDefault();
        registerUser();
    });
    let registerPassword = document.querySelector("#password-reg-conf");
    registerPassword.addEventListener("keyup", function (event) {
        if (event.keyCode === 13) { //Enter key
            event.preventDefault();
            registerUserBtn.click();
        }
    });

    //Let the user switch between login and register
    let registerSwitchBtn = document.querySelector("#register-switch-btn");
    registerSwitchBtn.addEventListener("click", loginRegisterToggle);
    let loginSwitchBtn = document.querySelector("#login-switch-btn");
    loginSwitchBtn.addEventListener("click", loginRegisterToggle);
    //Make register popup invisible
    let closeRegisterBtn = document.querySelector("#close-register-popup");
    closeRegisterBtn.addEventListener("click", (event) => {
        event.preventDefault();
        let inputs = document.querySelectorAll("#register-popup input");
        inputs.forEach(input => input.value = "");
        document.getElementById("register-popup").style.display = "none";
    });
    //Make register popup visible
    const registerTextPopup = document.querySelector(".register-btn");
    registerTextPopup.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("register-popup").style.display = "block";
    });

    // Get password DOM elements
    const passwordInput = document.querySelector("#password-reg");
    const passwordConfirmInput = document.querySelector("#password-reg-conf");
    const passwordValidationMessage = document.querySelector("#password-validation-message");
    const passwordMatchMessage = document.querySelector("#password-match-message");
    // Validate password on input
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
    // Validate that passwords are the same on input
    passwordConfirmInput.addEventListener("input", function () {
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        // Validate if the passwords match
        const matchMessage = password === passwordConfirm ? "" : "Passordene er ikke like.";

        // Display validation message
        passwordMatchMessage.innerHTML = '<br>' + matchMessage;
    });
}
//Event listener for logout button
let logoutBtn = document.querySelector("#log-out-btn");
logoutBtn.addEventListener("click", logout);

//Set on load function
window.onload = function () {
    //Check if not logged in
    if(!checkLoginStatus()){
        //Check if on homepage or recipe page
        if(!oppskriftside && !hjemmeside) {
            //redirect one level up
            window.location.href = "../index.html";
        } else if (oppskriftside){
            //redirect two levels up
            window.location.href = "../../index.html";
        }
    }
    //Update login status
    updateLoginStatus();
};

/***        FUNCTIONS       ***/

/**
 * Toggles between login and register popups
 */
function loginRegisterToggle(){
    //Get login and register popups
    let loginForm = document.querySelector("#log-in-popup");
    let registerForm = document.querySelector("#register-popup");
    //Toggle between them
    if (loginForm.style.display === "none"){
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
    }
}

/**
 * Checks if the user is logged in
 * @returns {Promise<boolean>} True if logged in, false if not
 */
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

/**
 * Tries to log in with credentials from login form
 */
function login(){
    //Get username and password
    let username = document.querySelector("#username").value;
    let password = document.querySelector("#password").value;

    //Send credentials to server for validation
    let credentials = {"username": username, "password": password};
    fetch(API_IP + "/user/credentials/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
    }).then(response => {
        //Find wrong password message
        let wrongpassword = document.querySelector("#wrong-password");
        //If credentials are correct, log in
        if (response.status === 200){
            //Set session and local storage
            sessionStorage.setItem("loggedIn", "true");
            sessionStorage.setItem("username", username);
            let loginForm = document.querySelector("#log-in-popup");
            loginForm.style.display = "none";
            wrongpassword.style.display = "none";
            //Reload page
            location.reload();
        } else {
            //Display wrong password message
            wrongpassword.style.display = "block";
        }
    })
    .catch(error => {
        //Display error message
        alert("Det skjedde en feil ved innlogging");
        console.log("Error when sending HTTPS request");
        console.log(error);
    });
}

/**
 * Log out
 */
function logout(){
    //Remove session and local storage
    sessionStorage.removeItem("username");
    sessionStorage.setItem("loggedIn", "false");
    sessionStorage.removeItem("groups");
    updateLoginStatus();
    //Check if on homepage or recipe page
    if(!oppskriftside && !hjemmeside) {
        //redirect one level up
        window.location.href = "../index.html";
    } else if (oppskriftside){
        //redirect two levels up
        window.location.href = "../../index.html";
    }
}

/**
 * Update login status
 */
function updateLoginStatus(){
    //Get login status
    let loggedIn = sessionStorage.getItem("loggedIn");
    //Get login related elements
    let loginBtn = document.querySelector("#log-in-btn");
    let logoutBtn = document.querySelector("#log-out-btn");
    let notLoggedInDisplay = document.querySelector("#not-logged-in");
    let mainDisplay = document.querySelector("#main-display");
    let body = document.querySelector("body");
    //Update login related elements
    if (loggedIn === "true"){
        //Logged in
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
        if(notLoggedInDisplay !== null) {
            notLoggedInDisplay.style.cssText = "display: none !important";
        }
        if(mainDisplay !== null) {
            mainDisplay.style.display = "block";
        }
        body.style.backgroundColor = "white";
    } else {
        //Not logged in
        loginBtn.style.display = "block";
        logoutBtn.style.display = "none";
        if(notLoggedInDisplay !== null) {
            notLoggedInDisplay.style.cssText = "display: flex !important";
        }
        if(mainDisplay !== null) {
            mainDisplay.style.display = "none";
        }
        body.style.backgroundColor = "#80AB82";
    }
}

/**
 * Register a new user
 */
function registerUser(){
    //Get username, password, password confirmation and name
    let username = document.querySelector("#username-reg").value;
    let password = document.querySelector("#password-reg").value;
    let passwordConf = document.querySelector("#password-reg-conf").value;
    let name = document.querySelector("#name-reg").value;

    //Check if any fields are empty
    if (username === "" || password === "" || passwordConf === "" || name === ""){
        return;
    }

    //Check if passwords match
    if (password !== passwordConf){
        console.log("Passwords do not match");
        alert("Passordene er ikke like");
        return;
    }
    //Send credentials to server for validation
    let credentials = {"username": username, "password": password, "name": name};
    fetch(API_IP + "/user/credentials/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
    }).then(response => {
        let usernameTaken = document.querySelector("#username-taken");
        if (response.status === 201){
            //Success - log in
            let registerForm = document.querySelector("#register-popup");
            registerForm.style.display = "none";
            usernameTaken.style.display = "none";
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("loggedIn", "true");
            updateLoginStatus();
        } else {
            //Username already taken or other error
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

/**
 * Generates a random string of the given length
 * @param length The length of the string to generate
 * @returns {string} The generated string
 */
function generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * Checks if the given image exists on the server
 * @param url The url of the image to check
 * @param callback The callback function to call when the check is done
 */
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

/**
 * Get dates for the days of current week
 * @returns {*[]} An array of dates for the current week
 */
function getDatesForCurrentWeek() {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.

    const startDate = new Date(today); // Clone the current date
    startDate.setDate(today.getDate() - currentDayOfWeek + 1); // Start of the week (Sunday as the last day)

    // Calculate dates for the current week and return them
    const datesForWeek = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        datesForWeek.push(date);
    }

    return datesForWeek;
}