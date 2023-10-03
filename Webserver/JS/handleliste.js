retrieveGroups();
retrieveShoppingList();
//retrieveDinnerList();

function retrieveGroups(){

    //if (!checkAuthToken()) return;
    let userName = sessionStorage.getItem("username");
    let groups = JSON.parse(sessionStorage.getItem("groups"));

    if(groups && groups.length > 0){
        displayGroups(groups);
    }  else {
    let credentials = {"username": userName};
    fetch(API_IP + "/user/groups", {
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
        displayGroups(data);})
    .catch(error => {
        console.log("Error retrieving groups: " + error);
    });
}};

//Add groups + user to the dropdown menu
function displayGroups(groups){
    let dropdown = document.querySelector("#group-dropdown");
    let option = document.createElement("option");
    option.textContent = "Velg gruppe";

    groups.array.forEach(group => {
        let option = document.createElement("option");
        option.value = group.name;
        option.textContent = group.name;
        dropdown.appendChild(option);
    });

    option.document.createElement("option");
    option.value = userName;
    option.textContent = userName;
    dropdown.appendChild(option);
}

//Retrieve shopping list from the database/storage session and display it
function retrieveShoppingList() {
   //if(!checkAuthToken()) return;
    let option = document.querySelector("#group-dropdown").value;

    if(option === "Velg gruppe"){
        return;

    }else if(option === sessionStorage.getItem("username")){
        //TODO: API fetch 
        fetch(API_IP + "/shopping", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.status === 200){
                console.log("Shopping list retrieved");
                return response.json();
            } else {
                console.log("Error retrieving shopping list");
                throw new Error("Failed to retrieve shopping list");
            }
        }).then(data=>{
            sessionStorage.setItem("shoppinglist", JSON.stringify(data));
            displayShoppingList(data);})
    }
    else{
        //TODO: API fetch for specific group not just group in general
        fetch(API_IP + "/group/shopping", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => {
            if (response.status === 200){
                console.log("Shopping list retrieved");
                return response.json();
            } else {
                console.log("Error retrieving shopping list");
                throw new Error("Failed to retrieve shopping list");
            }
        }).then(data=>{
            sessionStorage.setItem("shoppinglist", JSON.stringify(data));
            displayShoppingList(data);});
    }


    
    
    //TODO: find a better way to double check which group/user the storage session is for
    let shoppinglist = JSON.parse(sessionStorage.getItem("shoppinglist"));

    if(shoppinglist && shoppinglist.length > 0){
        displayShoppingList(shoppinglist);
    }else{
        //TODO: API fetch
    }
}

function displayShoppingList(shoppinglist){
    let display = document.querySelector("#shopping-list");
    shoppinglist.forEach(item => {
        let li = document.createElement("li");
        li.setAttribute("id", "list-item");
        
        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", "checkbox");
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(item));
        display.appendChild(li);
    });
}

function retrieveDinnerList(){
    //Retrieve dinner list from the database/storage session and display it
   // if(!checkAuthToken()) return;
    
    let dinner = JSON.parse(sessionStorage.getItem("dinner"));  //TODO: check proper variable name

    if(dinner && dinner.length > 0){
        displayDinner(dinner);
    }else {
        //TODO: API fetch
    }
}

function displayDinner(dinner){
    let display = document.querySelector("#middag-uke");
    dinner.forEach(dinner => {
        let block = document.createElement("div");
        block.setAttribute("id","middag-blokk");
        block.textContent = dinner.name;
        display.appendChild(block);
    });
}

//Call addNewItemToList() when the user clicks enter in the input field
let submit = document.querySelector("#newitemtxt");
submit.addEventListener("keydown", (event)=> {
    if (event.
        key == "Enter") {
        addNewItemToList();
        event.preventDefault(); 
        submit.value = "";
    }
});

function addNewItemToList(){
    let newItem = document.querySelector("#newitemtxt").value;

    if(newItem === ""){
        return;
    }

    let list = document.querySelector("#shopping-list");
    let li = document.createElement("li");
    li.setAttribute("id", "list-item");
    //create a checkbox for the list item
    let checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("id", "checkbox");
    li.appendChild(checkbox);
    li.appendChild(document.createTextNode(newItem));
    list.appendChild(li);
    //Add to storage session
    let shoppinglist = JSON.parse(sessionStorage.getItem("shoppinglist")) || [];
    shoppinglist.push(newItem);
    sessionStorage.setItem("shoppinglist", JSON.stringify(shoppinglist));
}

let list = document.querySelector("#shopping-list");
list.addEventListener("click", (event) => {
    if(event.target.id == "checkbox"){
        removeItemFromList();
    }
});

//Remove item from list if checkbox is checked
function removeItemFromList(){
    let list = document.querySelector("#shopping-list");
    let items = list.querySelectorAll("#list-item");
    let shoppinglist = JSON.parse(sessionStorage.getItem("shoppinglist")) || [];
    items.forEach(item => {
        let checkbox = item.querySelector("#checkbox");
        if(checkbox.checked){
            list.removeChild(item);
            let text = item.textContent;
            shoppinglist = shoppinglist.filter(item => item !== text);
        }
    });
    sessionStorage.setItem("shoppinglist", JSON.stringify(shoppinglist));
}