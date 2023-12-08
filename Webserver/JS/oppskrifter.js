/***       GLOBAL VARIABLES       ***/
const MAXRESULTS = 12;              //Max number of results per page
let page = 0;                       //Current page
let Recipes = [];                   //List of recipes
let Categories = [];                //List of categories
const MAXURLDISPLAYLENGTH = 25;     //Max number of characters to display for URL
const isOppskrifter = window.location.href.includes("Oppskrifter/index.html");


/***      DOM ELEMENTS       ***/
let resultDiv = document.querySelector("#results");
let newRecipeBtn = document.querySelector("#new-recipe-btn");
let newRecipePopup = document.querySelector("#new-recipe-popup");
let closeRecipePopup = document.querySelector("#close-recipe-popup");
let recipeDifficulty = document.querySelector("#recipe-difficulty");
let recipeDifficultyText = document.querySelector("#difficulty-value-label");
let recipeType = document.querySelector("#recipe-type-url");
let submitRecipeBtn = document.querySelector("#submit-new-recipe");
let searchField = document.querySelector("#search-bar");
let imageInput = document.querySelector("#recipe-image");
let ingredientInputBtn = document.querySelector("#add-ingredient-btn");
let ingredientInput = document.querySelector("#recipe-ingredient");
let quantityInput = document.querySelector("#recipe-ingredient-qty");
let instructionInputBtn = document.querySelector("#add-instruction-btn");
let instructionInput = document.querySelector("#recipe-instructions");

