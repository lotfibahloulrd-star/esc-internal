<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Données JSON invalides"]);
    exit;
}

$to = implode(", ", $data['to']);
$subject = $data['subject'];
$message = $data['body'];
$from = "deploy-esc-internal@esclab-academy.com";

// En-têtes plus complets pour éviter les filtres SPAM
$headers = "From: ESC-Internal <$from>\r\n";
$headers .= "Reply-To: $from\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Priority: 1\r\n";
$headers .= "X-MSMail-Priority: High\r\n";

// Tentative d'envoi avec diagnostic
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    if (mail($to, $subject, $message, $headers, "-f$from")) {
        echo json_encode(["status" => "success", "message" => "Mail envoyé vers $to"]);
    } else {
        $last_error = error_get_last();
        echo json_encode([
            "status" => "error", 
            "message" => "Le serveur mail a refusé l'envoi.",
            "debug" => $last_error
        ]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
