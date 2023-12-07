window.addEventListener("DOMContentLoaded", () => {
    // Delete user data from sessionStorage
    sessionStorage.removeItem("Chatroom-Title");
    sessionStorage.removeItem("Chatroom-FirstName");
    sessionStorage.removeItem("Chatroom-LastName");
    // Get the input field
    const titleInput = document.getElementById("Title");
    const firstNameInput = document.getElementById("FirstName");
    const lastNameInput = document.getElementById("LastName");

    // Execute a function when the user presses a key on the keyboard
    titleInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            firstNameInput.focus();
        }
    });
    firstNameInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            lastNameInput.focus();
        }
    });
    lastNameInput.addEventListener("keypress", function (event) {
        if (!event.repeat) {
            if (event.key === "Enter") {
                event.preventDefault();
                document.getElementById("SignUp").click();
            }
        }
    });

    // Capture SignUp event
    document.getElementById("SignUp").addEventListener("click", () => {
        signUp();
    });

    // Handle SignUp event
    function signUp() {
        // Get elements
        const errorMessageSlot = document.getElementById("errorMessageSlot");
        let errorMessage = document.getElementById("ErrorMessage");

        // If error messages exists, delete it
        while (errorMessage != null) {
            errorMessage.parentElement.removeChild(errorMessage);
            errorMessage = document.getElementById("ErrorMessage");
        }

        // If names are null, return error
        if (firstNameInput != null && firstNameInput.value == "" || lastNameInput != null && lastNameInput.value == "") {
            let newErrorMessage = document.createElement("div");
            newErrorMessage.id = "ErrorMessage";
            // newErrorMessage.className = "field error";
            newErrorMessage.className = "alert alert-danger";
            newErrorMessage.role = "alert";
            newErrorMessage.textContent = "Enter name";
            errorMessageSlot.appendChild(newErrorMessage);
        }
        // Go to Chat page
        else {
            sessionStorage.setItem("Chatroom-Title", titleInput.value);
            sessionStorage.setItem("Chatroom-FirstName", firstNameInput.value);
            sessionStorage.setItem("Chatroom-LastName", lastNameInput.value);
            window.location.replace("Chat.html");
        }
    }
});