/***       EVENT LISTENERS       ***/
if(isOppskrifter) {
// Event listener for the "New Recipe" button click
    newRecipeBtn.addEventListener("click", function () {
        // Check if the user is logged in
        if (sessionStorage.getItem("loggedIn") !== "true") {
            // Display an alert and exit the function if not logged in
            alert("You must log in to add recipes");
            return;
        }

        // Clear the groups in the popup
        let groupDiv = document.querySelector("#share-with-groups");
        groupDiv.innerHTML = "";

        // Retrieve and parse user groups from session storage
        let Groups = JSON.parse(sessionStorage.getItem("groups"));

        // Initialize an empty array if groups are not present
        if (Groups === null) {
            Groups = [];
        }

        // Add user groups to the popup
        for (let i = 0; i < Groups.length; i++) {
            let group = Groups[i];
            let listItem = document.createElement("li");
            let checkbox = document.createElement("input");

            // Set attributes for the group checkbox
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("id", "group_" + group.documentID);
            checkbox.setAttribute("name", "group_" + group.documentID);
            checkbox.setAttribute("value", group.documentID);
            checkbox.setAttribute("class", "group-checkbox");

            // Create a label for the group checkbox
            let label = document.createElement("label");
            label.setAttribute("for", "group_" + group.documentID);
            label.setAttribute("class", "group-label");
            label.appendChild(document.createTextNode(group.name));

            // Append checkbox and label to the list item
            listItem.appendChild(checkbox);
            listItem.appendChild(label);

            // Append the list item to the groupDiv
            groupDiv.appendChild(listItem);
        }

        // Clear the categories in the popup
        let categoryDiv = document.querySelector("#category-checkboxes");
        categoryDiv.innerHTML = "";

        // Add exclusive categories to the popup
        let exclusiveCategories = document.createElement("div");
        exclusiveCategories.setAttribute("class", "exclusive-categories");

        for (const ex in Categories.exclusive) {
            // Add category name as a header
            let categoryName = document.createElement("h3");
            categoryName.appendChild(document.createTextNode(ex));
            exclusiveCategories.appendChild(categoryName);

            // Add radio buttons for exclusive categories
            for (const exclusiveCategoriesKey in Categories.exclusive[ex]) {
                let category = exclusiveCategoriesKey;
                let listItem = document.createElement("li");
                let checkbox = document.createElement("input");

                // Set attributes for the category radio button
                checkbox.setAttribute("type", "radio");
                checkbox.setAttribute("id", "category_" + category);
                checkbox.setAttribute("name", "category_" + ex);
                checkbox.setAttribute("value", category);
                checkbox.setAttribute("class", "category-checkbox");

                // Create a label for the category radio button
                let label = document.createElement("label");
                label.setAttribute("for", "category_" + category);
                label.setAttribute("class", "category-label");
                label.appendChild(document.createTextNode(category));

                // Append radio button and label to the list item
                listItem.appendChild(checkbox);
                listItem.appendChild(label);

                // Append the list item to the exclusiveCategories container
                exclusiveCategories.appendChild(listItem);
            }
        }

        // Add non-exclusive categories to the popup
        let nonExclusiveCategories = document.createElement("div");
        nonExclusiveCategories.setAttribute("class", "non-exclusive-categories");
        let nonExclusiveCategoriesName = document.createElement("h3");
        nonExclusiveCategoriesName.textContent = "Other Categories";
        nonExclusiveCategories.appendChild(nonExclusiveCategoriesName);

        for (let i = 0; i < Categories.categories.length; i++) {
            let category = Categories.categories[i];
            let listItem = document.createElement("li");
            let checkbox = document.createElement("input");

            // Set attributes for the category checkbox
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("id", "category_" + category);
            checkbox.setAttribute("name", "category_" + category);
            checkbox.setAttribute("value", category);
            checkbox.setAttribute("class", "category-checkbox");

            // Create a label for the category checkbox
            let label = document.createElement("label");
            label.setAttribute("for", "category_" + category);
            label.setAttribute("class", "category-label");
            label.appendChild(document.createTextNode(category));

            // Append checkbox and label to the list item
            listItem.appendChild(checkbox);
            listItem.appendChild(label);

            // Append the list item to the nonExclusiveCategories container
            nonExclusiveCategories.appendChild(listItem);
        }

        // Add allergy categories to the popup
        let allergyCategories = document.createElement("div");
        allergyCategories.setAttribute("class", "allergy-categories");
        let allergyCategoriesName = document.createElement("h3");
        allergyCategoriesName.textContent = "Allergies";
        allergyCategories.appendChild(allergyCategoriesName);

        for (let i = 0; i < Categories.allergies.length; i++) {
            let category = Categories.allergies[i];
            let listItem = document.createElement("li");
            let checkbox = document.createElement("input");

            // Set attributes for the allergy checkbox
            checkbox.setAttribute("type", "checkbox");
            checkbox.setAttribute("id", "category_" + category);
            checkbox.setAttribute("name", "category_" + category);
            checkbox.setAttribute("value", category);
            checkbox.setAttribute("class", "category-checkbox");

            // Create a label for the allergy checkbox
            let label = document.createElement("label");
            label.setAttribute("for", "category_" + category);
            label.setAttribute("class", "category-label");
            label.appendChild(document.createTextNode(category));

            // Append checkbox and label to the list item
            listItem.appendChild(checkbox);
            listItem.appendChild(label);

            // Append the list item to the allergyCategories container
            allergyCategories.appendChild(listItem);
        }

        // Append category containers to the categoryDiv
        categoryDiv.appendChild(exclusiveCategories);
        categoryDiv.appendChild(nonExclusiveCategories);
        categoryDiv.appendChild(allergyCategories);

        // Clear the preview image
        let recipeImage = document.querySelector("#recipe-image-preview-img");
        recipeImage.style.display = "none";

        // Display the new recipe popup
        newRecipePopup.style.display = "block";
    });


    closeRecipePopup.addEventListener("click", function () {
        //Clear popup inputs
        let inputs = document.querySelectorAll("#new-recipe-popup input");
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].value = "";
        }
        newRecipePopup.style.display = "none";
    });

//Update difficulty text when slider is moved
    recipeDifficulty.addEventListener("input", function () {
        recipeDifficultyText.innerHTML = recipeDifficulty.value;
    });

//Toggle between URL and manual recipe
    recipeType.addEventListener("input", function () {
        if (recipeType.checked) {
            document.querySelector("#url-recipe").style.display = "block";
            document.querySelector("#manual-recipe").style.display = "none";
        } else {
            document.querySelector("#url-recipe").style.display = "none";
            document.querySelector("#manual-recipe").style.display = "block";
        }
    });


//Submit new recipe
    submitRecipeBtn.addEventListener("click", function (event) {
        event.preventDefault();
        newRecipe();
    });

