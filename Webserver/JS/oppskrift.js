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
//Event listeners:
newRecipeBtn.addEventListener("click", function (event){
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




//Load recipes:
//getRecipes();
//displayResults();

function newRecipe() {

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
        recipeBlock.setAttribute("id","result_"+(i+1));
        recipeBlock.textContent = recipe.name;
        resultDiv.appendChild(recipeBlock);
    }
}