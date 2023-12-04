let dinnerPopup = document.querySelector("#dinner-popup");
let newDinnerBtns = document.querySelectorAll(".dinner-btn");
let closeDinnerPopup = document.querySelector("#close-dinner-popup");
let dinnerForm = document.querySelector("#new-dinner-form");
let groupDropdown = document.querySelector("#group-dropdown");
let currentDay;
let allDays = ["mandag","tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"];
let Recipes = [];
let calendar = [[]];
let responsibleCalendar = [[]];
let inputCalendar = null;
let groups = [];
let groupIDSentAsParam = "";

beginning();
async function beginning() {
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
    if (groupDropdown.selectedIndex !== 0) {
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
                    resetCalendarAndSetAllDays(groupID);
                });
            } else {
                console.log("Error when fetching calendar");
            }
        });
    }
}

function resetCalendarAndSetAllDays(groupID) {
    console.log("setting calendar");
    let dates = getDatesForCurrentWeek();
    let labels = document.querySelectorAll("label");
    let links = document.querySelectorAll("a");
    let options = document.querySelectorAll("#group-dropdown option");
    if (labels.length > 0) {
        labels.forEach(function (label) {
            if (label.textContent.includes("Ansvarlig: ")) {
                label.textContent = "";
            } else if (label.textContent.includes("Middag: ")) {
                label.parentNode.removeChild(label);
            } else if (label.textContent.includes("Ingen middag valgt. ")) {
                //delete label
                label.parentNode.removeChild(label);
            }
        });
    }
    if (links.length > 0) {
        links.forEach(function (link) {
            if (link.textContent.includes("Middag: ")) {
                link.parentNode.removeChild(link);
            }
        });

    }
    if (inputCalendar == null) {
        console.log("inputCalendar is null");
        return;
    }
    const dateKeys = Object.keys(inputCalendar);
    for (let j = 0; j < options.length-1; j++) {
        if (groupID === options[j+1].value) {
            dateKeys.forEach(dateKey => {
                if (dateKey in inputCalendar) {
                    let dateData = inputCalendar[dateKey];
                    let date = new Date(dateKey);
                    let day = date.getDate();
                    let month = date.getMonth();
                    let year = date.getFullYear();
                    let dateString = year + "-" + (month + 1) + "-" + day;
                    let dinner = dateData.recipe;

                    console.log("group found");
                    if (!responsibleCalendar[j]) {
                        responsibleCalendar[j] = [];
                    }
                    if (!responsibleCalendar[j][0]) {
                        responsibleCalendar[j][0] = groupID;
                    }

                    // Loop through the date keys and access the data for each date
                    for (let k = 0; k < dates.length; k++) {
                        const currentDate = new Date(dates[k]);
                        currentDate.setHours(0, 0, 0, 0); // Set time to midnight
                        date.setHours(0, 0, 0, 0); // Set time to midnight for the date
                        let div = document.getElementById(allDays[k]);
                        if (currentDate.getTime() === date.getTime()) {
                            setCalenderOnDate(allDays[k], dateData, div, j, k, groupID);
                        } else {
                            let elementText = allDays[k] + "-textbox";
                            let textDiv = div.querySelector("#" + elementText);
                            if (textDiv.textContent.trim() === "") {
                                let label = document.createElement("label");
                                label.innerHTML = '<br>' + "Ingen middag valgt. ";
                                label.id = allDays[k] + "-dinner";
                                textDiv.appendChild(label);
                            }
                        }
                    }
                }

            });
        }
    }
}

