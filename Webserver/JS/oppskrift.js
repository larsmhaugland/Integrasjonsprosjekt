

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
    console.log(data);
}

function displayRecipe(Recipe) {
    let name = document.querySelector("#recipe-name");
    let recipeContent = document.querySelector("#recipe-content");
    recipeContent.innerHTML = "";
    name.innerHTML = Recipe.name;

    if(Recipe.URL === null) {
        let ingredients = document.createElement("div");
        //Go through map of ingredients:
        for (let [key, value] of Object.entries(Recipe.ingredients)) {
            let ingredient = document.createElement("div");
            ingredient.innerHTML = key + ": " + value;
            ingredients.appendChild(ingredient);
        }
        recipeContent.appendChild(ingredients);

        recipeContent.appendChild(document.createTextNode("Instruksjoner: "));
        let instructions = document.createElement("ol");
        for (let i = 0; i < Recipe.instructions.length; i++) {
            let instruction = document.createElement("li");
            instruction.innerHTML = Recipe.instructions[i];
            instructions.appendChild(instruction);
        }
    } else {
        let link = document.createElement("a");
        link.href = Recipe.URL;
        link.setAttribute("target", "_blank");
        link.innerHTML = "Link til oppskrift";
        recipeContent.appendChild(link);
    }

    let description = document.createElement("div");
    description.innerHTML = "Beskrivelse: " + Recipe.description;
    recipeContent.appendChild(description);

    let time = document.createElement("div");
    time.innerHTML = "Tid: " + Recipe.time + " minutter";
    recipeContent.appendChild(time);

    let difficulty = document.createElement("div");
    difficulty.innerHTML = "Vanskelighetsgrad: " + Recipe.difficulty;
    recipeContent.appendChild(difficulty);

    if(Recipe.image !== null) {
        let image = document.createElement("img");
        image.src = IMAGEDIR + Recipe.image+".jpg";
        recipeContent.appendChild(image);
    }
}