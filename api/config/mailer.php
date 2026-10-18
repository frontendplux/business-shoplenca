<?php
// ============================================================================
// /api/config/mailer.php
// Email helper using PHPMailer if installed
// ============================================================================

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$autoloadPath = __DIR__ . '/../../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

function sendMail(string $email, string $subject, string $html): bool {
    if (!class_exists(PHPMailer::class)) {
        return false;
    }

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = getenv('SMTP_HOST') ?: 'mail.oracleofchrist.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = getenv('SMTP_USER') ?: 'your-email@oracleofchrist.com';
        $mail->Password   = getenv('SMTP_PASS') ?: 'YOUR_EMAIL_PASSWORD';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = (int)(getenv('SMTP_PORT') ?: 465);
        $mail->Timeout    = 4;

        $mail->setFrom($mail->Username, getenv('SMTP_FROM_NAME') ?: 'Shoplenca Store');
        $mail->addAddress($email);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $html;
        $mail->AltBody = strip_tags($html);

        $mail->send();
        return true;
    } catch (\Throwable $e) {
        error_log('Email sending skipped/failed: ' . $e->getMessage());
        return false;
    }
}

