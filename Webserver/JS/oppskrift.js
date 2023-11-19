let recipeEdit = document.querySelector("#edit-recipe-btn");
let editRecipePopup = document.querySelector("#edit-recipe-popup");
let closeRecipePopup = document.querySelector("#close-recipe-popup");
let recipeDifficulty = document.querySelector("#edit-difficulty");
let displayedRecipe = null;
let deleteRecipeBtn = document.querySelector("#delete-recipe");
let owner = null;

recipeEdit.addEventListener("click", function () {
    if(sessionStorage.getItem("loggedIn") !== "true"){
        alert("Du må logge inn for å endre oppskrifter");
        return;
    }
    if(displayedRecipe === null){
        alert("Kunne ikke finne oppskriften");
        return;
    }
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

    recipeName.value = displayedRecipe.name;
    recipeURL.value = displayedRecipe.URL;
    description.value = displayedRecipe.description;
    time.value = displayedRecipe.time;
    difficulty.value = displayedRecipe.difficulty;
    difficultyText.innerHTML = displayedRecipe.difficulty;

    if(displayedRecipe.URL === null || displayedRecipe.URL === "" && displayedRecipe.ingredients !== null  && displayedRecipe.instructions !== null) {
        let instructions = document.querySelector("#edit-instructions-list");
        instructions.innerHTML = "";
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
            removeItem.addEventListener("click", function (event) {
                instructions.removeChild(instruction);
            });
            instruction.appendChild(removeItem);
            instructions.appendChild(instruction);
        }
        let ingredients = document.querySelector("#edit-ingredient-list");
        ingredients.innerHTML = "";
        for (let [key, value] of Object.entries(displayedRecipe.ingredients)) {
            let ingredient = document.createElement("li");
            let label = document.createElement("label");
            label.innerHTML = key + ": " + value;
            ingredient.appendChild(label);
            //create a checkbox for the list item
            let removeItem = document.createElement("a")
            let removeIcon = document.createElement("img");
            removeIcon.setAttribute("src", "../../Images/trashcan.svg");
            removeIcon.setAttribute("alt", "Slett ingrediens");
            removeIcon.setAttribute("class", "close-svg");
            removeIcon.classList.add("remove-item");
            removeItem.appendChild(removeIcon);
            removeItem.addEventListener("click", function (event) {
                ingredients.removeChild(ingredient);
            });
            ingredient.appendChild(removeItem);
            ingredients.appendChild(ingredient);
        }
        manualRecipeDiv.style.display = "block";
        urlDiv.style.display = "none";
        //console.log("Showing manual recipe");

    } else {
        //console.log("Showing URL");
        manualRecipeDiv.style.display = "none";
        urlDiv.style.display = "block";
    }

    editRecipePopup.style.display = "block";
});

recipeDifficulty.addEventListener("input", function (event){
    let recipeDifficultyText = document.querySelector("#difficulty-value-label");
    recipeDifficultyText.innerHTML = recipeDifficulty.value;
});

closeRecipePopup.addEventListener("click", function (event) {
    event.preventDefault();
    editRecipePopup.style.display = "none";
});



let submitEditRecipeBtn = document.querySelector("#submit-edit-recipe");
submitEditRecipeBtn.addEventListener("click", function(event ) {
    event.preventDefault();
    editRecipe();
});


deleteRecipeBtn.addEventListener("click", function (event) {
    event.preventDefault();
    let url = window.location.search;
    let confim = window.confirm("Er du sikker på at du vil slette oppskriften?");
    if(!confim){
        alert("Oppskrift ble IKKE slettet");
        return;
    }

    const params = new URLSearchParams(url);
    fetch(API_IP + "/recipe/" + params.get('id'), {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"username": owner})
    }).then(response => {
        console.log(response.status);
        if (response.status === 200) {
            alert("Oppskriften ble slettet");
            window.location.href = "../index.html";
        } else {
            console.log(response.json());
            alert("Kunne ikke slette oppskriften");
        }
    }).catch(error => {
        alert("Det skjedde en feil ved sletting av oppskrift");
        console.log("Error when sending HTTPS request");
        console.log(error);

    });
});

