//Global variables and constants:
let MAXRESULTS = 6;
let page = 0;
let Recipes = [];
let Categories = [];


//DOM elements:
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

//Event listeners:
newRecipeBtn.addEventListener("click", function (event){
    if(sessionStorage.getItem("loggedIn") !== "true"){
        alert("Du må logge inn for å legge til oppskrifter");
        return;
    }
    //Clear groups
    let groupDiv = document.querySelector("#share-with-groups");
    groupDiv.innerHTML = "";
    let Groups = JSON.parse(sessionStorage.getItem("groups"));
    if (Groups === null){
        Groups = [];
    }
    //Add groups to popup
    for(let i = 0; i < Groups.length; i++){
        let group = Groups[i];
        let listItem = document.createElement("li");
        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", "group_" + group.documentID);
        checkbox.setAttribute("name", "group_" + group.documentID);
        checkbox.setAttribute("value", group.documentID);
        checkbox.setAttribute("class", "group-checkbox");
        let label = document.createElement("label");
        label.setAttribute("for", "group_" + group.documentID);
        label.setAttribute("class", "group-label");
        label.appendChild(document.createTextNode(group.name));
        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        groupDiv.appendChild(listItem);
    }

    //Clear categories
    let categoryDiv = document.querySelector("#category-checkboxes");
    categoryDiv.innerHTML = "";
    console.log("Categories: ", Categories);
    //Add exclusive categories
    let exclusiveCategories = document.createElement("div");
    exclusiveCategories.setAttribute("class", "exclusive-categories");
    for(const ex in Categories.exclusive){
        //Add category name
        let categoryName = document.createElement("h3");
        categoryName.setAttribute("class", "category-name");
        categoryName.appendChild(document.createTextNode(ex));
        exclusiveCategories.appendChild(categoryName);
        //Add radio buttons
        for (const exclusiveCategoriesKey in Categories.exclusive[ex]) {
            let category = exclusiveCategoriesKey;
            let listItem = document.createElement("li");
            let checkbox = document.createElement("input");
            checkbox.setAttribute("type", "radio");
            checkbox.setAttribute("id", "category_" + category);
            checkbox.setAttribute("name", "category_" + ex);
            checkbox.setAttribute("value", category);
            checkbox.setAttribute("class", "category-checkbox");
            let label = document.createElement("label");
            label.setAttribute("for", "category_" + category);
            label.setAttribute("class", "category-label");
            label.appendChild(document.createTextNode(category));
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            exclusiveCategories.appendChild(listItem);
        }
    }
    //Add non-exclusive categories
    let nonExclusiveCategories = document.createElement("div");
    nonExclusiveCategories.setAttribute("class", "non-exclusive-categories");
    let nonExclusiveCategoriesName = document.createElement("h3");
    nonExclusiveCategoriesName.textContent = "Øvrige kategorier";
    nonExclusiveCategories.appendChild(nonExclusiveCategoriesName);
    for(let i = 0; i < Categories.categories.length; i++){
        let category = Categories.categories[i];
        let listItem = document.createElement("li");
        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", "category_" + category);
        checkbox.setAttribute("name", "category_" + category);
        checkbox.setAttribute("value", category);
        checkbox.setAttribute("class", "category-checkbox");
        let label = document.createElement("label");
        label.setAttribute("for", "category_" + category);
        label.setAttribute("class", "category-label");
        label.appendChild(document.createTextNode(category));
        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        nonExclusiveCategories.appendChild(listItem);
    }
    //Add allergies
    let allergyCategories = document.createElement("div");
    allergyCategories.setAttribute("class", "allergy-categories");
    let allergyCategoriesName = document.createElement("h3");
    allergyCategoriesName.textContent = "Allergier";
    allergyCategories.appendChild(allergyCategoriesName);
    for(let i = 0; i < Categories.allergies.length; i++){
        let category = Categories.allergies[i];
        let listItem = document.createElement("li");
        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", "category_" + category);
        checkbox.setAttribute("name", "category_" + category);
        checkbox.setAttribute("value", category);
        checkbox.setAttribute("class", "category-checkbox");
        let label = document.createElement("label");
        label.setAttribute("for", "category_" + category);
        label.setAttribute("class", "category-label");
        label.appendChild(document.createTextNode(category));
        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        allergyCategories.appendChild(listItem);
    }
    categoryDiv.appendChild(exclusiveCategories);
    categoryDiv.appendChild(nonExclusiveCategories);
    categoryDiv.appendChild(allergyCategories);

    //Clear preview image
    let recipeImage = document.querySelector("#recipe-image-preview-img");
    recipeImage.style.display = "none";
    //Display popup
    newRecipePopup.style.display = "block";
});

