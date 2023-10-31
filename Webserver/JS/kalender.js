let dinnerPopup = document.querySelector("#dinner-popup");
let newDinnerBtns = document.querySelectorAll(".dinner-btn");
let closeDinnerPopup = document.querySelector("#close-dinner-popup");
let dinnerForm = document.querySelector("#new-dinner-form");
let groupDropdown = document.querySelector("#group-dropdown");
let currentDay;
let allDays = ["mandag","tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"];
let Recipes = [];
let calendar = [[]];
let inputCalendar;
let groups = [];
let groupIDSentAsParam = "";

beginning();
async function beginning() {
    console.log("login status: " + sessionStorage.getItem("loggedIn"));
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams) {
        groupIDSentAsParam = urlParams.get('groupID');
    }
    await getRecipes(Recipes);
    await retrieveGroups();
    groups = JSON.parse(sessionStorage.getItem("groups"));
    displayGroups(groups);
    await getCalenderData();
}


async function getCalenderData(){
    let groupID = groupDropdown.value;
    fetch(`${API_IP}/group/schedule?groupID=${groupID}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                inputCalendar = data;
                setCalendar(groupID);
            });
        } else {
            console.log("Error when fetching calendar");
        }
    });
}

function setCalendar(groupID){
    console.log("setting calendar");
    let dates = getDatesForCurrentWeek();
    let options = document.querySelectorAll("#group-dropdown option");
    let labels = document.querySelectorAll("label");
    const dateKeys = Object.keys(inputCalendar);

    for (let j=0; j<options.length; j++){
        if (groupID === options[j].value) {
            console.log("group found");
            // Loop through the date keys and access the data for each date
            dateKeys.forEach(dateKey => {
                if (dateKey in inputCalendar) {
                    let dateData = inputCalendar[dateKey];
                    let date = new Date(dateKey);
                    let day = date.getDate();
                    let month = date.getMonth();
                    let year = date.getFullYear();
                    let dateString = year + "-" + (month + 1) + "-" + day;
                    let customDinner = dateData.customRecipe;
                    let dinner = dateData.recipe;
                    let responsible = dateData.responsible;


                    for (let k=0; k<dates.length; k++){
                        const currentDate = new Date(dates[k]);
                        currentDate.setHours(0, 0, 0, 0); // Set time to midnight
                        date.setHours(0, 0, 0, 0); // Set time to midnight for the date
                        if (currentDate.getTime() === date.getTime()){
                            console.log("date found");
                            if(labels.length > 0){
                                labels.forEach(function (label) {
                                    label.remove();
                                });
                            }
                            let label = document.createElement("label");
                            label.innerHTML = '<br>' + customDinner;
                            label.setAttribute("id", allDays[k] + " textbox");
                            let div = document.getElementById(allDays[k]);
                            div.appendChild(label);
                            updateCalendarArray(groupID,k, customDinner);
                        }
                    }
                }
            });
        }
    }
}
//update calendar array function
function updateCalendarArray(groupID, index, dinner){
    groups.forEach((group, i) => {
        if (group.documentID === groupID) {
            if (!calendar[i]) {
                calendar[i] = [];
            }
            calendar[i][index] = dinner;
        }
    });
}
// post request to send calendar to server

function sendCalendarToServer() {
    console.log("sending calendar to server");
    const dates = getDatesForCurrentWeek();
    calendar.forEach((groupCalendar, gIndex) => {
        if (groupCalendar) {
            groupCalendar.forEach((dinner, dIndex) => {
                if (dinner) {
                    const date = dates[dIndex];
                    const dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
                    const group = groups[gIndex];
                    let dinnerID = "";
                    if(Recipes.find(recipe => recipe.name === dinner)){
                        dinnerID = Recipes.find(recipe => recipe.name === dinner).documentID;
                    }
                    const matManneDame = [];
                    const data = {
                        "date": dateString,
                        "customRecipe": dinner,
                        "recipe": dinnerID,
                        "responsible": matManneDame,
                    };

                    fetch(`${API_IP}/group/schedule?groupID=${group.documentID}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data)
                    }).then(response => {
                        if (response.status === 200) {
                            console.log("Successfully added dinner to calendar");
                        } else {
                            console.log("Error when adding dinner to calendar");
                        }
                    });

                }
            });
        }
    });
}

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

groupDropdown.addEventListener("change", async function (event){
    console.log("dropdown changed");
    await getCalenderData();
});