window.onload = function () {
//    console.log("onload");
    getRecipe();
    updateLoginStatus();
};

async function getRecipe() {
    let url = window.location.search;
    const params = new URLSearchParams(url);
    let response = await fetch(API_IP + "/recipe/"+params.get('id')+"?single=true");
    if (!response.ok) {
        console.log("Error when fetching recipe");
        return;
    }
    let data = await response.json();
    displayedRecipe = data;
    displayRecipe(data);
}

function editRecipe() {
    let recipeName = document.querySelector("#edit-name");
    let recipeURL = document.querySelector("#edit-url");
    let instructionList = document.querySelector("#edit-instructions-list").getElementsByTagName("li");
    let ingredientList = document.querySelector("#edit-ingredient-list").getElementsByTagName("li");
    let description = document.querySelector("#edit-description");
    let time = document.querySelector("#edit-time");
    let difficulty = document.querySelector("#edit-difficulty");
    //let image = document.querySelector("#edit-image");


    if(recipeName.value === "" || description.value === "" || time.value === "" || difficulty.value === ""){
        alert("Fyll ut alle feltene");
        return;
    }
    let instructions = [];
    for (let i = 0; i < instructionList.length; i++) {
        instructions.push(instructionList[i].getElementsByTagName("label")[0].innerHTML);
    }
    let ingredients = {};
    for (let i = 0; i < ingredientList.length; i++) {

        let ingredient = ingredientList[i].getElementsByTagName("label")[0].innerHTML.split(": ");
        ingredients[ingredient[0]] = ingredient[1];
    }

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
    if (sessionStorage.getItem("username") != null && sessionStorage.getItem("loggedIn") === "true") {
        let response = await fetch(API_IP + "/recipe" + "/" + sessionStorage.getItem("username"));

        if (!response.ok) {
            recipeEdit.style.display = "none";
            return;
        } else {
            let data = await response.json();
            for (let i = 0; i < data.userRecipes.length; i++) {
                if (data.userRecipes[i].documentID === Recipe.documentID) {
                    ///console.log(data.userRecipes[i].documentID + " " + Recipe.documentID);
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

    if(Recipe.URL === null || Recipe.URL === "" && Recipe.ingredients !== null  && Recipe.instructions !== null) {
        let ingredients = document.createElement("div");
        ingredients.innerHTML = "Ingredienser: ";
        let ingredientList = document.createElement("ul");
        ingredientList.setAttribute("id", "ingredientsList")
        //Go through map of ingredients:
        for (let [key, value] of Object.entries(Recipe.ingredients)) {
            let ingredient = document.createElement("li");
            ingredient.innerHTML = key + ": " + value;
            ingredientList.appendChild(ingredient);
        }
        ingredients.appendChild(ingredientList);
        recipeContent.appendChild(ingredients);

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
        let link = document.createElement("a");
        link.href = Recipe.URL;
        link.setAttribute("target", "_blank");
        link.setAttribute("id", "recipe-link");
        link.innerHTML = "Link til oppskrift";
        recipeContent.appendChild(link);
    }

    if (Recipe.description !== null && Recipe.description !== "") {
        let description = document.createElement("div");
        description.setAttribute("id", "description")
        description.innerHTML = "Beskrivelse: " + Recipe.description;
        recipeContent.appendChild(description);
    }

    let time = document.createElement("div");
    time.setAttribute("id", "time")
    time.innerHTML = "Tid: " + Recipe.time + " minutter";
    recipeContent.appendChild(time);

    let difficulty = document.createElement("div");
    difficulty.setAttribute("id", "difficulty")
    difficulty.innerHTML = "Vanskelighetsgrad: " + Recipe.difficulty;
    recipeContent.appendChild(difficulty);

    if(Recipe.image !== null && Recipe.image !== "") {
        checkImageExists("../../" + IMAGEDIR + Recipe.image + ".jpeg", function (exists) {
            if (!exists) {
                return;
            }
            let image = document.createElement("img");
            image.src = "../../" + IMAGEDIR + Recipe.image+".jpeg";
            recipeImage.appendChild(image);
        });
    }
}