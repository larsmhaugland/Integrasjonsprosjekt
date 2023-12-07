
/**
 * @file kalender.js
 * @brief This file contains the calendar functions for the application.
 */

/* jshint esversion: 8 */
let dinnerPopup = document.querySelector("#dinner-popup"); // The popup for adding a dinner
let newDinnerBtns = document.querySelectorAll(".dinner-btn"); // The buttons for adding a dinner
let closeDinnerPopup = document.querySelector("#close-dinner-popup"); // The button for closing the dinner popup
let dinnerForm = document.querySelector("#new-dinner-form"); // The form for adding a dinner
let groupDropdown = document.querySelector("#group-dropdown"); // The dropdown for selecting a group
let currentDay; // The day selected to add information to
let allDays = ["mandag","tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"]; // Array of all days
let Recipes = []; // Array containing all recipes
let calendar = [[]]; // array containing all dinners for each group
let responsibleCalendar = [[]]; // array containing all the members responsible for dinners for each group
let inputCalendar = null; // The calendar data retrieved from the database
let groups = []; // Array containing all groups
let groupIDSentAsParam = ""; // The group ID sent as a parameter in the URL

beginning();

/**
 * @brief Entry point for the application.
 *
 * This function is called when the application starts.
 * It retrieves parameters from the URL, gets recipes, retrieves groups, and displays them.
 * Also, it fetches calendar data.
 */
async function beginning() {
    // Retrieve parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams) {
        groupIDSentAsParam = urlParams.get('groupID');
    }

    // Get recipes asynchronously
    await getRecipes(Recipes);

    // Retrieve and display groups
    await retrieveGroups();
    groups = JSON.parse(sessionStorage.getItem("groups"));
    displayGroups(groups);

    // Fetch calendar data
    await getCalenderData();
}


/**
 * @brief Fetch calendar data for a selected group.
 *
 * This asynchronous function retrieves calendar data for the selected group from the server.
 * If the group is selected in the dropdown, it sends a GET request to the server endpoint.
 * Upon successful retrieval, it updates the inputCalendar and triggers a function to reset and set all days on the calendar.
 */
