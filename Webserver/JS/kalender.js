let dinnerPopup = document.querySelector("#dinner-popup");
let newDinnerBtns = document.querySelectorAll(".dinner-btn");
let closeDinnerPopup = document.querySelector("#close-dinner-popup");
let dinnerForm = document.querySelector("#new-dinner-form");
let groupDropdown = document.querySelector("#group-dropdown");
let currentDay;
let allDays = ["mandag","tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"];
let Recipes = [];
let calendar = [[]];
let groups = [];


window.onload = async function () {
    await getRecipes(Recipes);
    await retrieveGroups();
    groups = JSON.parse(sessionStorage.getItem("groups"));
    displayGroups(groups);
}

sendCalendarToServer()

// post request to send calendar to server

function sendCalendarToServer() {
    const dates = getDatesForCurrentWeek();
    console.log(dates);
    calendar.forEach((groupCalendar, gIndex) => {
        if (groupCalendar) {
            groupCalendar.forEach((dinner, dIndex) => {
                if (dinner) {
                    const date = dates[dIndex];
                    const dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
                    const group = groups[gIndex];
                    const data = {
                        "date": dateString,
                        "dinner": dinner,
                        "group": group
                    };
                    console.log(data);
                    /*
                    fetch(API_IP + "/calendar", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data)
                    });
                    */
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

groupDropdown.addEventListener("change", function (event){
    console.log("dropdown changed");
    let labels = document.querySelectorAll("label");
    if(labels.length > 0){
        labels.forEach(function (label) {
            label.remove();
        });
    }
   for (let i=0; i<groups.length; i++) {
        if (groups[i].name === groupDropdown.value) {
            console.log("group found");
            console.log(calendar);
            if (calendar[i]) {
                for (let j = 0; j < calendar[i].length; j++) {
                    if (calendar[i][j]) {
                        console.log("day found");
                        let label = document.createElement("label");
                        label.innerHTML = '<br>' + calendar[i][j];
                        label.setAttribute("id", allDays[j] + " textbox");
                        let div = document.getElementById(allDays[j]);
                        div.appendChild(label);
                    }
                }
            } else {
                //this is going to happen if the groups calendar is empty which will be the case until you add
                // the first dinner that week to the calendar
                console.log("calendar[" + i + "] is undefined");
            }
        }
    }
});

newDinnerBtns.forEach (function (btn)
{
    btn.addEventListener("click", function (event){
        if(!checkAuthToken()){
            alert("Du må logge inn for å legge til i kalenderen");
            return;
        }
        let day = event.target.parentNode.id;
        console.log(day);
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
//if(document.querySelector("#label"))
function addDinnerToCalendar() {
    let dinnerName = document.querySelector("#dinner-name").value;
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
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].name === groupDropdown.value) {
                for (let j = 0; j < allDays.length; j++) {
                    if (allDays[j] === currentDay) {
                        if (!calendar[i]) {
                            calendar[i] = [];
                        }
                        calendar[i][j] = dinnerName;
                        console.log(calendar);
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
        if(Recipes.length > 1){
            suggestions = suggestions.concat(Recipes[0], Recipes[1]);
        }else if (Recipes.length > 0){
            suggestions = suggestions.concat(Recipes[0]);
        }
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
    }
}
function showSuggestions(list) {
    const recipeInput = document.getElementById("dinner-name");
    const resultsList = document.getElementById("search-results");
    let listData;
    let userValue;

    if (list.length < 2) {
        userValue = recipeInput.value;
        listData = '<li>' + userValue + '</li>';
    } else {
        listData = list.join('');
    }
    resultsList.innerHTML = listData;
}

function displayGroups(groups){
    let dropdown = document.querySelector("#group-dropdown");
    let option = document.createElement("option");
    option.textContent = "Velg gruppe";

    groups.forEach(group => {
        let option = document.createElement("option");
        option.value = group.name;
        option.textContent = group.name;
        dropdown.appendChild(option);
    });
}

