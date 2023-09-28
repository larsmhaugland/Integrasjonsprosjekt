// JavaScript for interaction with the poppup menu for adding members to the group
// Wrapping in document.addEventListener("DOMContentLoaded") ensures that the code will run after
// the HTML document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.querySelector("#search-member-modal");
    const openAddMemberButton = document.querySelector("#add-member-btn");
    const closeModalButton = modal.querySelector(".close");
    const searchInput = modal.querySelector("#search-input");
    const memberSuggestionsList = modal.querySelector(".member-suggestions");

    // Open the modal when the button is clicked
    openAddMemberButton.addEventListener('click', function () {
        modal.style.display = "block";
    });

    // Close the modal when the close button is clicked
    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Handle search input changes
    searchInput.addEventListener("input", function () {
        const query = searchInput.value.trim();

        // Send a GET request to the firestore database via GO
        fetch(`/search?partialUsername=${query}`)
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
        addImage.src = "../images/add-icon.png";
        addImage.alt = "Add member";

        addButton.appendChild(addImage);

        // Add an event listener to handle adding a member to the group when clicking the icon
        addButton.addEventListener("click", function () {
            const username = addButton.parentElement.querySelector("span").textContent;
            const groupID = "Hunnsvegen 14B"; // TODO: Must be changed to the actual dynamic groupID
            addMemberToGroup(username, groupID);
        });

        // Append the elements to the list item
        listItem.appendChild(image);
        listItem.appendChild(usernameSpan);
        listItem.appendChild(addButton);

        memberSuggestionsList.appendChild(listItem);
    });
    }
    /**
     * Adds the correct user to the group by sending a POST request to the backend that
     * then communicates and correctly adds the user to the group in the database.
     * @param {*} username - username for the user to be added to the group
     * @param {*} groupID - ID of the group the user will be added to
     */
    function addMemberToGroup(username, groupID) {
        const url = "/group/members"   // TODO: Correct URL?

        // Request body with the information needed for the backend to correctly add member to group
        const requestBody = JSON.stringify({
            username: username,
            groupName: groupName,
        });
        // Send a POST request to the backend
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: requestBody,
        })
        .then((response) => {
            if (response.status === 200) {
                // Member added successfully
                alert("Member added to the group successfully");
            } else {
                alert("Error adding member to the group");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    }
});