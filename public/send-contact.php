<?php
// Swap this when the client's real mailbox exists in cPanel.
const NOTIFICATION_TO = 'joana@ondastudio.co';

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

$subject = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader('New contact form submission from ' . $firstName . ' ' . $lastName, 'UTF-8', 'B')
    : 'New contact form submission from ' . $firstName . ' ' . $lastName;

$headers = 'From: ' . $firstName . ' ' . $lastName . ' <' . $email . ">\r\n" .
    'Reply-To: ' . $email . "\r\n" .
    "Content-Type: text/plain; charset=UTF-8\r\n";

mail(NOTIFICATION_TO, $subject, $body, $headers);

redirect_to($successPath);
