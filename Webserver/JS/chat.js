document.addEventListener("DOMContentLoaded", function () {

    const createChatCloseButton = document.querySelector("#close-chat-popup");
    const createChatOpenButton = document.querySelector("#create-chat-button");
    const createChatPopup = document.querySelector("#chat-popup");
    const modal = document.querySelector("#search-member-modal");
    const openModalButton = document.querySelector("#add-member-button");
    const closeModalButton = modal.querySelector(".close-modal");
    const sendMessageButton = document.querySelector("#send-message-button");
    const memberSuggestionsList = modal.querySelector(".member-suggestions");
    const searchInput = document.querySelector("#search-input");
    const memberList = document.querySelector("#member-list");

    createChatOpenButton.addEventListener("click", function () {
        createChatPopup.style.display = "block";
    });

    createChatCloseButton.addEventListener("click", function () {
        createChatPopup.style.display = "none";
    });

    // Close the modal when the close button is clicked
    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    openModalButton.addEventListener("click", function () {
        modal.style.display = "block";
    });

    // Handle search input changes
    searchInput.addEventListener("input", function () {
        const query = searchInput.value.trim();
        console.log("Query is: " + query);
        if (query.length === 0) {
            return;
        }
        const url = `${API_IP}/user/search?partialUsername=${query}`;
        // Send a GET request to the firestore database via GO
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Update the member suggestions list with the results
                updateMemberSuggestions(data);
            })
            .catch(error => {
                console.error("Error fetching search results from database:", error);
            });
    });


    /**
     * Updates the suggestions for members to add after the user have entered in partial or full
     * username of the person they wish to add to their group
     * @param {*} results - The usernames of the users that corresponded to the search
     */
    function updateMemberSuggestions(results) {

        // Clear existing suggestions
        while (memberSuggestionsList.firstChild) {
            memberSuggestionsList.removeChild(memberSuggestionsList.firstChild);
        }

        // If there were no matching members dsiplay a message to the user
        if (results.length === 0) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.textContent = "No matching results found.";
            memberSuggestionsList.appendChild(noResultsMessage);
            return;
        }
        
        // Populate the suggestions list with results
        results.forEach(function (username) {
            const listItem = document.createElement("li");

            // Create the image element
            const image = document.createElement("img");
            image.src = "../Images/person-icon-transparent.png";
            image.alt = username;

            // Create the span element for the username
            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = username;

            // Create the button for adding the member
            const addButton = document.createElement("button");
            addButton.className = "add-member-btn2";

            const addImage = document.createElement("img");
            addImage.src = "../Images/add-icon.png";
            addImage.alt = "Add member";

            addButton.appendChild(addImage);

            // Add an event listener to handle adding a member to the group when clicking the icon
            addButton.addEventListener("click", function () {
                const username = addButton.parentElement.querySelector("span").textContent;
                addMemberToList(username);
                modal.style.display = "none";
            });

            // Append the elements to the list item
            listItem.appendChild(image);
            listItem.appendChild(usernameSpan);
            listItem.appendChild(addButton);

            memberSuggestionsList.appendChild(listItem);
        });
    }

    function addMemberToList(username) {
        // Get the list of members
        const memberListItem = document.createElement("li");
        const memberName = document.createElement("span");
        memberName.textContent = username;
        
        const removeButton = document.createElement("button");
        removeButton.className = "remove-member-button";
        removeButton.addEventListener("click", function () {
            removeMemberFromList(username);
        });

        memberListItem.appendChild(memberName);
        memberListItem.appendChild(removeButton);
        memberList.appendChild(memberListItem);
    }

    function removeMemberFromList(username){
        var memberListItem;
        const listItems = document.querySelectorAll("#member-list li");
        for (const listItem of listItems) {
            console.log(listItem)
            const span = listItem.querySelector("span");
            if (!span){console.log("span is null");}
            if (span.textContent === username) {
                // Found the list item with the matching username
                memberListItem = listItem;
            }
        }
        memberList.removeChild(memberListItem);
    }

});