async function getCalenderData() {
    // Check if a group is selected in the dropdown
    if (groupDropdown.selectedIndex !== 0) {
        // Get the selected group's ID
        let groupID = groupDropdown.value;

        // Fetch calendar data from the server
        fetch(`${API_IP}/group/schedule?groupID=${groupID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(response => {
            // Check if the response is successful (status code 200)
            if (response.status === 200) {
                // Parse the response data as JSON
                response.json().then(data => {
                    // Update inputCalendar with the retrieved data
                    inputCalendar = data;

                    // Reset the calendar and set all days
                    resetCalendarAndSetAllDays(groupID);
                });
            } else {
                // Log an error message if the response status is not 200
                console.error("Error when fetching calendar");
            }
        });
    }
}


/**
 * @brief Reset calendar and set all days for a specific group.
 *
 * This function clears existing labels and links related to dinners in the calendar,
 * then sets new labels and links based on the input calendar data for a specific group.
 *
 * @param {string} groupID - The ID of the group for which the calendar is being reset.
 */
function resetCalendarAndSetAllDays(groupID) {
    console.log("Setting calendar");

    // Get dates for the current week
    let dates = getDatesForCurrentWeek();

    // Select all labels, links, and options related to the calendar
    let labels = document.querySelectorAll("label");
    let links = document.querySelectorAll("a");
    let options = document.querySelectorAll("#group-dropdown option");

    // Clear existing labels and links
    if (labels.length > 0) {
        labels.forEach(function (label) {
            // Check and remove labels based on content
            if (label.textContent.includes("Ansvarlig: ")) {
                label.textContent = "";
            } else if (label.textContent.includes("Middag: ")) {
                label.parentNode.removeChild(label);
            } else if (label.textContent.includes("Ingen middag valgt. ")) {
                label.parentNode.removeChild(label);
            }
        });
    }

    if (links.length > 0) {
        links.forEach(function (link) {
            // Remove links related to dinners
            if (link.textContent.includes("Middag: ")) {
                link.parentNode.removeChild(link);
            }
        });
    }

    // Check if inputCalendar is null
    if (inputCalendar == null) {
        console.log("inputCalendar is null");
        return;
    }

    // Iterate through options to find the selected group
    const dateKeys = Object.keys(inputCalendar);
    for (let j = 0; j < options.length - 1; j++) {
        if (groupID === options[j + 1].value) {
            dateKeys.forEach(dateKey => {
                // Check if the dateKey exists in inputCalendar
                if (dateKey in inputCalendar) {
                    let dateData = inputCalendar[dateKey];
                    let date = new Date(dateKey);

                    console.log("Group found");

                    // Initialize responsibleCalendar array if not already initialized
                    if (!responsibleCalendar[j]) {
                        responsibleCalendar[j] = [];
                    }
                    if (!responsibleCalendar[j][0]) {
                        responsibleCalendar[j][0] = groupID;
                    }

                    // Loop through the date keys and access the data for each date
                    for (let k = 0; k < dates.length; k++) {
                        const currentDate = new Date(dates[k]);

                        // Sets the time to the same so that they can be compared
                        currentDate.setHours(0, 0, 0, 0);
                        date.setHours(0, 0, 0, 0);

                        let div = document.getElementById(allDays[k]);

                        // Check if the current date matches the date in the calendar data
                        if (currentDate.getTime() === date.getTime()) {
                            setCalenderOnDate(dateData, div, j, k, groupID);
                        } else {
                            // If no dinner is chosen, display a label indicating that
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


/**
 * @brief Set calendar information for a specific date.
 *
 * This function populates the provided day's div with information such as the responsible member,
 * the custom dinner recipe, and a link to the recipe details if available.
 *
 * @param {Object} dateData - The data for the specific date from the calendar.
 * @param {HTMLElement} div - The HTML element representing the day's div.
 * @param {number} j - Index indicating the group in the responsibleCalendar array.
 * @param {number} k - Index indicating the day in the responsibleCalendar array.
 * @param {string} groupID - The ID of the group associated with the calendar data.
 */
function setCalenderOnDate(dateData, div, j, k, groupID) {
    let customDinner = dateData.customRecipe;
    let responsible = dateData.responsible;

    // Select the label element in the day's div
    let label = div.querySelector('.selectedMemberLabel');

    // Add a label for "responsible" to the day's div
    label.innerHTML = "Ansvarlig: " + responsible;
    if (responsible !== "") {
        responsibleCalendar[j][k + 1] = responsible[0];
    }

    // Select the textDiv element in the day's div
    let elementText = allDays[k] + "-textbox";
    let textDiv = div.querySelector("#" + elementText);
    textDiv.innerHTML = "";
    textDiv.appendChild(label);

    let recipe = findRecipesInCalendar(customDinner);
    if (recipe != null) {
        // Create a link
        let link = document.createElement("a");
        link.setAttribute("class", "dinner-link");
        link.innerHTML = '<br>' + "Middag: " + customDinner;
        let href = "../Oppskrifter/Oppskrift/index.html?id=" + recipe.documentID; // Set the link's href
        link.setAttribute("href", href);
        label.id = allDays[k] + "-dinner";
        textDiv.appendChild(link);
    } else {
        // Create a label
        let label = document.createElement("label");
        label.setAttribute("id", elementText);
        label.innerHTML = '<br>' + "Middag: " + customDinner;
        label.id = allDays[k] + "-dinner";
        textDiv.appendChild(label);
    }

    // Update the responsibleCalendar array
    updateCalendarArray(groupID, k, customDinner);
}


/**
 * @brief Update the calendar array with dinner information for a specific group.
 *
 * This function updates the calendar array with the provided dinner information
 * at a specific index for the group identified by the given group ID.
 *
 * @param {string} groupID - The ID of the group for which the calendar array is updated.
 * @param {number} index - The index indicating the position in the calendar array to update.
 * @param {string} dinner - The dinner information to be stored in the calendar array.
 */
function updateCalendarArray(groupID, index, dinner) {
    // Select all options related to the group dropdown
    let options = document.querySelectorAll("#group-dropdown option");

    // Iterate through groups to find the specified group by its ID
    groups.forEach((group, i) => {
        if (group.documentID === groupID) {
            // Initialize the calendar array for the group if not already initialized
            if (!calendar[i]) {
                calendar[i] = [];
            }

            // Check if the group's document ID matches the selected option value
            if (group.documentID.name === options[i].value) {
                // Update the calendar array at the specified index with the dinner information
                calendar[i][index] = dinner;
            }
        }
    });
}


/**
 * @brief Send the current calendar data to the server via a POST request.
 *
 * This function iterates through the current calendar data, extracting information for each dinner entry.
 * It then constructs a POST request payload and sends it to the server endpoint for updating the group schedule.
 * The payload includes details such as the date, custom recipe, recipe ID, and responsible member.
 *
 * @remarks This function assumes a valid server endpoint for updating group schedules and proper authentication.
 */
function sendCalendarToServer() {
    console.log("Sending calendar to server");

    // Get dates for the current week
    const dates = getDatesForCurrentWeek();

    // Iterate through the calendar data
    calendar.forEach((groupCalendar, gIndex) => {
        if (groupCalendar) {
            groupCalendar.forEach((dinner, dIndex) => {
                if (dinner) {
                    // Extract date information
                    const date = dates[dIndex];
                    const dateString = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

                    // Extract group information
                    const group = groups[gIndex];

                    // Extract dinner ID
                    let dinnerID = "";
                    if (Recipes.find(recipe => recipe.name === dinner)) {
                        dinnerID = Recipes.find(recipe => recipe.name === dinner).documentID;
                    }

                    // Extract responsible member information
                    let responsible;
                    if (!responsibleCalendar[gIndex] || responsibleCalendar[gIndex].length <= dIndex + 1) {
                        responsible = "";
                    } else {
                        responsible = responsibleCalendar[gIndex][dIndex + 1];
                    }

                    // Construct the data payload for the POST request
                    const data = {
                        "date": dateString,
                        "customRecipe": dinner,
                        "recipe": dinnerID,
                        "responsible": [responsible],
                    };

                    // Send a POST request to the server
                    fetch(`${API_IP}/group/schedule?groupID=${group.documentID}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data)
                    }).then(response => {
                        // Check the response status and log the result
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

/**
 * @brief Event listener for the change event on the group dropdown.
 *
 * This event listener is triggered when the selected option in the group dropdown changes.
 * It logs a message to the console and asynchronously calls the 'getCalenderData' function.
 */
groupDropdown.addEventListener("change", async function (event) {
    console.log("Dropdown changed");

    // Asynchronously fetch calendar data when the dropdown changes
    await getCalenderData();
});

/**
 * @brief Event listeners for new dinner buttons.
 *
 * This block of code adds event listeners to each button in the 'newDinnerBtns' NodeList.
 * When a button is pressed, it checks the authentication token, displays an alert if not logged in,
 * and sets the current day for dinner addition to the clicked button's parent node's ID.
 * Finally, it displays the 'dinnerPopup'.
 */
newDinnerBtns.forEach(function (btn) {
    btn.addEventListener("click", function (event) {
        // Check authentication token before proceeding
        if (!checkAuthToken()) {
            alert("Du må logge inn for å legge til i kalenderen");
            return;
        }

        // Set the current day for dinner addition
        if (currentDay !== null) {
            currentDay = event.target.parentNode.parentNode.id;
            console.log("Current day: " + currentDay);
        } else {
            console.error("Unable to get the parent node's ID");
        }

        // Display the dinnerPopup
        dinnerPopup.style.display = "block";
    });
});


/**
 * @brief Close all popups.
 *
 * This block of code selects all elements with the class 'popup' using document.querySelectorAll.
 * For each popup element, it sets the display style to "none", effectively hiding the popups.
 */
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
            let groupID = selectedOption.value;
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