closeRecipePopup.addEventListener("click", function (event){
    //Clear popup inputs
    let inputs = document.querySelectorAll("#new-recipe-popup input");
    for (let i = 0; i < inputs.length; i++){
        inputs[i].value = "";
    }
    newRecipePopup.style.display = "none";
});

//Update difficulty text when slider is moved
recipeDifficulty.addEventListener("input", function (event){
    recipeDifficultyText.innerHTML = recipeDifficulty.value;
});

//Toggle between URL and manual recipe
recipeType.addEventListener("input", function (event){
    if (recipeType.checked){
        document.querySelector("#url-recipe").style.display = "block";
        document.querySelector("#manual-recipe").style.display = "none";
    } else {
        document.querySelector("#url-recipe").style.display = "none";
        document.querySelector("#manual-recipe").style.display = "block";
    }
});

//Submit new recipe
submitRecipeBtn.addEventListener("click", function(event) {
    event.preventDefault();
    newRecipe();
});

//Search recipes
searchField.addEventListener("input", function (event){
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

imageInput.addEventListener("change", function (event){
    //Display preview image
    if(this.files.length === 1){
        let image = document.querySelector("#recipe-image-preview-img");
        image.setAttribute("src", URL.createObjectURL(this.files[0]));
        image.style.display = "block";
    } else {
        let image = document.querySelector("#recipe-image-preview-img");
        image.setAttribute("src", "");
        image.style.display = "none";
    }
});

ingredientInput.addEventListener("keydown", (event)=> {
    //Add ingredient on enter
    if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList("ingredients");
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});
quantityInput.addEventListener("keydown", (event)=> {
    //Add ingredient on enter
    if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList("ingredients");
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});
ingredientInputBtn.addEventListener("click", (event)=> {
    //Add ingredient on button click
    if (ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList("ingredients");
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});


instructionInput.addEventListener("keydown", (event)=> {
    //Add instruction on enter
    if (event.key === "Enter" && instructionInput.value !== "") {
        event.preventDefault();
        addNewItemToList("instructions");
        instructionInput.value = "";
    }
});
instructionInputBtn.addEventListener("click", (event)=> {
    //Add instruction on button click
    if (instructionInput.value !== "") {
        event.preventDefault();
        addNewItemToList("instructions");
        instructionInput.value = "";
    }
});

window.onload = function () {
    retrieveGroups();
    loadRecipes();
    getCategories();
}

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
                Categories = data;
            });
        } else {
            console.log("Error getting categories");
        }
    });
}

async function loadRecipes(){
    if (!await checkLoginStatus()) return;
    await getRecipes(Recipes);
    await displayResults(Recipes);
    displayPages();
}

function addNewItemToList(list){
    let type = "";
    if (list === "ingredients") {
        list = document.querySelector("#recipe-ingredient-list");
        type = "ingredient";
    }
    else if (list === "instructions") {
        type = "instruction";
        list = document.querySelector("#recipe-instructions-list");
    }
    else return;

    let li = document.createElement("li");
    if(type === "ingredient") {
        let newItem = document.querySelector("#recipe-ingredient").value;
        let quantity = document.querySelector("#recipe-ingredient-qty").value;
        //create a new Ingredient list item
        li.setAttribute("class", "ingredient-list-item");
        li.setAttribute("name", newItem);
        li.setAttribute("data-qty", quantity);
        li.textContent = newItem;
        //create a checkbox for the list item
        let removeItem = document.createElement("a")
        let removeIcon = document.createElement("img");
        removeIcon.setAttribute("src", "../Images/trashcan.svg");
        removeIcon.setAttribute("alt", "Slett ingrediens");
        removeIcon.setAttribute("class", "close-svg");
        removeIcon.classList.add("remove-item");
        removeItem.appendChild(removeIcon);
        removeItem.addEventListener("click", function (event) {
            list.removeChild(li);
        });
        li.appendChild(document.createTextNode(" " + quantity));
        li.appendChild(removeItem);

    } else {
        li.classList.add("instruction-list-item");
        li.textContent = document.querySelector("#recipe-instructions").value;
        let removeItem = document.createElement("a");
        removeItem.setAttribute("onclick", "removeItemFromList()");
        let removeIcon = document.createElement("img");
        removeIcon.setAttribute("src", "../Images/trashcan.svg");
        removeIcon.classList.add("remove-item");
        removeIcon.setAttribute("alt", "Slett instruks");
        removeIcon.classList.add("close-svg");
        removeItem.appendChild(removeIcon);
        removeItem.addEventListener("click", function (event) {
            list.removeChild(li);
        });
        li.appendChild(removeItem);
    }
    list.appendChild(li);
}


