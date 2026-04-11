<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Empêcher les accès directs via GET
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

// Récupération des données JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['to']) || !isset($data['subject']) || !isset($data['body'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

$to = implode(", ", $data['to']);
$subject = $data['subject'];
$message = $data['body'];
$from = "deploy-esc-internal@esclab-academy.com";

$headers = [
    "From: $from",
    "Reply-To: $from",
    "X-Mailer: PHP/" . phpversion(),
    "Content-Type: text/plain; charset=utf-8"
];

// Envoi du mail
if (mail($to, $subject, $message, implode("\r\n", $headers))) {
    echo json_encode(["status" => "success", "message" => "Email sent"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Email failed to send"]);
}
?>
