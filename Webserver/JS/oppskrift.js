//Global variables and constants:
let MAXRESULTS = 9;
let page = 0;
let Recipes = [];
let Groups = [];
const IMAGEDIR = "/usr/local/apache2/images";

//DOM elements:
let resultDiv = document.querySelector("#results");
let newRecipeBtn = document.querySelector("#new-recipe-btn");
let newRecipePopup = document.querySelector("#new-recipe-popup");
let closeRecipePopup = document.querySelector("#close-recipe-popup");
let recipeDifficulty = document.querySelector("#recipe-difficulty");
let recipeDifficultyText = document.querySelector("#difficulty-value-label");
let recipeType = document.querySelector("#recipe-type-url");
let submitRecipeBtn = document.querySelector("#submit-new-recipe");

//Event listeners:
newRecipeBtn.addEventListener("click", function (event){
    if(!checkAuthToken()){
        alert("Du må logge inn for å legge til oppskrifter");
        return;
    }
    //Clear groups
    let groupDiv = document.querySelector("#share-with-groups");
    groupDiv.innerHTML = "";
    for(let i = 0; i < Groups.length; i++){
        let group = Groups[i];
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
        groupDiv.appendChild(checkbox);
        groupDiv.appendChild(label);
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


//Load recipes:
getRecipes();
displayResults();
getGroups();

function newRecipe() {
    let name = document.querySelector("#recipe-name").value;
    let type = document.querySelector("#recipe-type-url");
    let difficulty = document.querySelector("#recipe-difficulty").value;
    let time = document.querySelector("#recipe-time").value;
    let url = "";
    let ingredients = "";
    let instructions = "";
    if (type.checked){
        url = document.querySelector("#recipe-url").value;
    } else {
        ingredients = document.querySelector("#recipe-ingredients").value;
        instructions = document.querySelector("#recipe-instructions").value;
    }

    let imageInput = document.querySelector("#recipe-image");
    let filename = "";
    if (imageInput.files.length === 1){
        // Create a new FormData object
        const formData = new FormData();

        formData.append("file", imageInput.files[0]);

        fetch (API_IP + "/recipe/image", {
            method: "POST",
            body : formData,
        }).then(response => {
            if (response.status === 200){
                console.log("Image uploaded");
                return response.json();
            } else {
                console.log("Error when uploading image");
                console.log(response.status);
                return false;
            }
        }).then(data => {
            if (data !== false){
                console.log(data);
                filename = data.filename;
            }
        }).catch(error => {
            console.log("Error when uploading image");
            console.log(error);
        });
    }
    let username = sessionStorage.getItem("username");
    let groups = [];
    let recipe = {
        "name": name,
        "type": type,
        "difficulty": difficulty,
        "time": time,
        //"ingredients": ingredients,
        //"instructions": instructions,
        "URL": url,
        "image": filename,
    }
    let data = {
        "username": username,
        "recipe": recipe,
        "groups": groups,
    }
    fetch(API_IP + "/recipe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then(response => {
        if (response.status === 200){
            console.log("Recipe added with id: " + response.json());
        } else {
            console.log("Error when adding recipe");
            console.log(response.status);
        }
    }).catch(error => {
        console.log("Error when sending HTTPS request");
        console.log(error);
    });
}

function getGroups() {
    let username = sessionStorage.getItem("username");
    //if(!checkAuthToken()) return;
    fetch(API_IP + "/user/groups?username=" + username, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            console.log("Error when fetching groups");
            return false;
        }
    }).then(data => {
        if (data !== false) {
            console.log(data);
            for (let i = 0; i < data.length; i++) {
                Groups.push(data[i]);
            }
        }
    }).catch(error => {
        console.log("Error when fetching groups");
        console.log(error);
    });

}

function getRecipes() {
    let username = sessionStorage.getItem("username");
    //if(!checkAuthToken()) return;
    fetch(API_IP + "/recipes/" + username + "?groups=true", {
    //fetch("localhost:8080" + "/user/recipes?groups=true", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    }).then(response => {
        if (response.status === 200){
            return response.json();
        } else {
            console.log("Error when fetching recipes");
            return false;
        }
    }
    ).then(data => {
        if (data !== false){
            console.log(data);
            for (let i = 0; i < data.length; i++){
                Recipes.push(data[i]);
            }
        }
    }).catch(error => {
        console.log("Error when fetching recipes");
        console.log(error);
    });

    displayResults();
}

function searchRecipes() {

}

function submitFilter() {
    page = 0;
}

function filterRecipes() {
    //TODO: Implement filter
    return Recipes;
}

function duplicate(list, item) {
    for (let i = 0; i < list.length; i++){
        if (list[i].id === item.id) return true;
    }
    return false;
}

function displayResults(){
    //Filter recipes
    let filteredList = filterRecipes();

    //Limit output to MAXRESULTS
    let displayedRecipes = [];
    for (let i = 0; i < MAXRESULTS; i++){
        if (filteredList.length <= i + page * MAXRESULTS) break;
        if (duplicate(displayedRecipes, filteredList[i] + page * MAXRESULTS)) continue;
        displayedRecipes.push(filteredList[i + page * MAXRESULTS]);
    }

    //Clear results
    resultDiv.innerHTML = "";

    //Display
    if (displayedRecipes.length === 0) resultDiv.appendChild(document.createTextNode("Du har ingen oppskrifter lagret"));

    for (let i = 0; i < displayedRecipes.length; i++){
        let recipe = displayedRecipes[i];
        let recipeBlock = document.createElement("div");
        recipeBlock.setAttribute("class","result_"+(i+1));
        recipeBlock.setAttribute("id","result_"+(i+1));
        let recipeImage = document.createElement("img");
        recipeImage.setAttribute("src", IMAGEDIR + "/" + recipe.image);
        recipeImage.setAttribute("alt", recipe.name);
        recipeImage.setAttribute("class", "result-image");
        let recipeName = document.createElement("h3");
        recipeName.setAttribute("class", "result-name");
        recipeName.textContent = recipe.name;
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

        recipeBlock.appendChild(recipeName);
        recipeBlock.appendChild(recipeImage);
        recipeBlock.appendChild(recipeURL);
        recipeBlock.appendChild(recipeDifficulty);
        resultDiv.appendChild(recipeBlock);
    }
}