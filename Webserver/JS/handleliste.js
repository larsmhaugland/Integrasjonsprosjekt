retrieveShoppingList();
retrieveDinnerList();

function retrieveShoppingList() {
    //Retrieve shopping list from the database/storage session and display it
   if(!checkAuthToken()) return;

    //Switch depending on if they want to see the list associated with a group or a user


    let list = document.querySelector("#shopping-list");
    let li = document.createElement("li");
    li.setAttribute("id", "list-item");

}

function retrieveDinnerList(){
    //Retrieve dinner list from the database/storage session and display it
    if(!checkAuthToken()) return;
    
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
    li.textContent = newItem;
    list.appendChild(li);
    //Add to storage session

}