/**
 * @file kalender.js
 * @brief This file contains the calendar functions for the application.
 */

/* jshint esversion: 8 */
/* jshint loopfunc: true */
/****************************** DOM Elements ************************************/
let dinnerPopup = document.querySelector("#dinner-popup"); // The popup for adding a dinner
let newDinnerBtns = document.querySelectorAll(".dinner-btn"); // The buttons for adding a dinner
let closeDinnerPopup = document.querySelector("#close-dinner-popup"); // The button for closing the dinner popup
let dinnerForm = document.querySelector("#new-dinner-form"); // The form for adding a dinner
let groupDropdown = document.querySelector("#group-dropdown"); // The dropdown for selecting a group
let responsibleButtons = document.querySelectorAll('.btn.responsible'); // The buttons for selecting a responsible member

/*********************************** Variables ************************************************/
let currentDay; // The day selected to add information to
let allDays = ["mandag","tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"]; // Array of all days
let Recipes = []; // Array containing all recipes
let calendar = [[]]; // array containing all dinners for each group
let responsibleCalendar = [[]]; // array containing all the members responsible for dinners for each group
let inputCalendar = null; // The calendar data retrieved from the database
let groups = []; // Array containing all groups
let groupIDSentAsParam = ""; // The group ID sent as a parameter in the URL

beginning(); // Begin the application, needs this because of async functions

/*********************************** Event Listeners ************************************************/

/**
 * @brief Add event listener for closing the dinner popup.
 *
 * This event listener is triggered when the close button in the dinner popup is clicked.
 * It hides the dinner popup and clears the input field.
 */
closeDinnerPopup.addEventListener("click", function (event) {
    // Hide the dinner popup when the close button is clicked
    dinnerPopup.style.display = "none";
    const inputField = document.querySelector('#dinner-name');
    if (inputField) {
        inputField.value = ""; // This will empty the input field
    }
});


/**
 * @brief Add event listener to prevent form submission.
 */
dinnerForm.addEventListener("submit", function (event) {
    // Prevent the default form submission behavior to handle form data asynchronously
    event.preventDefault();
});

/**
 * @brief Add click event listeners to "Responsible" buttons.
 *
 * This block of code adds click event listeners to each button in the 'responsibleButtons' NodeList.
 * When a button is clicked, it checks the selected group from the dropdown and the day section associated with the button.
 * If both the selected group and day section are valid, it invokes the 'createMemberPopup' function to display a popup
 * with group members for the selected day.
 */
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
                id = daySection.id; // This will give you, for example, "tirsdag"
            }
            if (selectedGroup && id) {
                // Open the member popup for the selected group and day
                createMemberPopup(selectedGroup, id);
            }
        }
    });
});

/**
 * @brief Event listener for the change event on the group dropdown.
 *
 * This event listener is triggered when the selected option in the group dropdown changes.
 * It asynchronously calls the 'getCalenderData' function as long as it is not the first option.
 * If the first option is selected, it reloads the page.
 */
groupDropdown.addEventListener("change", async function (event) {
    if (groupDropdown.selectedIndex === 0) {
        // Reload the page if the "velg gruppe" is selected
        location.reload();
    }else{
        // Asynchronously fetch calendar data when the dropdown changes
        await getCalenderData();
    }
});

/**
 * @brief Event listeners for new dinner buttons.
 *
 * This block of code adds event listeners to each button in the 'newDinnerBtns' NodeList.
 * When a button is clicked, it checks the authentication token, displays an alert if not logged in,
 * and sets the current day for dinner addition to the clicked button's parent node's ID.
 * It preloads the autocomplete with the first two recipes in the database if they exist.
 * Finally, it displays the 'dinnerPopup'.
 */
newDinnerBtns.forEach(function (btn) {
    btn.addEventListener("click", function (event) {
        // Check authentication token before proceeding
        if (!checkLoginStatus()) {
            alert("Du må logge inn for å legge til i kalenderen");
            return;
        }

        // Set the current day for dinner addition
        if (currentDay !== null) {
            currentDay = event.target.parentNode.parentNode.id;
        } else {
            console.error("Unable to get the parent node's ID");
        }
        autocomplete(currentDay, "");
        // Display the dinnerPopup
        dinnerPopup.style.display = "block";
    });
});


