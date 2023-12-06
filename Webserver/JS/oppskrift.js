let recipeEdit = document.querySelector("#edit-recipe-btn");
let editRecipePopup = document.querySelector("#edit-recipe-popup");
let closeRecipePopup = document.querySelector("#close-recipe-popup");
let recipeDifficulty = document.querySelector("#edit-difficulty");
let displayedRecipe = null;
let deleteRecipeBtn = document.querySelector("#delete-recipe");
let owner = null;

//If edit button is pressed
recipeEdit.addEventListener("click", function () {
    //Check login status
    if(sessionStorage.getItem("loggedIn") !== "true"){
        alert("Du må logge inn for å endre oppskrifter");
        return;
    }
    //Check if recipe is loaded
    if(displayedRecipe === null){
        alert("Kunne ikke finne oppskriften");
        return;
    }
    //Get elements
    let recipeName = document.querySelector("#edit-name");
    let recipeURL = document.querySelector("#edit-url");
    let instructions = document.querySelector("#edit-instructions-list").getElementsByTagName("li");
    let ingredients = document.querySelector("#edit-ingredient-list").getElementsByTagName("li");
    let description = document.querySelector("#edit-description");
    let time = document.querySelector("#edit-time");
    let difficulty = document.querySelector("#edit-difficulty");
    let difficultyText = document.querySelector("#difficulty-value-label");

    let urlDiv = document.querySelector("#url-recipe");
    let manualRecipeDiv = document.querySelector("#manual-recipe");

    //Prefill values from displayed recipe
    recipeName.value = displayedRecipe.name;
    recipeURL.value = displayedRecipe.URL;
    description.value = displayedRecipe.description;
    time.value = displayedRecipe.time;
    difficulty.value = displayedRecipe.difficulty;
    difficultyText.innerHTML = displayedRecipe.difficulty;

    //Prefill instructions
    if(displayedRecipe.URL === null || displayedRecipe.URL === "" && displayedRecipe.ingredients !== null  && displayedRecipe.instructions !== null) {
        let instructions = document.querySelector("#edit-instructions-list");
        //Reset instructions
        instructions.innerHTML = "";
        //For each instruction in the displayed recipe, create a list item
        for (let i = 0; i < displayedRecipe.instructions.length; i++) {
            let instruction = document.createElement("li");
            let label = document.createElement("label");
            label.innerHTML = displayedRecipe.instructions[i];
            instruction.appendChild(label);
            //create a checkbox for the list item
            let removeItem = document.createElement("a")
            let removeIcon = document.createElement("img");
            removeIcon.setAttribute("src", "../../Images/trashcan.svg");
            removeIcon.setAttribute("alt", "Slett ingrediens");
            removeIcon.setAttribute("class", "close-svg");
            removeIcon.classList.add("remove-item");
            removeItem.appendChild(removeIcon);
            //Add event listener to remove the list item when the icon is clicked
            removeItem.addEventListener("click", function (event) {
                instructions.removeChild(instruction);
            });
            instruction.appendChild(removeItem);
            instructions.appendChild(instruction);
        }

        let ingredients = document.querySelector("#edit-ingredient-list");
        //Reset ingredients
        ingredients.innerHTML = "";
        //For each ingredient in the displayed recipe, create a list item
        for (let [key, value] of Object.entries(displayedRecipe.ingredients)) {
            let ingredient = document.createElement("li");
            let label = document.createElement("label");
            label.innerHTML = key + ": " + value;
            ingredient.appendChild(label);
            //create a remove icon for the list item
            let removeItem = document.createElement("a")
            let removeIcon = document.createElement("img");
            removeIcon.setAttribute("src", "../../Images/trashcan.svg");
            removeIcon.setAttribute("alt", "Slett ingrediens");
            removeIcon.setAttribute("class", "close-svg");
            removeIcon.classList.add("remove-item");
            removeItem.appendChild(removeIcon);
            //Add event listener to remove the list item when the icon is clicked
            removeItem.addEventListener("click", function (event) {
                ingredients.removeChild(ingredient);
            });
            ingredient.appendChild(removeItem);
            ingredients.appendChild(ingredient);
        }
        manualRecipeDiv.style.display = "block";
        urlDiv.style.display = "none";

    } else {
        manualRecipeDiv.style.display = "none";
        urlDiv.style.display = "block";
    }

    editRecipePopup.style.display = "block";
});
//Update difficulty text when difficulty slider is moved
recipeDifficulty.addEventListener("input", function (event){
    let recipeDifficultyText = document.querySelector("#difficulty-value-label");
    recipeDifficultyText.innerHTML = recipeDifficulty.value;
});

