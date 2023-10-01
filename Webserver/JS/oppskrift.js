//Global variables and constants:
let MAXRESULTS = 9;
let page = 0;
let Recipes = [];
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
        fetch (API_IP + "/recipe/image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body : JSON.stringify(imageInput.files[0]),
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
        "ingredients": ingredients,
        "instructions": instructions,
        "url": url,
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
            return true;
        } else {
            console.log("Error when adding recipe");
            console.log(response.status);
            return false;
        }
    }).catch(error => {
        console.log("Error when sending HTTPS request");
        console.log(error);
        return false;
    });
}

function getRecipes() {
    let username = sessionStorage.getItem("username");
    //if(!checkAuthToken()) return;
    fetch(API_IP + "/user/recipes?groups=true", {
    //fetch("localhost:8080" + "/user/recipes?groups=true", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "username": username,
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

        recipeBlock.textContent = recipe.name;
        resultDiv.appendChild(recipeBlock);
    }
}