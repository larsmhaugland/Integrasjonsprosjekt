let recipeEdit = document.querySelector("#edit-recipe-btn");
recipeEdit.addEventListener("click", function () {
    editRecipe();
});

window.onload = function () {
    console.log("onload");
    getRecipe();
};

async function getRecipe() {
    let url = window.location.search;
    const params = new URLSearchParams(url);
    let response = await fetch(API_IP + "/recipe/"+params.get('id')+"?single=true");
    if (!response.ok) {
        console.log("Error");
        return;
    }
    let data = await response.json();
    displayRecipe(data);
}

function editRecipe() {
    let recipeName = document.querySelector("#recipe-name");
    let recipeURL = document.querySelector("#recipe-link");
    let instructions = document.querySelector("#instructions").getElementsByTagName("li");
    let ingredients = document.querySelector("#ingredientsList").getElementsByTagName("li");
    let description = document.querySelector("#recipe-content").getElementsByTagName("div");

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
                    console.log(data.userRecipes[i].documentID + " " + Recipe.documentID);
                    recipeEdit.style.display = "inline";
                }
            }
        }
    }

    let name = document.querySelector("#recipe-name");
    let recipeContent = document.querySelector("#recipe-content");
    recipeContent.innerHTML = "";
    name.innerHTML = Recipe.name;

    if(Recipe.URL === null || Recipe.URL === "") {
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

    let description = document.createElement("div");
    description.setAttribute("id", "description")
    description.innerHTML = "Beskrivelse: " + Recipe.description;
    recipeContent.appendChild(description);

    let time = document.createElement("div");
    time.setAttribute("id", "time")
    time.innerHTML = "Tid: " + Recipe.time + " minutter";
    recipeContent.appendChild(time);

    let difficulty = document.createElement("div");
    difficulty.setAttribute("id", "difficulty")
    difficulty.innerHTML = "Vanskelighetsgrad: " + Recipe.difficulty;
    recipeContent.appendChild(difficulty);

    if(Recipe.image !== null && Recipe.image !== "") {
        checkImageExists("../" + USRIMGDIR + Recipe.image + ".jpeg", function (exists) {
            if (!exists) {
                return;
            }
            let image = document.createElement("img");
            image.src = "../../" + USRIMGDIR + Recipe.image+".jpg";
            recipeContent.appendChild(image);
        });
    }
}