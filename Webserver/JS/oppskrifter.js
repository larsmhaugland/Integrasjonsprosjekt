//Global variables and constants:
let MAXRESULTS = 9;
let page = 0;
let Recipes = [];


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
    let recipeImage = document.querySelector("#recipe-image-preview-img");
    recipeImage.style.display = "none";
    newRecipePopup.style.display = "block";
});
closeRecipePopup.addEventListener("click", function (event){
    newRecipePopup.style.display = "none";
});
recipeDifficulty.addEventListener("input", function (event){
    recipeDifficultyText.innerHTML = recipeDifficulty.value;
});
recipeType.addEventListener("input", function (event){
    if (recipeType.checked){
        document.querySelector("#url-recipe").style.display = "block";
        document.querySelector("#manual-recipe").style.display = "none";
    } else {
        document.querySelector("#url-recipe").style.display = "none";
        document.querySelector("#manual-recipe").style.display = "block";
    }
});
submitRecipeBtn.addEventListener("click", newRecipe);
searchField.addEventListener("input", function (event){
    page = 0;
    let searchlist = searchRecipes(this.value);
    let filteredList = filterRecipes(searchlist);
    displayResults(filteredList);
});

imageInput.addEventListener("change", function (event){
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
let ingredientInputBtn = document.querySelector("#add-ingredient-btn");
let ingredientInput = document.querySelector("#recipe-ingredient");
let quantityInput = document.querySelector("#recipe-ingredient-qty");
ingredientInput.addEventListener("keydown", (event)=> {
    if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList("ingredients");
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});
quantityInput.addEventListener("keydown", (event)=> {
    if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList("ingredients");
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});
ingredientInputBtn.addEventListener("click", (event)=> {
    if (ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList("ingredients");
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});

let instructionInputBtn = document.querySelector("#add-instruction-btn");
let instructionInput = document.querySelector("#recipe-instructions");
instructionInput.addEventListener("keydown", (event)=> {
    if (event.key === "Enter" && instructionInput.value !== "") {
        event.preventDefault();
        addNewItemToList("instructions");
        instructionInput.value = "";
    }
});
instructionInputBtn.addEventListener("click", (event)=> {
    if (instructionInput.value !== "") {
        event.preventDefault();
        addNewItemToList("instructions");
        instructionInput.value = "";
    }
});

//Load recipes:
retrieveGroups();


async function loadRecipes(){
    if (!await checkAuthToken()) return;
    await getRecipes(Recipes);
    await displayResults(Recipes);
    displayPages();
}

loadRecipes();



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
        removeIcon.setAttribute("alt", "Slett");
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
    let url = "";
    let ingredients = {};
    let instructions = [];

    let imageInput = document.querySelector("#recipe-image");
    let filename = "";
    if (imageInput.files.length === 1) {
        // Create a new FormData object
        const formData = new FormData();
        formData.append("file", imageInput.files[0]);
        // Send the form data to the API
        try {
            const response = await fetch(API_IP + "/image/", {
                method: "POST",
                body: formData,
            }).then((response) => {
                console.log("Response:", response)
                return response.json();
            }).then((data) => {
                console.log("Data:", data);
                filename = data["filename"];
            }).catch((error) => {
                console.log(error);
                alert("Det skjedde en feil med opplasting av bildet");
            });
            console.log("File: " + filename);
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

    let recipe = {
        "name": name,
        "difficulty": parseInt(difficulty),
        "time": parseInt(time),
        "image": filename,
    };

    if (type.checked) {
        recipe.URL = url;
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

//Display the pages
function displayPages() {
    let pag = [];
    if (searchField.value === "") {
        if (Math.ceil(Recipes.length / MAXRESULTS) <= 1) {
            return
        }
        pag = pagination(page, Math.ceil(Recipes.length / MAXRESULTS));
    }
    else {
        if (Math.ceil(Recipes.length / MAXRESULTS) <= 1) {
            return
        }
        pag = pagination(page, Math.ceil(filterRecipes(searchRecipes(searchField.value)) / MAXRESULTS));
    }

    let paginationDiv = document.querySelector("#recipe-nav");
    paginationDiv.innerHTML = "";
    for (let i = 0; i < pag.length; i++) {
        let button = document.createElement("button");
        button.setAttribute("class", "pagination-button");
        button.setAttribute("onclick", "changePage(" + i + ")");
        button.textContent = pag[i];
        paginationDiv.appendChild(button);
    }
}

//Change page
function changePage(p) {
    let pages = document.querySelectorAll(".pagination-button");
    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove("active");
    }
    pages[p].classList.add("active");
    page = p;
    displayResults(filterRecipes(searchRecipes(searchField.value)));
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
            checkImageExists(IMAGEDIR + recipe.image + ".jpeg", function (exists) {
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