async function newRecipe() {
    let name = document.querySelector("#recipe-name").value;
    let type = document.querySelector("#recipe-type-url");
    let difficulty = document.querySelector("#recipe-difficulty").value;
    let time = document.querySelector("#recipe-time").value;
    let description = document.querySelector("#recipe-description").value;
    let ingredients = {};
    let instructions = [];

    let imageInput = document.querySelector("#recipe-image");
    let filename = "";

    if(name === "" || difficulty === "" || time === "" || (type.checked && document.querySelector("#recipe-url").value === "")
        || (!type.checked && document.querySelector("#recipe-ingredient-list").children.length === 0)
        || (!type.checked && document.querySelector("#recipe-instructions-list").children.length === 0)){

        alert("Alle nødvendige felt må fylles ut");
        return;
    }

    if (imageInput.files.length === 1) {
        // Send the form data to the API
        try {
            filename = await uploadImage(imageInput.files[0], function (response) {
                console.log("Kom meg hit jeg");
                console.log(response);
                filename = response.filename;
            });
            console.log("Image uploaded");
        } catch (error) {
            console.log(error);
            alert("Det skjedde en feil med opplasting av bildet");
            return;
        }
    }

    let username = sessionStorage.getItem("username");
    let groups = [];
    let groupCheckboxes = document.querySelectorAll(".group-checkbox");
    for (let i = 0; i < groupCheckboxes.length; i++) {
        if (groupCheckboxes[i].checked) {
            groups.push(groupCheckboxes[i].value);
        }
    }

    let categories = [];
    let categoryCheckboxes = document.querySelectorAll("input.category-checkbox");
    for (let i = 0; i < categoryCheckboxes.length; i++) {
        if (categoryCheckboxes[i].checked) {
            categories.push(categoryCheckboxes[i].value);
        }
    }
    console.log(categories);
    let recipe = {
        "name": name,
        "difficulty": parseInt(difficulty),
        "time": parseInt(time),
        "image": filename,
        "description": description,
        "categories": categories,
    };

    if (type.checked) {
        console.log("URL recipe");
        recipe.URL = document.querySelector("#recipe-url").value;
    } else {
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

    let data = {
        "owner": username,
        "recipe": recipe,
        "groups": groups,
    };

    console.log(data.recipe);

    try {
        const recipeResponse = await fetch(API_IP + "/recipe/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (recipeResponse.ok) {
            console.log("Recipe added with id:", await recipeResponse.json());
        } else {
            console.log("Error adding recipe", await recipeResponse.json());
        }
    } catch (error) {
        console.log(error);
    }
    location.reload();
}

// Display the pages
function displayPages() {
    // Initialize pag variable
    let pag = [];

    // Check if the search field is empty
    if (searchField.value === "") {
        // Check if there is only one page or fewer
        if (Math.ceil(Recipes.length / MAXRESULTS) <= 1) {
            return; // No need to display pagination
        }
        // Calculate pagination for all recipes
        pag = pagination(page, Math.ceil(Recipes.length / MAXRESULTS));
    } else {
        // Check if there is only one page or fewer for filtered recipes
        if (Math.ceil(filterRecipes(searchRecipes(searchField.value)).length / MAXRESULTS) <= 1) {
            return; // No need to display pagination
        }
        // Calculate pagination for filtered recipes
        pag = pagination(page, Math.ceil(filterRecipes(searchRecipes(searchField.value)).length / MAXRESULTS));
    }

    // Get the pagination div element
    let paginationDiv = document.querySelector("#recipe-nav");
    paginationDiv.innerHTML = ""; // Clear existing pagination buttons

    // Check if pagination buttons are more than 3 to decide whether to show previous and next buttons
    if (pag.length > 3) {
        // Display previous button if not on the first page
        if (page > 0) {
            addButton(paginationDiv, "<", "changePage(" + (page - 1) + ")");
        }

        // Display pagination buttons
        for (let i = 0; i < pag.length; i++) {
            addButton(paginationDiv, pag[i], "changePage(" + (pag[i] - 1) + ")", i === page, pag[i] === "...");
        }

        // Display next button if not on the last page
        if (page < pag.length - 1) {
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


//Change page
function changePage(p) {
    let pages = document.querySelectorAll(".pagination-button");
    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove("active");
    }
    page = p;
    displayResults(filterRecipes(searchRecipes(searchField.value)));
    displayPages();
}

//Get which pages that should be displayed
function pagination(c, m) {
    let current = c,
        last = m,
        delta = 2,
        left = current - delta,
        right = current + delta + 1,
        range = [],
        rangeWithDots = [],
        l;

    for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || i >= left && i < right) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
}

function searchRecipes(text) {
    let primaryMatches = [];
    let secondaryMatches = [];
    if(text === "") return filterRecipes(Recipes);

    //Starts with searchterm
    primaryMatches = Recipes.filter((data) => {
        return data.name.toLowerCase().startsWith(text.toLowerCase());
    });
    //Contains searchterm
    secondaryMatches = Recipes.filter((data) => {
        return data.name.toLowerCase().includes(text.toLowerCase()) && !data.name.toLowerCase().startsWith(text.toLowerCase());
    });
    return primaryMatches.concat(secondaryMatches);
}

function submitFilter() {
    page = 0;
}

function filterRecipes(list) {
    //TODO: Implement filter
    return list;
}

function isDuplicate(list, item) {
    for (let i = 0; i < list.length; i++){
        if (list[i].documentID === item.documentID) return true;
    }
    return false;
}

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
        if (!isDuplicate(displayedRecipes, filteredList[i + page * MAXRESULTS])) {
            displayedRecipes.push(filteredList[i + page * MAXRESULTS]);
        }
    }

    for (let i = 0; i < displayedRecipes.length; i++) {
        let recipe = displayedRecipes[i];
        let recipeA = document.createElement("a");
        //recipeBlock.classList.add("results");
        recipeA.classList.add("result");
        recipeA.setAttribute("href", "Oppskrift/index.html?id=" + recipe.documentID);
        recipeA.setAttribute("id", recipe.documentID)

        let recipeBlock = document.createElement("div");
        recipeBlock.setAttribute("class", "result-text");
        let recipeName = document.createElement("h3");
        recipeName.setAttribute("class", "result-name");
        recipeName.textContent = recipe.name;
        recipeBlock.appendChild(recipeName);

        if (recipe.URL !== "" && recipe.URL !== null) {
            let recipeURL = document.createElement("a");
            recipeURL.setAttribute("href", recipe.URL);
            recipeURL.setAttribute("target", "_blank")
            recipeURL.setAttribute("class", "result-url");
            recipeURL.textContent = recipe.URL;
            recipeBlock.appendChild(recipeURL);
        }
        let recipeDifficulty = document.createElement("p");
        recipeDifficulty.setAttribute("class", "result-difficulty");
        recipeDifficulty.textContent = "Vanskelighetsgrad: " + recipe.difficulty;
        recipeBlock.appendChild(recipeDifficulty);

        let recipeTime = document.createElement("p");
        recipeTime.setAttribute("class", "result-time");
        recipeTime.textContent = "Tid: " + recipe.time + (recipe.time > 1 ? " minutter" : " minutt");
        recipeBlock.appendChild(recipeTime);
        if (recipe.image !== "" && recipe.image !== null) {
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
        resultDiv.appendChild(recipeA);
    }
}