newDinnerBtns.forEach (function (btn)
{
    btn.addEventListener("click", function (event){
        if(!checkAuthToken()){
            alert("Du må logge inn for å legge til i kalenderen");
            return;
        }
        let day = event.target.parentNode.id;
        currentDay = day;
        dinnerPopup.style.display = "block";
    });
});

closeDinnerPopup.addEventListener("click", function (event){
    dinnerPopup.style.display = "none";
});

dinnerForm.addEventListener("submit", function (event) {
    event.preventDefault();
});

function addDinnerToCalendar() {
    let dinnerName = document.querySelector("#dinner-name").value;
    let options = document.querySelectorAll("#group-dropdown option");
    let selectedGroup;
    options.forEach(option => {
        if (option.selected){
            selectedGroup = option.textContent;
        }
    });
    if (event.key === "Enter") {
        console.log("dinnername: " + dinnerName);
        let label = document.getElementById(currentDay + " textbox");
        if (label) {
            // If it exists, update its content
            label.innerHTML = '<br>' + dinnerName;
        } else {
            label = document.createElement("label");
            label.innerHTML = '<br>' + dinnerName;
            label.setAttribute("id", currentDay + " textbox");
            let div = document.getElementById(currentDay);
            div.appendChild(label);
        }
        event.preventDefault();
        dinnerPopup.style.display = "none";
        document.querySelector("#dinner-name").value = "";
        console.log(groups)
        for (let i = 0; i < groups.length; i++) {
            console.log("group: " + groups[i].name + " groupDropdown: " + selectedGroup);
            if (groups[i].name === selectedGroup) {
                for (let j = 0; j < allDays.length; j++) {
                    console.log("adding dinner to calendar");
                    if (allDays[j] === currentDay) {
                        if (!calendar[i]) {
                            calendar[i] = [];
                        }
                        calendar[i][j] = dinnerName;
                    }
                }
            }
        }
        sendCalendarToServer();
    }
    else{
        autocomplete(currentDay, dinnerName);
    }
}

function autocomplete(day, text){
    const recipeInput = document.querySelector("#dinner-name");
    const recipeList = document.querySelector("#search-results");
    let suggestions = [];
    if (text.length > 0) {
        //TODO: Legg til forslag øverst i listen (2 forslag)
        //suggestions = GETFORSLAG()
        /*
        if(Recipes.length > 1){
            suggestions = suggestions.concat(Recipes[0], Recipes[1]);
        }else if (Recipes.length > 0){
            suggestions = suggestions.concat(Recipes[0]);
        }
        */
        //Finner oppskrifter som matcher søket substring
        const filteredRecipes = Recipes.filter((data) => {
            return data.name.toLowerCase().includes(text.toLowerCase());
        });
        suggestions = suggestions.concat(filteredRecipes);
        //Lager listeelementer av forslagene
        suggestions = suggestions.map((data) => {
            return data = '<li>' + data.name + '</li>';
        });
        //Highlight box med funky farge ellernosånt
        recipeInput.classList.add("active");
        //Viser forslagene
        showSuggestions(suggestions, day);

        //Legger til eventlistener på alle forslagene
        let allList = recipeList.querySelectorAll("li");
        for (let i = 0; i < allList.length; i++) {
            allList[i].addEventListener("click", () => {
                //Legger til valgt oppskrift i inputfeltet
                const selectedRecipe = allList[i].textContent;
                recipeInput.value = selectedRecipe;
                recipeInput.classList.remove("active");
                autocomplete(day, selectedRecipe);
            });
        }
    } else {
        recipeInput.classList.remove("active");
        recipeList.innerHTML = "";
    }
}
function showSuggestions(list) {
    const recipeInput = document.getElementById("dinner-name");
    const resultsList = document.getElementById("search-results");
    let listData;
    let userValue;

    if (list.length <= 2) {
        userValue = recipeInput.value;
        listData = '<li>' + userValue + '</li>';
    }
    listData += list.join('');
    resultsList.innerHTML = listData;
}

function displayGroups(groups){
    let dropdown = document.querySelector("#group-dropdown");
    let option = document.createElement("option");
    option.textContent = "Velg gruppe";

    groups.forEach(group => {
        let option = document.createElement("option");
        option.value = group.documentID;
        option.textContent = group.name;

        if (groupIDSentAsParam){
            if (group.documentID === groupIDSentAsParam) {
                option.selected = true; // Set the option as selected
            }
        }

        dropdown.appendChild(option);
    });
}

