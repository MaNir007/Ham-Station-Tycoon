<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ham Station Tycoon - Terminal</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="terminal-container game-grid">
        <header class="game-header">
            <h1>[ STATION: <?= htmlspecialchars($_SESSION['username']) ?> ]</h1>
            <a href="php/auth.php?logout=1" class="btn logout-btn">DISCONNECT</a>
        </header>

        <main class="game-main">
            <div class="stats-panel">
                <h2>[ STATUS REPORT ]</h2>
                <p>> CREDITS: <span id="credits-disp">0</span> CR</p>
                <p>> EXPERIENCE: <span id="xp-disp">0</span> XP</p>
                <p>> LICENSE: <span id="license-disp">Novice</span></p>
                <p>> MULTIPLIER: <span id="multiplier-disp">1.0</span>x</p>
            </div>

            <div class="action-panel">
                <h2>[ OPERATIONS ]</h2>
                <div class="log-window" id="log-window">
                    > System initialized. Ready to scan...<br>
                </div>
                <button id="scan-btn" class="btn scan-btn">SCAN FREQUENCIES</button>
            </div>

            <div class="shop-panel">
                <h2>[ EQUIPMENT SHOP ]</h2>
                <div id="shop-items" class="shop-items-container">
                    <!-- Shop items loaded via JS -->
                </div>
            </div>
        </main>
    </div>

    <script src="js/script.js"></script>
</body>
</html>