//Search recipes
    searchField.addEventListener("input", function () {
        //Reset page
        page = 0;
        //Search recipes
        let searchlist = searchRecipes(this.value);
        //Filter recipes
        let filteredList = filterRecipes(searchlist);
        //Display results
        displayResults(filteredList);
        //Display pagination
        displayPages();
    });


    imageInput.addEventListener("change", function () {
        //Display preview image
        if (this.files.length === 1) {
            let image = document.querySelector("#recipe-image-preview-img");
            image.setAttribute("src", URL.createObjectURL(this.files[0]));
            image.style.display = "block";
        } else {
            let image = document.querySelector("#recipe-image-preview-img");
            image.setAttribute("src", "");
            image.style.display = "none";
        }
    });

    ingredientInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
        //Add ingredient on enter
        if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
            addNewItemToList("ingredients");
            ingredientInput.value = "";
            quantityInput.value = "";
        }
    });

    quantityInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
        //Add ingredient on enter
        if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
            addNewItemToList("ingredients");
            ingredientInput.value = "";
            quantityInput.value = "";
        }
    });
    ingredientInputBtn.addEventListener("click", (event) => {
        event.preventDefault();
        //Add ingredient on button click
        if (ingredientInput.value !== "" && quantityInput.value !== "") {
            addNewItemToList("ingredients");
            ingredientInput.value = "";
            quantityInput.value = "";
        }
    });


    instructionInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
        }
        //Add instruction on enter
        if (event.key === "Enter" && instructionInput.value !== "") {
            addNewItemToList("instructions");
            instructionInput.value = "";
        }
    });
    instructionInputBtn.addEventListener("click", (event) => {
        event.preventDefault();
        //Add instruction on button click
        if (instructionInput.value !== "") {
            addNewItemToList("instructions");
            instructionInput.value = "";
        }
    });

    window.onload = function () {
        //Check if logged in
        updateLoginStatus();
        //Get groups from API
        retrieveGroups();
        //Get recipes from API
        loadRecipes();
        //Get categories from API
        getCategories();
    };
}
/***        FUNCTIONS       ***/

/**
 * Get categories from API
 */
function getCategories() {
    // Get categories from API
    fetch(API_IP + "/recipe/categories", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    }).then((response) => {
        if (response.ok) {
            response.json().then((data) => {
                // Store the categories in the global variable 'Categories'.
                Categories = data;
                if(isOppskrifter) {
                    // Display the category filters.
                    displayCategoryFilters();
                }
            });
        } else {
            console.log("Error getting categories");
        }
    });
}

/**
 * Display filters for categories
 */
