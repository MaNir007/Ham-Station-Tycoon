<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: game.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ham Station Tycoon - Login</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="bg-grid"></div>
    <div class="terminal-container">
        <h1>[ HAM STATION TYCOON ]</h1>
        <p>> Welcome to the ultimate amateur radio simulation.</p>
        
        <?php if (isset($_GET['error'])): ?>
            <p class="error">> ERROR: <?= htmlspecialchars($_GET['error']) ?></p>
        <?php endif; ?>

        <form action="php/auth.php" method="POST" class="auth-form">
            <div class="input-group">
                <label for="username">> USERNAME:</label>
                <input type="text" id="username" name="username" required autocomplete="off">
            </div>
            
            <div class="input-group">
                <label for="password">> PASSWORD:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="button-group">
                <button type="submit" name="action" value="login" class="btn">LOGIN</button>
                <button type="submit" name="action" value="register" class="btn">REGISTER</button>
            </div>
        </form>
    </div>
</body>
</html>
