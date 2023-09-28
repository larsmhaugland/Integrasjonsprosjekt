// JavaScript for interaction with the poppup menu for adding members to the group
// Wrapping in document.addEventListener("DOMContentLoaded") ensures that the code will run after
// the HTML document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.querySelector("#search-member-modal");
    const openAddMemberButton = document.querySelector("#add-member-btn");
    const closeModalButton = modal.querySelector(".close");

    // Open the modal when the button is clicked
    openAddMemberButton.addEventListener('click', function () {
        modal.style.display = "block";
    });

    // Close the modal when the close button is clicked
    closeModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // TODO: Implement search functionality and results display
});