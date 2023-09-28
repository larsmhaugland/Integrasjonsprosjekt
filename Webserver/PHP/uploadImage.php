<?php
$target_dir = "/usr/local/apache2/images";
$target_file = $target_dir . basename($_FILES["recipe_image"]["name"]);



if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // The request is using the POST method
    if(move_uploaded_files($_FILES["recipe_image"]["tmp_name"], $target_file)){
        echo "The file ". basename( $_FILES["recipe_image"]["name"]). " has been uploaded.";
    }else{
        echo "Sorry, there was an error uploading your file.";
    }
};
?>