function displayCategoryFilters() {
    // Get the filter wrapper element from the DOM.
    let filterDiv = document.querySelector("#filter-wrapper");

    // Clear existing filters.
    filterDiv.innerHTML = "";

    // Add a header to the filter section.
    let filterHeader = document.createElement("h2");
    filterHeader.textContent = "Filter";
    filterDiv.appendChild(filterHeader);

    // Add a button to clear all filters.
    let clearFilters = document.createElement("button");
    clearFilters.setAttribute("class", "clear-filters");
    clearFilters.textContent = "Clear Filters";
    clearFilters.addEventListener("click", function (event) {
        // Clear all category checkboxes and submit the filter.
        let checkboxes = document.querySelectorAll(".category-checkbox");
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
        }
        submitFilter();
    });
    filterDiv.appendChild(clearFilters);

    // Check if categories have been loaded.
    if (Categories === null) return;

    // Add exclusive category filters.
    let exclusiveCategoriesWrapper = document.createElement("div");
    exclusiveCategoriesWrapper.setAttribute("class", "exclusive-categories");

    for (const ex in Categories.exclusive) {
        // Add category name as a header.
        let categoryName = document.createElement("h3");
        categoryName.setAttribute("class", "category-name");
        categoryName.appendChild(document.createTextNode(ex + " "));
        categoryName.addEventListener("click", function () {
            // Toggle the visibility of the associated checkboxes.
            let checkboxes = categoryName.nextElementSibling; // Assumes checkboxes are the next sibling
            checkboxes.style.maxHeight = checkboxes.style.maxHeight ? null : checkboxes.scrollHeight + "px";
            categoryName.classList.toggle("active");
        });
        exclusiveCategoriesWrapper.appendChild(categoryName);

        // Add checkboxes container.
        let categoryCheckboxes = document.createElement("div");
        categoryCheckboxes.setAttribute("class", "category-div");

        // Loop through exclusive categories and create radio buttons.
        for (const exclusiveCategoriesKey in Categories.exclusive[ex]) {
            let category = exclusiveCategoriesKey;
            let listItem = document.createElement("li");
            let checkbox = document.createElement("input");
            checkbox.setAttribute("type", "radio");
            checkbox.setAttribute("id", "category_" + category);
            checkbox.setAttribute("name", "category_" + ex);
            checkbox.setAttribute("value", category);
            checkbox.setAttribute("class", "category-checkbox");
            checkbox.addEventListener("input", function (event) {
                submitFilter();
            });
            let label = document.createElement("label");
            label.setAttribute("for", "category_" + category);
            label.setAttribute("class", "category-label");
            label.appendChild(document.createTextNode(category));
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            categoryCheckboxes.appendChild(listItem);
        }
        exclusiveCategoriesWrapper.appendChild(categoryCheckboxes);
    }

    // Add non-exclusive categories.
    let nonExclusiveCategoriesWrapper = document.createElement("div");
    nonExclusiveCategoriesWrapper.setAttribute("class", "non-exclusive-categories");
    let nonExName = document.createElement("h3");
    nonExName.setAttribute("class", "category-name");
    nonExName.textContent = "Other Categories ";
    nonExName.addEventListener("click", function () {
        // Toggle the visibility of the associated checkboxes.
        let checkboxes = nonExName.nextElementSibling; // Assumes checkboxes are the next sibling
        checkboxes.style.maxHeight = checkboxes.style.maxHeight ? null : checkboxes.scrollHeight + "px";
        nonExName.classList.toggle("active");
    });
    nonExclusiveCategoriesWrapper.appendChild(nonExName);
    let nonExCategories = document.createElement("div");
    nonExCategories.setAttribute("class", "category-div");
    for (let i = 0; i < Categories.categories.length; i++) {
        let category = Categories.categories[i];
        let listItem = document.createElement("li");
        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", "category_" + category);
        checkbox.setAttribute("name", "category_" + category);
        checkbox.setAttribute("value", category);
        checkbox.setAttribute("class", "category-checkbox");
        checkbox.addEventListener("input", function (event) {
            submitFilter();
        });
        let label = document.createElement("label");
        label.setAttribute("for", "category_" + category);
        label.setAttribute("class", "category-label");
        label.appendChild(document.createTextNode(category));
        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        nonExCategories.appendChild(listItem);
    }
    nonExclusiveCategoriesWrapper.appendChild(nonExCategories);

    // Add allergy categories.
    let allergyWrapper = document.createElement("div");
    allergyWrapper.setAttribute("class", "allergy-categories");
    let allergyCategoriesName = document.createElement("h3");
    allergyCategoriesName.setAttribute("class", "category-name");
    allergyCategoriesName.textContent = "Allergens ";
    allergyCategoriesName.addEventListener("click", function () {
        // Toggle the visibility of the associated checkboxes.
        let checkboxes = allergyCategoriesName.nextElementSibling; // Assumes checkboxes are the next sibling
        checkboxes.style.maxHeight = checkboxes.style.maxHeight ? null : checkboxes.scrollHeight + "px";
        allergyCategoriesName.classList.toggle("active");
    });
    allergyWrapper.appendChild(allergyCategoriesName);
    let allergyCategories = document.createElement("div");
    allergyCategories.setAttribute("class", "category-div");
    for (let i = 0; i < Categories.allergies.length; i++) {
        let category = Categories.allergies[i];
        let listItem = document.createElement("li");
        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", "category_" + category);
        checkbox.setAttribute("name", "category_" + category);
        checkbox.setAttribute("value", category);
        checkbox.setAttribute("class", "category-checkbox");
        checkbox.addEventListener("input", function (event) {
            submitFilter();
        });
        let label = document.createElement("label");
        label.setAttribute("for", "category_" + category);
        label.setAttribute("class", "category-label");
        label.appendChild(document.createTextNode(category));
        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        allergyCategories.appendChild(listItem);
    }
    allergyWrapper.appendChild(allergyCategories);

    // Append the category filter sections to the filter wrapper.
    filterDiv.appendChild(exclusiveCategoriesWrapper);
    filterDiv.appendChild(nonExclusiveCategoriesWrapper);
    filterDiv.appendChild(allergyWrapper);
}


