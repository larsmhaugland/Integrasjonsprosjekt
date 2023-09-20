/*
    POP-UP WINDOW
    Log in
*/
const API_IP = config.apiUrl;

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
function checkAuthToken(){
    let username = localStorage.getItem("username");
    let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.startsWith("AuthToken=")) {
            var authToken = cookie.split("=")[1].trim();

            fetch (API_IP + "/user/credentials/checkCookie", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then(response => {
                if (response.status === 200){
                    console.log("Logged in using cookie as: " + username);
                    sessionStorage.setItem("username", username);
                    updateLoginStatus();
                } else {
                    console.log("Wrong username or password");
                    console.log(response.status);
                }
            })
            .catch(error => {
                console.log("Error when sending HTTPS request");
                console.log(error);
            });
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

    fetch(API_IP + "/user/credentials/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
    }).then(response => {
        let wrongpassword = document.querySelector("#wrong-password");

        if (response.status === 200){
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
    updateLoginStatus();
}

function updateLoginStatus(){
    let username = sessionStorage.getItem("username");
    let loginBtn = document.querySelector("#log-in-btn");
    let logoutBtn = document.querySelector("#log-out-btn");
    if (username !== null){
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
    let passwordMismatch = document.querySelector("#password-mismatch");
    if (password !== passwordConf){
        passwordMismatch.style.display = "block";
        console.log("Passwords do not match");
        return;
    }
    let credentials = {"username": username, "password": password};

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
        console.log("Error when sending HTTPS request");
        console.log(error);
    });

}
