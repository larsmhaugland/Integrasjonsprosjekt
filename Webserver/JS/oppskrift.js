let MAXRESULTS = 9;

const Recipe = {
    ID: "",
    Name: "",
    Time: 0,
    Picture: "",
    Description: "",
    URL: "",
    Ingredients: {},
    Instructions: [],
    Categories: [],
    Portions: 0,
    Group: ""
};

let Recipes = [];

function getRecipes() {
    let username = sessionStorage.getItem("username");
    if(!checkAuthToken()) return;

    fetch(API_IP + "/user/recipes?groups=true", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(username)
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

function displayResults(){
    //Filtrer
    let results = [];

}

function pushToResults(recipe, groupID) {

}