/**
 * Load recipes from API
 * @returns {Promise<void>}
 */
async function loadRecipes(){
    //Check if logged in
    if (!await checkLoginStatus()) return;
    //Get recipes from API
    await getRecipes(Recipes);
    //Display results
    await displayResults(Recipes);
    //Display pagination
    displayPages();
}

/**
 * Get recipes from API
 * @param list - List to add list item to
 */
function addNewItemToList(list) {
    // Initialize variables for the item type and the list element to which the item will be added.
    let type = "";
    if (list === "ingredients") {
        // If the list is for ingredients, update 'list' to the corresponding DOM element.
        list = document.querySelector("#recipe-ingredient-list");
        type = "ingredient";
    } else if (list === "instructions") {
        // If the list is for instructions, update 'list' to the corresponding DOM element.
        type = "instruction";
        list = document.querySelector("#recipe-instructions-list");
    } else {
        // If the list type is neither ingredients nor instructions, exit the function.
        return;
    }

    // Create a new list item element.
    let li = document.createElement("li");

    // Check the type of item being added (ingredient or instruction).
    if (type === "ingredient") {
        // If it's an ingredient, get values from the input fields.
        let newItem = document.querySelector("#recipe-ingredient").value;
        let quantity = document.querySelector("#recipe-ingredient-qty").value;

        // Set attributes for the ingredient list item.
        li.setAttribute("class", "ingredient-list-item");
        li.setAttribute("name", newItem);
        li.setAttribute("data-qty", quantity);
        li.textContent = newItem;

        // Create a checkbox for removing the ingredient from the list.
        let removeItem = document.createElement("a");
        let removeIcon = document.createElement("img");
        removeIcon.setAttribute("src", "../Images/trashcan.svg");
        removeIcon.setAttribute("alt", "Delete ingredient");
        removeIcon.setAttribute("class", "close-svg remove-item");
        removeItem.appendChild(removeIcon);

        // Add an event listener to remove the ingredient when the remove icon is clicked.
        removeItem.addEventListener("click", function (event) {
            list.removeChild(li);
        });

        // Append the quantity and the remove icon to the ingredient list item.
        li.appendChild(document.createTextNode(" " + quantity));
        li.appendChild(removeItem);

    } else {
        // If it's an instruction, get the value from the instructions input field.
        li.classList.add("instruction-list-item");
        li.textContent = document.querySelector("#recipe-instructions").value;

        // Create a remove icon for the instruction list item.
        let removeItem = document.createElement("a");
        let removeIcon = document.createElement("img");
        removeIcon.setAttribute("src", "../Images/trashcan.svg");
        removeIcon.classList.add("remove-item", "close-svg");
        removeIcon.setAttribute("alt", "Delete instruction");
        removeItem.appendChild(removeIcon);

        // Add an event listener to remove the instruction when the remove icon is clicked.
        removeItem.addEventListener("click", function (event) {
            list.removeChild(li);
        });

        // Append the remove icon to the instruction list item.
        li.appendChild(removeItem);
    }

    // Append the new list item to the specified list.
    list.appendChild(li);
}


/**
 * Create new recipe and send to API
 * @returns {Promise<void>}
 */