function setCalenderOnDate(day, dateData, div, j, k, groupID){

    let customDinner = dateData.customRecipe;
    let responsible = dateData.responsible;

    let label = div.querySelector('.selectedMemberLabel');
    // Add a label for "responsible" to the day's div
    label.innerHTML = "Ansvarlig: " + responsible;
    if (responsible !== "") {
        responsibleCalendar[j][k + 1] = responsible[0];
    }
    let elementText = allDays[k] + "-textbox";
    let textDiv = div.querySelector("#" + elementText);
    textDiv.innerHTML = "";
    textDiv.appendChild(label);
    let recipe = findRecipesInCalendar(customDinner);
    if (recipe != null) {
        // Create a link
        let link = document.createElement("a");
        link.setAttribute("class", "dinner-link")

        link.innerHTML = '<br>' + customDinner;
        let href = "../Oppskrifter/Oppskrift/index.html?id="+recipe.documentID; // Set the link's href
        link.setAttribute("href", href);
        label.id = currentDay + "-dinner";
        textDiv.appendChild(link);
    }else{
        // Create a label
        let label = document.createElement("label");
        label.setAttribute("id", elementText);
        label.innerHTML = '<br>' + customDinner;
        label.id = currentDay + "-dinner";
        textDiv.appendChild(label);
    }
    updateCalendarArray(groupID,k, customDinner);
}

