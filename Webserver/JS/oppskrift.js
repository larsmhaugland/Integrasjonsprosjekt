//Global variables and constants:
let MAXRESULTS = 9;
let page = 0;
let Recipes = [];
const IMAGEDIR = "/usr/local/apache2/images/";

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
    if(!checkAuthToken()){
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
        checkbox.setAttribute("id", "group_" + group.id);
        checkbox.setAttribute("name", "group_" + group.id);
        checkbox.setAttribute("value", group.id);
        checkbox.setAttribute("class", "group-checkbox");
        let label = document.createElement("label");
        label.setAttribute("for", "group_" + group.id);
        label.setAttribute("class", "group-label");
        label.appendChild(document.createTextNode(group.name));
        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        groupDiv.appendChild(listItem);
    }
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
    } else {
        let image = document.querySelector("#recipe-image-preview-img");
        image.setAttribute("src", "");
    }
});
let ingredientInputBtn = document.querySelector("#add-ingredient-btn");
let ingredientInput = document.querySelector("#recipe-ingredient");
let quantityInput = document.querySelector("#recipe-ingredient-qty");
ingredientInput.addEventListener("keydown", (event)=> {
    if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList();
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});
quantityInput.addEventListener("keydown", (event)=> {
    if (event.key === "Enter" && ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList();
        ingredientInput.value = "";
        quantityInput.value = "";
    }
});
ingredientInputBtn.addEventListener("click", (event)=> {
    if (ingredientInput.value !== "" && quantityInput.value !== "") {
        event.preventDefault();
        addNewItemToList();
        ingredientInput.value = "";
        quantityInput.value = "";
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

loadRecipes().then(r => console.log("Recipes loaded"));



function addNewItemToList(){
    let newItem = document.querySelector("#recipe-ingredient").value;
    let quantity = document.querySelector("#recipe-ingredient-qty").value;

    if(newItem === ""){
        return;
    } else if (quantity === ""){
        alert("Du må skrive inn en mengde av ingrediensen");
    }

    let list = document.querySelector("#recipe-ingredient-list");
    let li = document.createElement("li");
    li.setAttribute("class", "ingredient-list-item");
    li.setAttribute("data-qty", quantity);
    li.textContent = newItem;
    //create a checkbox for the list item
    let removeItem = document.createElement("a");
    removeItem.setAttribute("onclick", "removeItemFromList()");
    let removeIcon = document.createElement("img");
    removeIcon.setAttribute("src", "../Images/trashcan.svg");
    removeIcon.setAttribute("alt", "Slett");
    removeIcon.setAttribute("class", "close-svg");
    removeIcon.classList.add("remove-item");
    removeItem.appendChild(removeIcon);
    removeItem.addEventListener("click", function (event){
        list.removeChild(li);
    });
    li.appendChild(document.createTextNode(quantity));
    li.appendChild(removeItem);
    list.appendChild(li);

}

async function newRecipe() {
    let name = document.querySelector("#recipe-name").value;
    let type = document.querySelector("#recipe-type-url");
    let difficulty = document.querySelector("#recipe-difficulty").value;
    let time = document.querySelector("#recipe-time").value;
    let url = "";
    let ingredients = {};
    let instructions = "";

    let imageInput = document.querySelector("#recipe-image");
    let filename = "";
    if (imageInput.files.length === 1) {
        // Create a new FormData object
        const formData = new FormData();
        formData.append("file", imageInput.files[0]);

        const imageResponse = await fetch(API_IP + "/image/", {
            method: "POST",
            body: formData,
        });

        if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            console.log("Image uploaded");
            filename = imageData.filename;
        } else {
            console.log("Error when uploading image", imageResponse.status, "Error message:", await imageResponse.json());
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
        "difficulty": difficulty,
        "time": time,
        "image": filename,
    };

    if (type.checked) {
        recipe.URL = url;
    } else {
        let list = document.querySelectorAll("#recipe-ingredient-list li");
        list.forEach((item) => {
            let ingredient = item.textContent;
            ingredients[ingredient] = item.getAttribute("data-qty");
        });
        recipe.ingredients = ingredients;
        recipe.instructions = instructions;
    }

    let data = {
        "owner": username,
        "recipe": recipe,
        "groups": groups,
    };

    console.log(data.owner);
    console.log(data.recipe);
    console.log(data.groups);

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
        console.log("Error when adding recipe", recipeResponse.status, "Error message:", await recipeResponse.json());
    }
}

//Display the pages
function displayPages() {
    let pag = [];
    if (searchField.value === "")
        pag = pagination(page, Math.ceil(Recipes.length / MAXRESULTS));
    else
        pag = pagination(page, Math.ceil(filterRecipes(searchRecipes(searchField.value)) / MAXRESULTS));

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
    matches = Recipes.filter((data) => {
        return data.name.toLowerCase().includes(text.toLowerCase());
    });
    return matches;
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
        if (list[i].id === item.id) return true;
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
    for (let i = 0; i < MAXRESULTS; i++){
        if (filteredList.length <= i + page * MAXRESULTS) break;
        if (isDuplicate(displayedRecipes, filteredList[i] + page * MAXRESULTS)) continue;
        displayedRecipes.push(filteredList[i + page * MAXRESULTS]);
    }



    for (let i = 0; i < displayedRecipes.length; i++) {
        let recipe = displayedRecipes[i];
        let recipeBlock = document.createElement("div");
        recipeBlock.classList.add("result_" + (i + 1));
        recipeBlock.classList.add("results");

        recipeBlock.setAttribute("id", recipe.documentID)

        let recipeName = document.createElement("h3");
        recipeName.setAttribute("class", "result-name");
        recipeName.textContent = recipe.name;
        recipeBlock.appendChild(recipeName);
        if (recipe.image !== "" && recipe.image !== null) {
            let recipeImage = document.createElement("img");
            recipeImage.setAttribute("src", IMAGEDIR + "/" + recipe.image);
            recipeImage.setAttribute("alt", recipe.name);
            recipeImage.setAttribute("class", "result-image");
            recipeBlock.appendChild(recipeImage);
        }
        let recipeURL = document.createElement("a");
        recipeURL.setAttribute("href", recipe.URL);
        recipeURL.setAttribute("target", "_blank")
        recipeURL.setAttribute("class", "result-url");
        recipeURL.textContent = recipe.URL;

        let recipeDifficulty = document.createElement("p");
        recipeDifficulty.setAttribute("class", "result-difficulty");
        recipeDifficulty.textContent = "Vanskelighetsgrad: " + recipe.difficulty;

        let recipeTime = document.createElement("p");
        recipeTime.setAttribute("class", "result-time");
        recipeTime.textContent = "Tid: " + recipe.time + " minutter";



        recipeBlock.appendChild(recipeURL);
        recipeBlock.appendChild(recipeDifficulty);
        recipeBlock.appendChild(recipeTime);
        resultDiv.appendChild(recipeBlock);
    }
}