<?php
require __DIR__ . '/resend-config.php';

const FROM_ADDRESS = 'ummundu <no-reply@ummundu.com>';

// TODO: swap to 'contact@ummundu.com' once testing via Resend is confirmed working.
const NOTIFICATION_TO = 'joana@ondastudio.co';

const PATH_CONTACT_EN = '/contact';
const PATH_CONTACT_PT = '/pt/contacto';
const PATH_SUCCESS_EN = '/contact/success';
const PATH_SUCCESS_PT = '/pt/contacto/obrigado';

const AUTO_REPLY_COPY = [
    'en' => [
        'subject' => "We've received your request, {first_name}!",
        'body' => "Hi {first_name},\n\n"
            . "Thank you for reaching out to ummundu! We've received your trip request and a member of our team will get back to you shortly.\n\n"
            . "In the meantime, feel free to reply to this email if there's anything else you'd like to share.\n\n"
            . "Talk soon,\nThe ummundu Team",
    ],
    'pt' => [
        'subject' => 'Recebemos o teu pedido, {first_name}!',
        'body' => "Olá {first_name},\n\n"
            . "Obrigado por contactares a ummundu! Recebemos o teu pedido de viagem e a nossa equipa entrará em contacto brevemente.\n\n"
            . "Entretanto, sente-te à vontade para responder a este email caso queiras partilhar mais algum detalhe.\n\n"
            . "Até já,\nEquipa ummundu",
    ],
];

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

// Sends via the Resend HTTP API. Logs and returns false on failure instead of throwing,
// since a mail failure shouldn't block the visitor's redirect to the success page.
function send_resend_email($to, $subject, $text, $replyTo = null) {
    $payload = [
        'from' => FROM_ADDRESS,
        'to' => [$to],
        'subject' => $subject,
        'text' => $text,
    ];
    if ($replyTo !== null) {
        $payload['reply_to'] = $replyTo;
    }

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . RESEND_API_KEY,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError !== '' || $statusCode < 200 || $statusCode >= 300) {
        error_log('send-contact.php Resend send failure (to: ' . $to . '): ' . ($curlError !== '' ? $curlError : $response));
        return false;
    }
    return true;
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

send_resend_email(
    NOTIFICATION_TO,
    'New contact form submission from ' . $firstName . ' ' . $lastName,
    $body,
    $email
);

$autoReplySubject = str_replace('{first_name}', $firstName, AUTO_REPLY_COPY[$lang]['subject']);
$autoReplyBody = str_replace('{first_name}', $firstName, AUTO_REPLY_COPY[$lang]['body']);

send_resend_email($email, $autoReplySubject, $autoReplyBody, NOTIFICATION_TO);

redirect_to($successPath);
