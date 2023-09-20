<?php
header("Content-Type: application/javascript");

// Read the environment variable from Apache (assuming it's set there)
$apiUrl = getenv("API_URL");

// Generate JavaScript code with the injected variable
echo "const config = { apiUrl: '$apiUrl' };\n";
?>