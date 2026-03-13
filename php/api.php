<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'get_data') {
        // Fetch user basic data
        $stmt = $pdo->prepare("SELECT credits, xp, license_class FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();

        // Check if license upgrade is applicable based on XP
        if ($user['xp'] >= 500 && $user['license_class'] === 'Novice') {
            $user['license_class'] = 'Class P';
            $update = $pdo->prepare("UPDATE users SET license_class = 'Class P' WHERE id = ?");
            $update->execute([$user_id]);
        } elseif ($user['xp'] >= 2000 && $user['license_class'] === 'Class P') {
            $user['license_class'] = 'Class A';
            $update = $pdo->prepare("UPDATE users SET license_class = 'Class A' WHERE id = ?");
            $update->execute([$user_id]);
        }

        // Fetch multiplier based on inventory
        $stmt = $pdo->prepare("
            SELECT SUM(s.bonus_multiplier) as total_bonus 
            FROM inventory i 
            JOIN shop_items s ON i.item_id = s.id 
            WHERE i.user_id = ?
        ");
        $stmt->execute([$user_id]);
        $multiplier_row = $stmt->fetch();
        $multiplier = 1.0 + (float)($multiplier_row['total_bonus'] ?? 0);

        // Fetch shop items
        $stmt = $pdo->query("SELECT * FROM shop_items");
        $shop_items = $stmt->fetchAll();

        // Fetch user inventory
        $stmt = $pdo->prepare("SELECT item_id FROM inventory WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $inventory = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

        echo json_encode([
            'status' => 'success',
            'user' => [
                'credits' => $user['credits'],
                'xp' => $user['xp'],
                'license' => $user['license_class'],
                'multiplier' => $multiplier
            ],
            'shop' => $shop_items,
            'inventory' => $inventory
        ]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'save_progress') {
        $credits_add = (int)($input['credits'] ?? 0);
        $xp_add = (int)($input['xp'] ?? 0);

        if ($credits_add > 0 || $xp_add > 0) {
            $stmt = $pdo->prepare("UPDATE users SET credits = credits + ?, xp = xp + ? WHERE id = ?");
            $stmt->execute([$credits_add, $xp_add, $user_id]);
        }
        echo json_encode(['status' => 'success']);
        exit;
    }

    if ($action === 'buy_item') {
        $item_id = (int)($input['item_id'] ?? 0);
        
        // Get item details
        $stmt = $pdo->prepare("SELECT price, required_class FROM shop_items WHERE id = ?");
        $stmt->execute([$item_id]);
        $item = $stmt->fetch();

        if (!$item) {
            echo json_encode(['status' => 'error', 'message' => 'Item not found']);
            exit;
        }

        // Get user details
        $stmt = $pdo->prepare("SELECT credits, license_class FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();

        // Check if already owns
        $stmt = $pdo->prepare("SELECT id FROM inventory WHERE user_id = ? AND item_id = ?");
        $stmt->execute([$user_id, $item_id]);
        if ($stmt->fetch()) {
            echo json_encode(['status' => 'error', 'message' => 'Already owned']);
            exit;
        }

        // Check requirements and credits
        $class_hierarchy = ['Novice' => 1, 'Class P' => 2, 'Class A' => 3];
        $user_level = $class_hierarchy[$user['license_class']] ?? 1;
        $req_level = $class_hierarchy[$item['required_class']] ?? 1;

        if ($user_level < $req_level) {
            echo json_encode(['status' => 'error', 'message' => 'License level too low']);
            exit;
        }

        if ($user['credits'] < $item['price']) {
            echo json_encode(['status' => 'error', 'message' => 'Not enough credits']);
            exit;
        }

        // Perform purchase transaction
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE users SET credits = credits - ? WHERE id = ?");
            $stmt->execute([$item['price'], $user_id]);

            $stmt = $pdo->prepare("INSERT INTO inventory (user_id, item_id) VALUES (?, ?)");
            $stmt->execute([$user_id, $item_id]);

            $pdo->commit();
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => 'Transaction failed']);
        }
        exit;
    }
}
?>
