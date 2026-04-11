<?php
// On ré-importe la logique SMTP pour le test
function send_smtp_mail($to_array, $subject, $body, $host, $port, $user, $pass) {
    try {
        echo "Connexion à $host:$port...<br>";
        $socket = fsockopen("ssl://" . $host, $port, $errno, $errstr, 15);
        if (!$socket) throw new Exception("Connexion échouée: $errstr ($errno)");

        function get_resp($socket) {
            $resp = "";
            while ($str = fgets($socket, 515)) {
                $resp .= $str;
                if (substr($str, 3, 1) == " ") break;
            }
            return $resp;
        }

        echo "Authentification en cours...<br>";
        get_resp($socket);
        fwrite($socket, "EHLO " . $host . "\r\n"); get_resp($socket);
        fwrite($socket, "AUTH LOGIN\r\n"); get_resp($socket);
        fwrite($socket, base64_encode($user) . "\r\n"); get_resp($socket);
        fwrite($socket, base64_encode($pass) . "\r\n"); get_resp($socket);

        echo "Envoi du message...<br>";
        fwrite($socket, "MAIL FROM: <$user>\r\n"); get_resp($socket);
        foreach ($to_array as $to) {
            fwrite($socket, "RCPT TO: <$to>\r\n"); get_resp($socket);
        }

        fwrite($socket, "DATA\r\n"); get_resp($socket);

        $headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "From: Test Système ESC <$user>\r\n";
        $headers .= "To: " . implode(", ", $to_array) . "\r\n";
        $headers .= "Subject: ✅ TEST ENVOI MAIL REUSSI\r\n";

        fwrite($socket, $headers . "\r\n" . $body . "\r\n.\r\n"); get_resp($socket);
        fwrite($socket, "QUIT\r\n"); fclose($socket);

        return "✅ SUCCÈS : Mail envoyé à " . implode(", ", $to_array);
    } catch (Exception $e) {
        return "❌ ERREUR : " . $e->getMessage();
    }
}

// Paramètres
$smtp_server = "mail.esclab-academy.com";
$smtp_port = 465;
$smtp_user = "deploy-esc-internal@esclab-academy.com";
$smtp_pass = "yLe*v4B5Rs,G$7*,";
$bahloul = "l.bahloul@esclab-algerie.com";

echo "<h2>Test d'envoi Mail (ESC-Internal)</h2>";
echo send_smtp_mail([$bahloul], "Test de configuration", "Ceci est un mail de test automatique pour valider le serveur SMTP.", $smtp_server, $smtp_port, $smtp_user, $smtp_pass);
?>