//Close edit recipe popup
closeRecipePopup.addEventListener("click", function (event) {
    event.preventDefault();
    editRecipePopup.style.display = "none";
});


//Submit changes to recipe
let submitEditRecipeBtn = document.querySelector("#submit-edit-recipe");
submitEditRecipeBtn.addEventListener("click", function(event ) {
    event.preventDefault();
    editRecipe();
});


deleteRecipeBtn.addEventListener("click", function (event) {
    event.preventDefault();
    let url = window.location.search;
    //User needs to confirm that they want to delete the recipe
    let confim = window.confirm("Er du sikker på at du vil slette oppskriften?");
    if(!confim){
        alert("Oppskrift ble IKKE slettet");
        return;
    }
    // Send delete request to API
    const params = new URLSearchParams(url);
    fetch(API_IP + "/recipe/" + params.get('id'), {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"username": owner})
    }).then(response => {
        if (response.status === 200) {
            alert("Oppskriften ble slettet");
            window.location.href = "../index.html";
        } else {
            alert("Kunne ikke slette oppskriften");
        }
    }).catch(error  => {
        alert("Det skjedde en feil ved sletting av oppskrift");
        console.log("Error when sending HTTPS request");
    });
});

window.onload = function () {
    console.log("hei");
    //Load recipe
    updateLoginStatus();
    getRecipe();
};

async function getRecipe() {
    let url = window.location.search;
    //Get recipe ID from URL
    const params = new URLSearchParams(url);
    //Get recipe from API
    let response = await fetch(API_IP + "/recipe/"+params.get('id')+"?single=true");
    if (!response.ok) {
        console.log("Error when fetching recipe");
        return;
    }
    let data = await response.json();
    //Display recipe
    displayedRecipe = data;
    displayRecipe(data);
    console.log(data);
}

function editRecipe() {
    //Get elements
    let recipeName = document.querySelector("#edit-name");
    let recipeURL = document.querySelector("#edit-url");
    let instructionList = document.querySelector("#edit-instructions-list").getElementsByTagName("li");
    let ingredientList = document.querySelector("#edit-ingredient-list").getElementsByTagName("li");
    let description = document.querySelector("#edit-description");
    let time = document.querySelector("#edit-time");
    let difficulty = document.querySelector("#edit-difficulty");

    //Check if all fields are filled
    if(recipeName.value === "" || description.value === "" || time.value === "" || difficulty.value === ""){
        alert("Fyll ut alle feltene");
        return;
    }
    //Get instructions and ingredients
    let instructions = [];
    for (let i = 0; i < instructionList.length; i++) {
        instructions.push(instructionList[i].getElementsByTagName("label")[0].innerHTML);
    }
    let ingredients = {};
    for (let i = 0; i < ingredientList.length; i++) {
        let ingredient = ingredientList[i].getElementsByTagName("label")[0].innerHTML.split(": ");
        ingredients[ingredient[0]] = ingredient[1];
    }
    //Create recipe object
    let recipe = {
        "name": recipeName.value,
        "URL": recipeURL.value,
        "instructions": instructions,
        "ingredients": ingredients,
        "description": description.value,
        "time": parseInt(time.value),
        "difficulty": parseInt(difficulty.value),
        "documentID": displayedRecipe.documentID,
        "image": displayedRecipe.image
    };
    //Send recipe to API
    fetch(API_IP + "/recipe/" + recipe.documentID, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(recipe)
    }).then(response => {
        console.log(response.status);
        if (response.status === 200) {
            alert("Oppskriften ble endret");
            //Reload page
            window.location.reload();
        } else {
            alert("Kunne ikke endre oppskriften");
        }
    }).catch(error => {
        alert("Det skjedde en feil ved endring av oppskrift");
        console.log("Error when sending HTTPS request");
        console.log(error);
    });
}