async function newRecipe() {
    // Get input values from the DOM.
    let name = document.querySelector("#recipe-name").value;
    let type = document.querySelector("#recipe-type-url");
    let difficulty = document.querySelector("#recipe-difficulty").value;
    let time = document.querySelector("#recipe-time").value;
    let description = document.querySelector("#recipe-description").value;
    let ingredients = {};
    let instructions = [];

    // Get input related to the recipe image.
    let imageInput = document.querySelector("#recipe-image");
    let filename = "";

    // Check if required fields are filled; display an alert and return if any are missing.
    if (name === "" || difficulty === "" || time === "" ||
        (type.checked && document.querySelector("#recipe-url").value === "") ||
        (!type.checked && document.querySelector("#recipe-ingredient-list").children.length === 0) ||
        (!type.checked && document.querySelector("#recipe-instructions-list").children.length === 0)) {
        alert("All required fields must be filled out");
        return;
    }

    // If an image is selected, attempt to upload it to the server.
    if (imageInput.files.length === 1) {
        try {
            // Call the asynchronous function 'uploadImage' to upload the image.
            // Update 'filename' with the response from the upload.
            filename = await uploadImage(imageInput.files[0], function (response) {
                filename = response.filename;
            });
        } catch (error) {
            // Log an error and display an alert if image upload fails.
            console.log(error);
            alert("There was an error uploading the image");
            return;
        }
    }

    // Get user-related information from session storage.
    let username = sessionStorage.getItem("username");
    let groups = [];

    // Get selected group checkboxes and add their values to the 'groups' array.
    let groupCheckboxes = document.querySelectorAll(".group-checkbox");
    for (let i = 0; i < groupCheckboxes.length; i++) {
        if (groupCheckboxes[i].checked) {
            groups.push(groupCheckboxes[i].value);
        }
    }

    // Get selected category checkboxes and add their values to the 'categories' array.
    let categories = [];
    let categoryCheckboxes = document.querySelectorAll("input.category-checkbox");
    for (let i = 0; i < categoryCheckboxes.length; i++) {
        if (categoryCheckboxes[i].checked) {
            categories.push(categoryCheckboxes[i].value);
        }
    }

    // Create a recipe object based on user input.
    let recipe = {
        "name": name,
        "difficulty": parseInt(difficulty),
        "time": parseInt(time),
        "image": filename,
        "description": description,
        "categories": categories,
    };

    // If the URL type is checked, add the URL to the recipe object.
    if (type.checked) {
        recipe.URL = document.querySelector("#recipe-url").value;
    } else {
        // If the URL type is not checked, gather ingredient and instruction information.
        let list = document.querySelectorAll("#recipe-ingredient-list li");
        list.forEach((item) => {
            let ingredient = item.getAttribute("name");
            ingredients[ingredient] = item.getAttribute("data-qty");
        });
        recipe.ingredients = ingredients;

        list = document.querySelectorAll("#recipe-instructions-list li");
        list.forEach((item) => {
            instructions.push(item.textContent);
        });
        recipe.instructions = instructions;
    }

    // Create a data object to send to the API.
    let data = {
        "owner": username,
        "recipe": recipe,
        "groups": groups,
    };

    try {
        // Make a POST request to the API to add the new recipe.
        const recipeResponse = await fetch(API_IP + "/recipe/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        // Log the response from the API.
        if (!recipeResponse.ok) {
            console.log("Error adding recipe", await recipeResponse.json());
        }
    } catch (error) {
        // Log an error if the API request fails.
        console.log(error);
    }

    // Reload the page after the recipe is added.
    location.reload();
}

/**
 * Display pagination
 */
function displayPages() {
    // Initialize pag variable
    let pag = [];
    let nPages;

    // Get the pagination div element
    let paginationDiv = document.querySelector("#recipe-nav");
    paginationDiv.innerHTML = ""; // Clear existing pagination buttons

    // Check if the search field is empty
    if (searchField.value === "") {
        // Check if there is only one page or fewer
        nPages = Math.ceil(filterRecipes(Recipes).length / MAXRESULTS);
        if (nPages <= 1) {
            return; // No need to display pagination
        }
        // Calculate pagination for all recipes
        pag = pagination(page, nPages);
    } else {
        // Check if there is only one page or fewer for filtered recipes
        nPages = Math.ceil(filterRecipes(searchRecipes(searchField.value)).length / MAXRESULTS);
        if (nPages <= 1) {
            return; // No need to display pagination
        }
        // Calculate pagination for filtered recipes
        pag = pagination(page, nPages);
    }

    // Check if pagination buttons are more than 3 to decide whether to show previous and next buttons
    if (nPages > 3) {
        // Display previous button if not on the first page
        if (page > 0) {
            addButton(paginationDiv, "<", "changePage(" + (page - 1) + ")");
        }

        // Display pagination buttons
        for (let i = 0; i < pag.length; i++) {
            addButton(paginationDiv, pag[i], "changePage(" + (pag[i] - 1) + ")", pag[i] !== "..." && pag[i] - 1 === page, pag[i] === "...");
        }

        // Display next button if not on the last page
        if (page < nPages - 1) {
            addButton(paginationDiv, ">", "changePage(" + (page + 1) + ")");
        }
    } else {
        // Display pagination buttons without previous and next buttons
        for (let i = 0; i < pag.length; i++) {
            addButton(paginationDiv, pag[i], "changePage(" + (pag[i] - 1) + ")", i === page, pag[i] === "...");
        }
    }

    // Helper function to create and append a button to the pagination div
    function addButton(parent, text, onclick, isActive = false, isDisabled = false) {
        let button = document.createElement("button");
        button.setAttribute("class", "pagination-button");
        button.setAttribute("onclick", onclick);
        button.textContent = text;
        if (isActive) button.classList.add("active");
        if (isDisabled) button.classList.add("disabled");
        parent.appendChild(button);
    }
}

/**
 * Change page
 * @param p - Page number
 */
function changePage(p) {
    let pages = document.querySelectorAll(".pagination-button");
    //Remove active class from all pages
    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove("active");
    }
    //Set new page
    page = p;
    //Display new page results
    displayResults(filterRecipes(searchRecipes(searchField.value)));
    //Display new pagination
    displayPages();
}