/*********************************** Functions ************************************************/

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
            } else if (label.textContent.includes("Ingen middag valgt. ") && inputCalendar !== null) {
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
        allDays.forEach(function (day) {
            if(document.querySelector("#" + day + "-dinner")){
                document.querySelector("#" + day + "-dinner").textContent = "Ingen middag valgt. ";
            }else {
                let label = document.createElement("label");
                label.textContent = "Ingen middag valgt. ";
                label.id = day + "-dinner";
                document.querySelector("#" + day + "-textbox").appendChild(label);
            }
        });
        return;
    }

    // Iterate through options to find the selected group
    const dateKeys = Object.keys(inputCalendar);
    for (let j = 0; j < options.length - 1; j++) {
        if (groupID === options[j + 1].value) {
            dateKeys.forEach(dateKey => {// jshint ignore:line
                // Check if the dateKey exists in inputCalendar
                if (dateKey in inputCalendar) {
                    let dateData = inputCalendar[dateKey];
                    let date = new Date(dateKey);

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
    if (label){
        label.textContent = "Ansvarlig: " + responsible;
    }else {
        label = document.createElement("label");
        label.textContent = "Ansvarlig: " + responsible;
        label.className = "selectedMemberLabel";
    }


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
                    console.log(responsible);
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
 * @brief Create a popup with group members for a specific day.
 *
 * This function generates a popup containing buttons for each member of a group.
 * When a member button is clicked, it updates the selected member label in the day section.
 * The selected member is then added to the responsibleCalendar array and sent to the server
 * if a dinner is also present.
 *
 * @param {Object} groupData - The data of the group, including member information.
 * @param {string} day - The identifier for the day section where the popup is created.
 */
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

        // Iterate through members
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
                        console.log(responsibleCalendar);
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



/**
 * @brief Handle user input for adding a dinner entry to the calendar.
 *
 * This function is invoked when the user presses a key in the 'dinner-name' input field.
 * It retrieves the dinner name, selected group, and current day from the corresponding elements.
 * The function updates the day's display with the dinner information, including the responsible member,
 * when the "Enter" key is pressed. If a recipe is found for the dinner, it creates a link to the recipe page;
 * otherwise, it creates a label. The function also updates the internal 'calendar' array and sends the updated
 * data to the server.
 */
function addDinnerToCalendar() {
    let dinnerName = document.querySelector("#dinner-name").value;
    let options = document.querySelectorAll("#group-dropdown option");
    let selectedGroup;
    options.forEach(option => {
        if (option.selected) {
            selectedGroup = option.textContent;
        }
    });
    if (event.key === "Enter") {
        let dayDiv = document.getElementById(currentDay);
        let textDiv = dayDiv.querySelector("#" + currentDay + "-textbox");
        let element = textDiv.querySelector("#" + currentDay + "-dinner");
        let responsibleLabel = dayDiv.querySelector(".selectedMemberLabel");
        responsibleLabel.textContent = "Ansvarlig: ";

        let recipe = findRecipesInCalendar(dinnerName);

        if (!element) {
            if (recipe) {
                // Create a link
                element = document.createElement("a");
            } else {
                // Create a label
                element = document.createElement("label");
            }
            element.id = currentDay + "-dinner";
        }

        if (recipe) {

            if (element instanceof HTMLLabelElement) { // Check if it's a label
                element.parentNode.removeChild(element); // Remove the label

                // Create a link
                element = document.createElement("a");
                element.id = currentDay + "-dinner";
                textDiv.appendChild(element);
            }

            element.setAttribute("class", "dinner-link");
            element.textContent = "Middag: " + dinnerName;
            let href = "../Oppskrifter/Oppskrift/index.html?id=" + recipe.documentID; // Set the link's href
            element.setAttribute("href", href);
        } else {
            console.log("could not find recipe");
            element.innerHTML = '<br>' +"Middag: " + dinnerName;
        }

        // Append the created element to the 'div'
        dayDiv.appendChild(element);

        event.preventDefault();
        dinnerPopup.style.display = "none";
        document.querySelector("#dinner-name").value = "";

        for (let i = 0; i < groups.length; i++) {
            if (groups[i].name === selectedGroup) {
                for (let j = 0; j < allDays.length; j++) {
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
    } else {
        autocomplete(currentDay, dinnerName);
    }
}


/**
 * @brief Provide autocompletion suggestions for the dinner input field.
 *
 * This function is called to dynamically generate and display autocompletion suggestions
 * based on the user's input in the 'dinner-name' input field. It filters the available recipes
 * to match the search substring and displays the suggestions in a dropdown list.
 *
 * @param {string} day - The identifier for the day section where the autocompletion is triggered.
 * @param {string} text - The user's input in the 'dinner-name' input field.
 */
function autocomplete(day, text) {
    const recipeInput = document.querySelector("#dinner-name");
    const recipeList = document.querySelector("#search-results");
    let suggestions = [];

    if (text.length > 0) {
        // Find recipes that match the search substring
        const filteredRecipes = Recipes.filter((data) => {
            return data.name.toLowerCase().includes(text.toLowerCase());
        });
        suggestions = suggestions.concat(filteredRecipes);
    } else {
        // If nothing is typed, show the first two recipes as default suggestions (also works if there are 1 or 0 recipes)
        suggestions = Recipes.slice(0, 2);
    }

    // Create list items for the suggestions
    suggestions = suggestions.map((data) => {
        return '<li>' + data.name + '</li>';
    });

    // Highlight the input box
    recipeInput.classList.add("active");

    // Display the suggestions
    showSuggestions(suggestions, day);

    // Add event listener to all suggestions
    let allList = recipeList.querySelectorAll("li");
    for (let i = 0; i < allList.length; i++) {
        allList[i].addEventListener("click", () => {
            // Add the selected recipe to the input field
            const selectedRecipe = allList[i].textContent;
            recipeInput.value = selectedRecipe;
            recipeInput.classList.remove("active");
            autocomplete(day, selectedRecipe);
        });
    }
}


/**
 * @brief Display autocompletion suggestions in a dropdown list.
 *
 * This function is called to update and display the autocompletion suggestions in a dropdown list.
 * It takes a list of suggestions, including the user's input, and inserts them into the 'search-results' element.
 *
 * @param {Array<string>} list - The list of autocompletion suggestions to display.
 */
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


/**
 * @brief Populate the group dropdown with the provided group data.
 *
 * This function is called to dynamically populate the group dropdown menu with the given list of groups.
 * It creates and appends option elements for each group, setting their values and text content accordingly.
 * If a specific group ID is provided as a parameter, it selects the corresponding option in the dropdown.
 *
 * @param {Array<Object>} groups - The array of group objects to be displayed in the dropdown.
 */
function displayGroups(groups) {
    let dropdown = document.querySelector("#group-dropdown");
    let defaultOption = document.createElement("option");
    defaultOption.textContent = "Velg gruppe";

    groups.forEach(group => {
        let option = document.createElement("option");
        option.value = group.documentID;
        option.textContent = group.name;

        if (groupIDSentAsParam) {
            if (group.documentID === groupIDSentAsParam) {
                option.selected = true; // Set the option as selected
            }
        }

        dropdown.appendChild(option);
    });
}


/**
 * @brief Find recipes in the global 'Recipes' array based on the given dinner name.
 *
 * This function is called to search for recipes in the global 'Recipes' array that match the provided dinner name.
 * It iterates through the 'Recipes' array and returns the first matching recipe. If no matches are found,
 * it logs a message to the console and returns null.
 *
 * @param {string} dinner - The name of the dinner to search for in the 'Recipes' array.
 *
 * @returns {Object|null} - The matching recipe object if found; otherwise, null.
 */
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

