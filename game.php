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
    <div class="bg-grid"></div>
    <div class="terminal-container game-grid">
        <header class="game-header">
            <h1>[ STATION: <?= htmlspecialchars($_SESSION['username']) ?> ]</h1>
            <a href="php/auth.php?logout=1" class="btn logout-btn">DISCONNECT</a>
        </header>

        <main class="game-main">
            <div class="stats-panel panel">
                <h2>[ STATUS REPORT ]</h2>
                <p>> CREDITS: <span id="credits-disp">0</span> CR</p>
                <p>> EXPERIENCE: <span id="xp-disp">0</span> XP</p>
                <p>> LICENSE: <span id="license-disp">Novice</span></p>
                <p>> MULTIPLIER: <span id="multiplier-disp">1.0</span>x</p>
            </div>

            <div class="action-panel panel" id="action-panel-dyn">
                <h2>[ OPERATIONS ]</h2>
                
                <div class="radio-interface">
                    <div class="top-row">
                        <!-- S-METER -->
                        <div class="s-meter-container">
                            <div class="s-meter-scale">
                                <span>1</span><span>3</span><span>5</span><span>7</span><span>9</span><span class="red">+20</span><span class="red">+40</span>
                            </div>
                            <div class="s-meter-needle" id="s-meter-needle"></div>
                            <div class="s-meter-label">S-UNITS</div>
                        </div>

                        <!-- FREQUENCY SCREEN -->
                        <div class="screen-wrapper">
                            <div class="led-meter">
                                <div class="led" id="led-1"></div>
                                <div class="led" id="led-2"></div>
                                <div class="led" id="led-3"></div>
                                <div class="led" id="led-4"></div>
                                <div class="led" id="led-5"></div>
                            </div>
                            <div class="freq-screen" id="freq-screen-container" title="Click to change band">
                                <div><span id="freq-display">144.200</span> <span class="mhz">MHz</span></div>
                                <div id="band-indicator">2m BAND</div>
                            </div>
                        </div>
                    </div>

                    <!-- MODULATION SELECTOR -->
                    <div class="mode-selector">
                        <button class="mode-btn active" data-mode="FM">FM</button>
                        <button class="mode-btn" data-mode="USB">USB</button>
                        <button class="mode-btn" data-mode="LSB">LSB</button>
                        <button class="mode-btn" data-mode="CW">CW</button>
                        <button class="mode-btn" data-mode="FT8">FT8</button>
                    </div>

                    <!-- KNOBS SECTION -->
                    <div class="controls-row">
                        <div class="small-knobs">
                            <div class="knob-unit">
                                <div class="knob small-knob" id="vol-knob">
                                    <div class="knob-marker"></div>
                                </div>
                                <span>VOL</span>
                            </div>
                            <div class="knob-unit">
                                <div class="knob small-knob" id="sql-knob">
                                    <div class="knob-marker"></div>
                                </div>
                                <span>SQL</span>
                            </div>
                        </div>

                        <div class="main-tuning">
                            <div class="knob" id="tune-knob">
                                <div class="knob-marker"></div>
                            </div>
                            <div class="label">TUNE</div>
                        </div>

                        <button id="scan-btn" class="btn transmit-btn">TX / CQ</button>
                    </div>
                </div>

                <div class="log-window" id="log-window">
                    > System initialized. Ready to operate...<br>
                </div>
            </div>

            <div class="shop-panel panel">
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