/**
 * Calculate pagination
 * @param c - Current page
 * @param m - Max pages
 * @returns {*[]} - List of pages to display
 */
function pagination(c, m) {
    // Initialize variables for current page, last page, delta (range size),
    // left and right bounds of the range, an array to store the range,
    // another array to store the range with dots, and a variable 'l'.
    let current = c,
        last = m,
        delta = 10,
        left = current - delta,
        right = current + delta,
        range = [],
        rangeWithDots = [],
        l;

    // Iterate through all pages from 1 to the last page.
    for (let i = 1; i <= last; i++) {
        // Check if the current page is the first, last, or within the range.
        if (i === 1 || i === last || i >= left && i < right) {
            // Add the page number to the 'range' array.
            range.push(i);
        }
    }

    // Iterate through the pages in the 'range' array.
    for (let i of range) {
        // Check if 'l' (last page) is defined.
        if (l) {
            // If there is a gap of 2 between the current and last page,
            // add the missing page number.
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                // If there is a gap of more than 1, add '...' to represent a gap.
                rangeWithDots.push('...');
            }
        }
        // Add the current page number to the 'rangeWithDots' array.
        rangeWithDots.push(i);
        // Update 'l' to the current page number.
        l = i;
    }
    // Return the array representing the pagination with or without dots.
    return rangeWithDots;
}

/**
 * Searches for recipes that match the search term
 * @param text - Search term
 * @returns {*|*[]|*[]} - List of recipes that match the search term
 */
function searchRecipes(text) {
    let primaryMatches = [];
    let secondaryMatches = [];
    if(text === "") return filterRecipes(Recipes);

    //Starts with search term
    primaryMatches = Recipes.filter((data) => {
        return data.name.toLowerCase().startsWith(text.toLowerCase());
    });
    //Contains search term
    secondaryMatches = Recipes.filter((data) => {
        return data.name.toLowerCase().includes(text.toLowerCase()) && !data.name.toLowerCase().startsWith(text.toLowerCase());
    });
    return primaryMatches.concat(secondaryMatches);
}

/**
 * Submit filter and display results
 */
function submitFilter() {
    //Reset page
    page = 0;
    //Display results and update pagination
    displayPages();
    displayResults(filterRecipes(searchRecipes(searchField.value)));
}

/**
 * Filter recipes by categories
 * @param list - List of recipes to filter
 * @returns {*|*[]} - Filtered list of recipes
 */
function filterRecipes(list) {
    // Get all the category checkboxes from the DOM.
    let checkboxes = document.querySelectorAll(".category-checkbox");

    // Initialize an array to store the values of checked checkboxes.
    let checked = [];

    // Iterate through each checkbox to check if it is checked, and store its value.
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            checked.push(checkboxes[i].value);
        }
    }

    // If no checkboxes are checked, return the original unfiltered list.
    if (checked.length === 0) {
        return list;
    }

    // Initialize an array to store the filtered list of recipes.
    let filteredList = [];
    // Iterate through each recipe in the original list.
    for (let i = 0; i < list.length; i++) {
        // Get the current recipe and its categories.
        let recipe = list[i];
        let categories = recipe.categories;

        // If the recipe has no categories, skip to the next iteration.
        if(categories === null) continue;

        // Initialize a variable to check if the recipe matches the selected categories.
        let match = true;

        // Iterate through each checked category.
        for (let j = 0; j < checked.length; j++) {
            // If the recipe's categories do not include the checked category, set match to false and break.
            if (!categories.includes(checked[j])) {
                match = false;
                break;
            }
        }
        // If there is a match for all checked categories, add the recipe to the filtered list.
        if (match) {
            filteredList.push(recipe);
        }
    }
    // Return the filtered list of recipes.
    return filteredList;
}