async function displayRecipe(Recipe) {
    //Check if user is logged in
    if (sessionStorage.getItem("username") != null && sessionStorage.getItem("loggedIn") === "true") {
        //Get recipes from API
        let response = await fetch(API_IP + "/recipe" + "/" + sessionStorage.getItem("username"));
        if (!response.ok) {
            recipeEdit.style.display = "none";
            return;
        } else {
            let data = await response.json();
            for (let i = 0; i < data.userRecipes.length; i++) {
                //Check if user is owner of recipe
                if (data.userRecipes[i].documentID === Recipe.documentID) {
                    recipeEdit.style.display = "inline";
                    owner = sessionStorage.getItem("username");
                }
            }
        }
    }

    let name = document.querySelector("#recipe-name");
    let recipeContent = document.querySelector("#recipe-content");
    let recipeImage = document.querySelector("#recipe-image");
    recipeContent.innerHTML = "";
    recipeImage.innerHTML = "";
    name.innerHTML = Recipe.name;
    //If recipe is manual
    if(Recipe.URL === null || Recipe.URL === "" && Recipe.ingredients !== null  && Recipe.instructions !== null) {
        //Create list of ingredients
        let ingredients = document.createElement("div");
        ingredients.innerHTML = "Ingredienser: ";
        let ingredientList = document.createElement("ul");
        ingredientList.setAttribute("id", "ingredientsList")
        for (let [key, value] of Object.entries(Recipe.ingredients)) {
            let ingredient = document.createElement("li");
            ingredient.innerHTML = key + ": " + value;
            ingredientList.appendChild(ingredient);
        }
        ingredients.appendChild(ingredientList);
        recipeContent.appendChild(ingredients);
        //Create list of instructions
        recipeContent.appendChild(document.createTextNode("Instruksjoner: "));
        let instructions = document.createElement("ol");
        instructions.setAttribute("id", "instructions");
        for (let i = 0; i < Recipe.instructions.length; i++) {
            let instruction = document.createElement("li");
            instruction.innerHTML = Recipe.instructions[i];
            instructions.appendChild(instruction);
        }
        recipeContent.appendChild(instructions);
    } else {
        //Create link to recipe
        let link = document.createElement("a");
        link.href = Recipe.URL;
        link.setAttribute("target", "_blank");
        link.setAttribute("id", "recipe-link");
        link.innerHTML = "Link til oppskrift";
        recipeContent.appendChild(link);
    }
    //Create description
    if (Recipe.description !== null && Recipe.description !== "") {
        let description = document.createElement("div");
        description.setAttribute("id", "description")
        description.innerHTML = "Beskrivelse: " + Recipe.description;
        recipeContent.appendChild(description);
    }
    //Create time
    let time = document.createElement("div");
    time.setAttribute("id", "time")
    time.innerHTML = "Tid: " + Recipe.time + " minutter";
    recipeContent.appendChild(time);
    //Create difficulty
    let difficulty = document.createElement("div");
    difficulty.setAttribute("id", "difficulty")
    difficulty.innerHTML = "Vanskelighetsgrad: " + Recipe.difficulty;
    recipeContent.appendChild(difficulty);

    //Create image
    if(Recipe.image !== null && Recipe.image !== "") {
        //Check if image exists on server
        checkImageExists("../../" + IMAGEDIR + Recipe.image + ".jpeg", function (exists) {
            if (!exists) {
                return;
            }
            //Create image element
            let image = document.createElement("img");
            image.src = "../../" + IMAGEDIR + Recipe.image+".jpeg";
            recipeImage.appendChild(image);
        });
    }
}