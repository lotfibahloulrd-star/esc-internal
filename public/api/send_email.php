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

$to = $data['to']; // Array of emails
$subject = $data['subject'];
$message = $data['body'];

// CONFIGURATION SMTP
$smtp_server = "mail.esclab-academy.com";
$smtp_port = 465; // Port SSL standard
$smtp_user = "deploy-esc-internal@esclab-academy.com";
$smtp_pass = "yLe*v4B5Rs,G$7*,";

/**
 * Fonction simplifiée pour envoyer via SMTP brut (Sockets)
 * Pour éviter toute dépendance externe
 */
function send_smtp_mail($to_array, $subject, $body, $host, $port, $user, $pass) {
    try {
        $socket = fsockopen("ssl://" . $host, $port, $errno, $errstr, 15);
        if (!$socket) throw new Exception("Connexion échouée: $errstr");

        function get_resp($socket) {
            $resp = "";
            while ($str = fgets($socket, 515)) {
                $resp .= $str;
                if (substr($str, 3, 1) == " ") break;
            }
            return $resp;
        }

        get_resp($socket); // 220
        fwrite($socket, "EHLO " . $host . "\r\n"); get_resp($socket);
        fwrite($socket, "AUTH LOGIN\r\n"); get_resp($socket);
        fwrite($socket, base64_encode($user) . "\r\n"); get_resp($socket);
        fwrite($socket, base64_encode($pass) . "\r\n"); get_resp($socket);

        fwrite($socket, "MAIL FROM: <$user>\r\n"); get_resp($socket);
        
        foreach ($to_array as $to) {
            fwrite($socket, "RCPT TO: <$to>\r\n"); get_resp($socket);
        }

        fwrite($socket, "DATA\r\n"); get_resp($socket);

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "From: ESC-Internal <$user>\r\n";
        $headers .= "To: " . implode(", ", $to_array) . "\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "Date: " . date("r") . "\r\n";
        $headers .= "X-Mailer: ESCLAB-Mailer/1.0\r\n";

        fwrite($socket, $headers . "\r\n" . $body . "\r\n.\r\n"); get_resp($socket);
        fwrite($socket, "QUIT\r\n"); fclose($socket);

        return ["status" => "success", "message" => "Email envoyé via SMTP"];
    } catch (Exception $e) {
        return ["status" => "error", "message" => $e->getMessage()];
    }
}

// Lancement de l'envoi
$result = send_smtp_mail($to, $subject, $message, $smtp_server, $smtp_port, $smtp_user, $smtp_pass);

echo json_encode($result);
?>
