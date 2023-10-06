function getRecipes(Recipes) {
    let username = sessionStorage.getItem("username");
    //if(!checkAuthToken()) return;
    fetch(API_IP + "/recipe/" + username + "?groups=true", {
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
}

function retrieveGroups(){

    //if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");
    let groups = JSON.parse(sessionStorage.getItem("groups"));

    if(groups && groups.length === 0){
        fetch(API_IP + `/user/groups?username=${userName}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.status === 200){
                console.log("Groups retrieved");
                return response.json();
            } else {
                console.log("Error retrieving groups");
                throw new Error("Failed to retrieve groups");
            }
        }).then(data=>{
            sessionStorage.setItem("groups", JSON.stringify(data));
        })
        .catch(error => {
            console.log("Error retrieving groups: " + error);
        });
    }
}



