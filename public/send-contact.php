<?php
require __DIR__ . '/smtp-config.php';
require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

const NOTIFICATION_TO = 'contact@ummundu.com';

const PATH_CONTACT_EN = '/contact';
const PATH_CONTACT_PT = '/pt/contacto';
const PATH_SUCCESS_EN = '/contact/success';
const PATH_SUCCESS_PT = '/pt/contacto/obrigado';

function redirect_to($path) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    header('Location: ' . $scheme . '://' . $host . $path, true, 302);
    exit;
}

function field($name) {
    return isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
}

// Strips CR/LF so submitted values can't inject extra mail headers.
function clean_line($value) {
    return str_replace(["\r", "\n"], ' ', $value);
}

$lang = field('lang') === 'pt' ? 'pt' : 'en';
$contactPath = $lang === 'pt' ? PATH_CONTACT_PT : PATH_CONTACT_EN;
$successPath = $lang === 'pt' ? PATH_SUCCESS_PT : PATH_SUCCESS_EN;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_to($contactPath);
}

// Honeypot: hidden from humans via CSS, bots that fill every field trip it.
if (field('website') !== '') {
    redirect_to($successPath);
}

$required = ['destination', 'duration', 'travellers', 'investment', 'first_name', 'last_name', 'email'];
foreach ($required as $name) {
    if (field($name) === '') {
        redirect_to($contactPath);
    }
}

$email = filter_var(field('email'), FILTER_VALIDATE_EMAIL);
if ($email === false) {
    redirect_to($contactPath);
}

$firstName = clean_line(field('first_name'));
$lastName = clean_line(field('last_name'));

$fields = [
    'Departure month' => field('departure_month'),
    'Departure year' => field('departure_year'),
    'Destination' => field('destination'),
    'Duration' => field('duration'),
    'Travellers' => field('travellers'),
    'Investment' => field('investment'),
    'First name' => $firstName,
    'Last name' => $lastName,
    'Email' => $email,
    'Phone' => field('phone'),
    'Message' => field('message'),
];

$body = '';
foreach ($fields as $label => $value) {
    $body .= $label . ': ' . clean_line($value) . "\n";
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = SMTP_PORT;
    $mail->CharSet = PHPMailer::CHARSET_UTF8;

    // From must be the authenticated mailbox — most SMTP servers reject or
    // flag a From address that doesn't match the logged-in account.
    $mail->setFrom(SMTP_USERNAME, $firstName . ' ' . $lastName);
    $mail->addReplyTo($email, $firstName . ' ' . $lastName);
    $mail->addAddress(NOTIFICATION_TO);

    $mail->Subject = 'New contact form submission from ' . $firstName . ' ' . $lastName;
    $mail->Body = $body;

    $mail->send();
} catch (PHPMailerException $e) {
    // Fall through to the success redirect either way — a mail failure
    // shouldn't leave the visitor looking at a broken page. Logged so
    // failures are still visible server-side (check the host's PHP error log).
    error_log('send-contact.php mail failure: ' . $mail->ErrorInfo);
}

redirect_to($successPath);
