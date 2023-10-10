let dinnerPopup = document.querySelector("#dinner-popup");
let newDinnerBtns = document.querySelectorAll(".dinner-btn");
let closeDinnerPopup = document.querySelector("#close-dinner-popup");
let currentDay;
let allDays = ["mandag","tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"];
let Recipes = [];
let calendar = [[]];

getRecipes(Recipes);
retrieveGroups();
let groups = JSON.parse(sessionStorage.getItem("groups"));
displayGroups(groups);

newDinnerBtns.forEach (function (btn)
{
    btn.addEventListener("click", function (event){
        if(!checkAuthToken()){
            alert("Du må logge inn for å legge til i kalenderen");
            return;
        }
        let day = event.target.parentNode.id;
        console.log(day);
        currentDay = day;
        dinnerPopup.style.display = "block";
    });
});

closeDinnerPopup.addEventListener("click", function (event){
    dinnerPopup.style.display = "none";
});

function addDinnerToCalendar() {
    let dinnerName = document.querySelector("#dinner-name").value;

    if(event.key === "Enter") {

        let label = document.createElement("label");
        label.innerHTML = '<br>'+ dinnerName;
        label.setAttribute("id", currentDay + " textbox");
        let div = document.getElementById(currentDay);
        div.appendChild(label);
        event.preventDefault();
        dinnerPopup.style.display = "none";
        document.querySelector("#dinner-name").value = "";
    } else {
        autocomplete(currentDay, dinnerName);
    }
    for (let i = 0; i < groups.length; i++){
        for (let j = 0; j<allDays.length; j++) {
            if (allDays[j] === currentDay) {
                calendar[i][j] = dinnerName;
            }
        }
    }
    console.log(calendar);
}


function autocomplete(day, text){
    const recipeInput = document.querySelector("#dinner-name");
    const recipeList = document.querySelector("#search-results");
    let suggestions = [];

    if (text.length > 0) {
        //TODO: Legg til forslag øverst i listen (2 forslag)
        //suggestions = GETFORSLAG()

        if(Recipes.length > 1){
            suggestions = Recipes[0];
            suggestions += Recipes[1];
        }
        //Finner oppskrifter som matcher søket substring
        suggestions += Recipes.filter((data) => {
            return data.name.toLowerCase().includes(text.toLowerCase());
        });
        //Lager listeelementer av forslagene
        suggestions = suggestions.map((data) => {
            return data = '<li>' + data.name + '</li>';
        });
        //Highlight box med funky farge ellernosånt
        recipeInput.classList.add("active");

        //Viser forslagene
        showSuggestions(suggestions, day);

        //Legger til eventlistener på alle forslagene
        let allList = recipeList.querySelectorAll("li");
        for (let i = 0; i < allList.length; i++) {
            allList[i].addEventListener("click", () => {
                //Legger til valgt oppskrift i inputfeltet
                const selectedRecipe = allList[i].textContent;
                recipeInput.value = selectedRecipe;
                recipeInput.classList.remove("active");
                autocomplete(day, selectedRecipe);
            });
        }
    } else {
        recipeInput.classList.remove("active");
    }
}
function showSuggestions(list) {
    const recipeInput = document.getElementById("#dinner-name");
    const resultsList = document.getElementById("#search-results");
    let listData;
    let userValue;

    if (list.length < 2) {
        userValue = recipeInput.value;
        listData = '<li>' + userValue + '</li>';
    } else {
        listData = list.join('');
    }
    resultsList.innerHTML = listData;
}

function displayGroups(groups){
    let dropdown = document.querySelector("#group-dropdown");
    let option = document.createElement("option");
    option.textContent = "Velg gruppe";

    groups.forEach(group => {
        let option = document.createElement("option");
        option.value = group.name;
        option.textContent = group.name;
        dropdown.appendChild(option);
    });
}