//update calendar array function
function updateCalendarArray(groupID, index, dinner){
    let options = document.querySelectorAll("#group-dropdown option");
    groups.forEach((group, i) => {
        if (group.documentID === groupID) {
            if (!calendar[i]) {
                calendar[i] = [];
            }
            if(group.documentID.name===options[i].value){
                calendar[i][index] = dinner;
            }
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

                    let responsible;
                    if (!responsibleCalendar[gIndex] ||
                        responsibleCalendar[gIndex].length <= dIndex+1){
                        responsible = "";
                    }else{
                        responsible = responsibleCalendar[gIndex][dIndex+1];
                    }
                    const data = {
                        "date": dateString,
                        "customRecipe": dinner,
                        "recipe": dinnerID,
                        "responsible": [responsible],
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




groupDropdown.addEventListener("change", async function (event){
    console.log("dropdown changed");
    await getCalenderData();
});

newDinnerBtns.forEach (function (btn)
{
    btn.addEventListener("click", function (event){
        if(!checkLoginStatus()){
            alert("Du må logge inn for å legge til i kalenderen");
            return;
        }
        if (currentDay !== null) {
            currentDay = event.target.parentNode.parentNode.id;
            console.log("currentDay: " + currentDay);
        } else {
            console.error("Unable to get the parent node's id");
        }
        dinnerPopup.style.display = "block";
    });
});

let allPopups = document.querySelectorAll('.popup');
allPopups.forEach(function (popup) {
    console.log("Closing popup");
    popup.style.display = "none";
});


// Function to create a popup with group members
function createMemberPopup(groupData, day) {
    const daySection = document.getElementById(day);

    // Check if there are members to display
    if (groupData.members && Object.keys(groupData.members).length > 0) {

        // Create a popup div
        const popup = document.createElement("div");
        // Create the overlay
        const overlay = document.createElement("div");
        overlay.classList.add("overlay");
        overlay.addEventListener("click", function () {
            popup.style.display = "none";
            overlay.style.display = "none";
        });
        popup.classList.add("popup");

        // Iterate through members using for...in loop
        for (const memberKey in groupData.members) {
            if (groupData.members.hasOwnProperty(memberKey)) {
                // Create a closure to capture the correct memberKey value
                (function (key) {
                    const memberButton = document.createElement("button");
                    memberButton.innerText = key;
                    memberButton.addEventListener('click', function () {
                        let label = daySection.querySelector('.selectedMemberLabel');
                        if (!label) {
                            const newLabel = document.createElement('label');
                            newLabel.className = 'selectedMemberLabel';
                            daySection.appendChild(newLabel);
                            label = daySection.querySelector('.selectedMemberLabel');
                        }
                        label.textContent = 'Ansvarlig: ' + key;
                        popup.style.display = "none";
                        overlay.style.display = "none";

                        // Find the group in the first dimension
                        let groupIndex = -1;
                        for (let i = 0; i < responsibleCalendar.length; i++) {
                            if (responsibleCalendar[i] && responsibleCalendar[i][0] === groupData.documentID) {
                                groupIndex = i;
                                break;
                            }
                        }

                        // If the group doesn't exist, create it
                        if (groupIndex === -1) {
                            groupIndex = responsibleCalendar.length;
                            responsibleCalendar.push([groupData.documentID]);
                        }

                        // Ensure there are enough days (second dimension) for each group
                        for (let i = 0; i < responsibleCalendar.length; i++) {
                            if(responsibleCalendar[i]){
                                while (responsibleCalendar[i].length < 8) {
                                    responsibleCalendar[i].push("");
                                }
                            }

                        }
                        // Add the memberKey to the group array in the second dimension
                        responsibleCalendar[groupIndex][allDays.indexOf(day) + 1] = key;
                        sendCalendarToServer();

                    });

                    popup.appendChild(memberButton);
                })(memberKey);
            }
        }

        // Append the popup and overlay to the day section
        daySection.appendChild(overlay);
        daySection.appendChild(popup);

        // Show the popup and overlay
        popup.style.display = "block";
        overlay.style.display = "block";
    }
}
// Add click event listeners to "Responsible" buttons
let responsibleButtons = document.querySelectorAll('.btn.responsible');

responsibleButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        let dropdown = document.getElementById("group-dropdown");
        if (dropdown.selectedIndex !== 0) {
            let selectedOption = dropdown.options[dropdown.selectedIndex];
            let groupID = selectedOption.value
            let selectedGroup = groups.find(function (group) {
                return group.documentID === groupID;
            });
            let daySection = button.closest('[id]');
            let id = null;
            if (daySection) {
                id = daySection.id; // This will give you for example "tirsdag"
            }
            if (selectedGroup && id) {
                //openPopup();
                createMemberPopup(selectedGroup, id);
            }
        }
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
        let dayDiv = document.getElementById(currentDay);
        let textDiv = dayDiv.querySelector("#" + currentDay + "-textbox");
        let element = textDiv.querySelector("#" + currentDay + "-dinner");
        let responsibleLabel = dayDiv.querySelector(".selectedMemberLabel");
        responsibleLabel.textContent = "Ansvarlig: ";
        console.log("element: " + element);
        let recipe = findRecipesInCalendar(dinnerName);
        if (!element) {
            if(recipe){
                // Create a link
                element = document.createElement("a");

            }else {
                // Create a label
                element = document.createElement("label");
            }
            element.id = currentDay + "-dinner";
            console.log("elementID: " + element.id);
        }
        if(recipe){
            console.log("found recipe");

            if(element instanceof HTMLLabelElement) { // Check if it's a label
                element.parentNode.removeChild(element); // Remove the label
                // Create a link
                element = document.createElement("a");
                element.id = currentDay + "-dinner";
                textDiv.appendChild(element);
            }


            element.setAttribute("class", "dinner-link");
            element.innerHTML = dinnerName;
            let href = "../Oppskrifter/Oppskrift/index.html?id="+recipe.documentID; // Set the link's href
            element.setAttribute("href", href);
        }else{
            console.log("could not find recipe");
            element.innerHTML = '<br>' + dinnerName;
        }

        // Append the created element to the 'div'
        dayDiv.appendChild(element);

        event.preventDefault();
        dinnerPopup.style.display = "none";
        document.querySelector("#dinner-name").value = "";
        for (let i = 0; i < groups.length; i++) {
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
    let listData = '';

    if (list.length <= 2) {
        const userValue = recipeInput.value;
        listData += '<li>' + userValue + '</li>';
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

function findRecipesInCalendar(dinner) {
    const matchingRecipes = [];

    Recipes.forEach(recipe => {
        if (recipe.name === dinner) {
            matchingRecipes.push(recipe);
        }
    });

    if (matchingRecipes.length > 0) {
        return matchingRecipes[0];
    }

    console.log("No matches found");
    return null;
}