/**
 * Check if image exists
 * @param list - List of recipes to filter
 * @param item - Item to check for duplicates
 * @returns {boolean} - True if item is duplicate
 */
function isDuplicate(list, item) {
    for (let i = 0; i < list.length; i++){
        //If documentID is the same, it is a duplicate
        if (list[i].documentID === item.documentID) return true;
    }
    //Not a duplicate
    return false;
}

/**
 * Display results
 * @param filteredList - List of recipes to display
 * @returns {Promise<void>} - Promise
 */
async function displayResults(filteredList){
    //Clear results
    resultDiv.innerHTML = "";

    //Display
    if (filteredList.length === 0) {
        resultDiv.appendChild(document.createTextNode("Du har ingen oppskrifter lagret"));
        return;
    }

    //Limit output to MAXRESULTS
    let displayedRecipes = [];
    for (let i = 0; i < MAXRESULTS && filteredList.length > i + page * MAXRESULTS; i++){
        //Check if recipe is already displayed
        if (!isDuplicate(displayedRecipes, filteredList[i + page * MAXRESULTS])) {
            displayedRecipes.push(filteredList[i + page * MAXRESULTS]);
        }
    }
    //Display recipes
    for (let i = 0; i < displayedRecipes.length; i++) {
        let recipe = displayedRecipes[i];
        let recipeA = document.createElement("a");
        //recipeBlock.classList.add("results");
        recipeA.classList.add("result");
        recipeA.setAttribute("href", "Oppskrift/index.html?id=" + recipe.documentID);
        recipeA.setAttribute("id", recipe.documentID);

        //Create recipe block
        let recipeBlock = document.createElement("div");
        recipeBlock.setAttribute("class", "result-text");
        //Create recipe name
        let recipeName = document.createElement("h3");
        recipeName.setAttribute("class", "result-name");
        recipeName.textContent = recipe.name;
        recipeBlock.appendChild(recipeName);
        //Add URL if it exists
        if (recipe.URL !== "" && recipe.URL !== null) {
            let recipeURL = document.createElement("a");
            recipeURL.setAttribute("href", recipe.URL);
            recipeURL.setAttribute("target", "_blank");
            recipeURL.setAttribute("class", "result-url");
            //Display URL without protocol and www
            let displayURL = recipe.URL.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
            //Display only first 25 characters
            if (displayURL.length > MAXURLDISPLAYLENGTH) {
                recipeURL.textContent = displayURL.substring(0, 25) + "...";
            } else {
                recipeURL.textContent = displayURL;
            }
            recipeBlock.appendChild(recipeURL);
        }
        //Create recipe difficulty
        let recipeDifficulty = document.createElement("p");
        recipeDifficulty.setAttribute("class", "result-difficulty");
        recipeDifficulty.textContent = "Vanskelighetsgrad: " + recipe.difficulty;
        recipeBlock.appendChild(recipeDifficulty);

        //Create recipe time
        let recipeTime = document.createElement("p");
        recipeTime.setAttribute("class", "result-time");
        recipeTime.textContent = "Tid: " + recipe.time + (recipe.time > 1 ? " minutter" : " minutt");
        recipeBlock.appendChild(recipeTime);
        //Add image if recipe has it
        if (recipe.image !== "" && recipe.image !== null) {
            //Check if image exists
            checkImageExists("../" + IMAGEDIR + recipe.image + ".jpeg", function (exists) {
                if (!exists) {
                    return;
                }
                let recipeImage = document.createElement("img");
                recipeImage.setAttribute("src", "../" + IMAGEDIR + recipe.image + ".jpeg");
                recipeImage.setAttribute("alt", recipe.name);
                recipeImage.setAttribute("class", "result-image");
                recipeA.appendChild(recipeImage);
            });
        }
        recipeA.appendChild(recipeBlock);
        //Add recipe to results
        resultDiv.appendChild(recipeA);
    }
}