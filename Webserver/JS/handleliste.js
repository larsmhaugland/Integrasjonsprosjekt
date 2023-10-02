retrieveShoppingList();
//retrieveDinnerList();

//Retrieve shopping list from the database/storage session and display it
function retrieveShoppingList() {
   //if(!checkAuthToken()) return;

    //TODO: Switch depending on if they want to see the list associated with a group or a user
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