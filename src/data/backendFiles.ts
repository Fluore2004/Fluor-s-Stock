/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const backendFiles = {
  schemaSql: `-- ==========================================================
-- SCHEMA DE LA BASE DE DONNÉES - FLODELIXA BUSINESS (v1.0)
-- Auteur: FLODELIXA Technologies • IGIRANEZA Fluoré
-- Protection contre les injections SQL via requêtes préparées
-- ==========================================================

CREATE DATABASE IF NOT EXISTS flodelixa_business CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flodelixa_business;

-- 1. Table des Utilisateurs (Gérant & Employé)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Gérant', 'Employé') NOT NULL DEFAULT 'Employé',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table des Catégories de produits
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. Table des Produits en Stock
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    purchase_price DECIMAL(12, 2) NOT NULL,
    selling_price DECIMAL(12, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    alert_quantity INT NOT NULL DEFAULT 5,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. Table des Clients (Débiteurs ou réguliers)
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Table des Ventes (Comptant ou Dette)
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_id INT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_status ENUM('Cash', 'Dette') NOT NULL DEFAULT 'Cash',
    payment_method ENUM('Espèces', 'Mobile Money', 'Virement') NOT NULL DEFAULT 'Espèces',
    payment_reference VARCHAR(100) NOT NULL DEFAULT 'N/A',
    payment_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Table des Détails de Vente (Articles vendus)
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Table des Dettes Clients
CREATE TABLE IF NOT EXISTS debts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    customer_id INT NOT NULL,
    amount_due DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insertion de données de démarrage par défaut (Mot de passe admin haché par défaut: 'Flodelixa2026@')
-- Hachage généré via password_hash('Flodelixa2026@', PASSWORD_DEFAULT)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2y$10$tZ26LgK3nK4QWw5NCOgEBuG9fG7I1YyW15jE0Y4z9YV6a/w2ZpG8G', 'Gérant')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO categories (name) VALUES 
('Quincaillerie & Matériaux'),
('Santé & Pharmacie'),
('Alimentation & Boutique')
ON DUPLICATE KEY UPDATE id=id;

-- 8. Table Clé/Valeur des Paramètres Système (Extensible)
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO system_settings (setting_key, setting_value) VALUES
('shop_name', 'DEFFLOX Boutique Bujumbura'),
('shop_address', 'Avenue de la Mission, Bujumbura, Burundi'),
('shop_phone', '+257 22 00 00 00'),
('shop_email', 'contact@defflox-bujumbura.bi'),
('shop_currency', 'BIF'),
('receipt_header', 'FACTURE OFFICIELLE • MERCI DE VOTRE CONFIANCE'),
('receipt_footer', 'Logiciel édité par FLODELIXA Technologies • Merci de votre visite !'),
('auto_print_receipt', '1'),
('critical_stock_threshold', '5'),
('allow_negative_stock', '0'),
('role_admin_discount', '1'),
('role_gerant_discount', '1'),
('role_caissier_discount', '0'),
('role_admin_view_margin', '1'),
('role_gerant_view_margin', '1'),
('role_caissier_view_margin', '0')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
`,

  dbConnectPhp: `<?php
/**
 * db_connect.php
 * Connexion sécurisée à MySQL via MySQLi Native
 * Conçu par FLODELIXA Technologies (Burundi)
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'flodelixa_business');

// Activation des exceptions pour MySQLi (meilleur traitement des erreurs)
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $conn->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    // Sécurité stricte : Ne jamais afficher les informations sensibles au client final
    error_log("Erreur de connexion DB: " . $e->getMessage());
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion au serveur de base de données."]);
    exit();
}
`,

  authPhp: `<?php
/**
 * auth.php
 * Module d'authentification sécurisée des utilisateurs
 * Utilise des requêtes préparées MySQLi et la gestion des sessions PHP 8+
 */

require_once 'db_connect.php';

session_start([
    'cookie_lifetime' => 86400,
    'cookie_secure' => false, // Passer à true sur HTTPS en production
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax'
]);

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "Veuillez remplir tous les champs."]);
        exit();
    }

    // Requête préparée pour récupérer l'utilisateur
    $stmt = $conn->prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        // Vérification sécurisée du hachage du mot de passe
        if (password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];

            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => $user['id'],
                    "username" => $user['username'],
                    "role" => $user['role']
                ]
            ]);
            exit();
        }
    }

    http_response_code(401);
    echo json_encode(["error" => "Identifiants incorrects."]);
    $stmt->close();
    exit();
}

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    echo json_encode(["success" => true, "message" => "Déconnexion réussie."]);
    exit();
}

if ($action === 'status') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "logged_in" => true,
            "user" => [
                "id" => $_SESSION['user_id'],
                "username" => $_SESSION['username'],
                "role" => $_SESSION['role']
            ]
        ]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
    exit();
}
`,

  stockPhp: `<?php
/**
 * stock.php
 * API de gestion des catégories et des produits
 * CRUD complet avec requêtes préparées MySQLi
 */

require_once 'db_connect.php';
session_start();

// Vérification de la session
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Accès non autorisé."]);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// --- GESTION DES CATEGORIES ---
if ($action === 'categories') {
    if ($method === 'GET') {
        $result = $conn->query("SELECT id, name FROM categories ORDER BY name ASC");
        $categories = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($categories);
        exit();
    }
    
    if ($method === 'POST' && $_SESSION['role'] === 'Gérant') {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["error" => "Nom de catégorie requis."]);
            exit();
        }
        
        $stmt = $conn->prepare("INSERT INTO categories (name) VALUES (?)");
        $stmt->bind_param("s", $name);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "id" => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Impossible d'ajouter la catégorie."]);
        }
        $stmt->close();
        exit();
    }
}

// --- GESTION DES PRODUITS ---
if ($action === 'products') {
    if ($method === 'GET') {
        // Sélection complète avec jointure de catégorie
        $sql = "SELECT p.*, c.name as category_name 
                FROM products p 
                JOIN categories c ON p.category_id = c.id 
                ORDER BY p.name ASC";
        $result = $conn->query($sql);
        $products = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($products);
        exit();
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $category_id = (int)($data['category_id'] ?? 0);
        $code = trim($data['code'] ?? '');
        $name = trim($data['name'] ?? '');
        $purchase_price = (float)($data['purchase_price'] ?? 0);
        $selling_price = (float)($data['selling_price'] ?? 0);
        $stock_quantity = (int)($data['stock_quantity'] ?? 0);
        $alert_quantity = (int)($data['alert_quantity'] ?? 5);

        if (empty($code) || empty($name) || $category_id <= 0 || $purchase_price <= 0 || $selling_price <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Veuillez remplir correctement tous les champs obligatoires."]);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO products (category_id, code, name, purchase_price, selling_price, stock_quantity, alert_quantity) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issddii", $category_id, $code, $name, $purchase_price, $selling_price, $stock_quantity, $alert_quantity);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "id" => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Erreur lors de l'enregistrement du produit (code déjà existant ?)."]);
        }
        $stmt->close();
        exit();
    }

    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = (int)($data['id'] ?? 0);
        $category_id = (int)($data['category_id'] ?? 0);
        $code = trim($data['code'] ?? '');
        $name = trim($data['name'] ?? '');
        $purchase_price = (float)($data['purchase_price'] ?? 0);
        $selling_price = (float)($data['selling_price'] ?? 0);
        $stock_quantity = (int)($data['stock_quantity'] ?? 0);
        $alert_quantity = (int)($data['alert_quantity'] ?? 5);

        if ($id <= 0 || empty($code) || empty($name) || $purchase_price <= 0 || $selling_price <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Données de modification invalides."]);
            exit();
        }

        $stmt = $conn->prepare("UPDATE products SET category_id = ?, code = ?, name = ?, purchase_price = ?, selling_price = ?, stock_quantity = ?, alert_quantity = ? WHERE id = ?");
        $stmt->bind_param("issddiii", $category_id, $code, $name, $purchase_price, $selling_price, $stock_quantity, $alert_quantity, $id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Erreur lors de la mise à jour."]);
        }
        $stmt->close();
        exit();
    }

    if ($method === 'DELETE') {
        if ($_SESSION['role'] !== 'Gérant') {
            http_response_code(403);
            echo json_encode(["error" => "Seul le Gérant peut supprimer des produits."]);
            exit();
        }
        
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "ID produit manquant."]);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Impossible de supprimer ce produit. Il est lié à des ventes passées."]);
        }
        $stmt->close();
        exit();
    }
}
`,

  posPhp: `<?php
/**
 * pos.php
 * Point de Vente (Caisse) & Enregistrement des Ventes (Cash / Dette)
 * Sécurisation absolue via transactions SQL (BEGIN TRANSACTION)
 */

require_once 'db_connect.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Accès non autorisé."]);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $customer_id = isset($data['customer_id']) ? (int)$data['customer_id'] : null;
    $payment_status = $data['payment_status'] ?? 'Cash'; // 'Cash' ou 'Dette'
    $payment_method = $data['payment_method'] ?? 'Espèces'; // 'Espèces', 'Mobile Money', 'Virement'
    $payment_reference = trim($data['payment_reference'] ?? 'N/A'); // Réf obligatoire / N° Transaction
    $items = $data['items'] ?? []; // [{product_id, quantity, unit_price}]
    $amount_paid_initial = (float)($data['amount_paid_initial'] ?? 0); // Pour les dettes à remboursement partiel de départ

    if (empty($items)) {
        http_response_code(400);
        echo json_encode(["error" => "Le panier est vide."]);
        exit();
    }

    if (empty($payment_reference)) {
        http_response_code(400);
        echo json_encode(["error" => "La référence de paiement / N° Transaction est obligatoire pour confirmer l'encaissement."]);
        exit();
    }

    if ($payment_status === 'Dette' && empty($customer_id)) {
        http_response_code(400);
        echo json_encode(["error" => "Un client doit être sélectionné pour une vente à crédit (Dette)."]);
        exit();
    }

    // ÉTAPE 1 : Débuter une transaction SQL pour garantir la cohérence des données
    $conn->begin_transaction();

    try {
        // ÉTAPE 2 : Calculer le montant total réel de la vente et vérifier les stocks
        $total_amount = 0.0;
        $processed_items = [];

        foreach ($items as $item) {
            $product_id = (int)$item['product_id'];
            $qty = (int)$item['quantity'];

            if ($qty <= 0) {
                throw new Exception("Quantité invalide pour le produit ID: $product_id");
            }

            // Récupérer les données fraîches du produit depuis MySQL
            $p_stmt = $conn->prepare("SELECT selling_price, stock_quantity, name FROM products WHERE id = ?");
            $p_stmt->bind_param("i", $product_id);
            $p_stmt->execute();
            $p_res = $p_stmt->get_result()->fetch_assoc();
            $p_stmt->close();

            if (!$p_res) {
                throw new Exception("Produit introuvable (ID: $product_id)");
            }

            if ($p_res['stock_quantity'] < $qty) {
                throw new Exception("Stock insuffisant pour: " . $p_res['name'] . " (Dispo: " . $p_res['stock_quantity'] . ")");
            }

            $price = (float)$p_res['selling_price'];
            $subtotal = $price * $qty;
            $total_amount += $subtotal;

            $processed_items[] = [
                'product_id' => $product_id,
                'qty' => $qty,
                'price' => $price,
                'subtotal' => $subtotal
            ];
        }

        // ÉTAPE 3 : Insérer l'enregistrement principal de la vente avec traçabilité complète
        $user_id = $_SESSION['user_id'];
        $payment_confirmed = 1;
        $sale_stmt = $conn->prepare("INSERT INTO sales (user_id, customer_id, total_amount, payment_status, payment_method, payment_reference, payment_confirmed) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $sale_stmt->bind_param("iidsssi", $user_id, $customer_id, $total_amount, $payment_status, $payment_method, $payment_reference, $payment_confirmed);
        $sale_stmt->execute();
        $sale_id = $sale_stmt->insert_id;
        $sale_stmt->close();

        // ÉTAPE 4 : Insérer les articles vendus et mettre à jour le stock
        $item_stmt = $conn->prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)");
        $stock_stmt = $conn->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");

        foreach ($processed_items as $p_item) {
            // Insertion détail de vente
            $item_stmt->bind_param("iiidd", $sale_id, $p_item['product_id'], $p_item['qty'], $p_item['price'], $p_item['subtotal']);
            $item_stmt->execute();

            // Retrait de stock
            $stock_stmt->bind_param("ii", $p_item['qty'], $p_item['product_id']);
            $stock_stmt->execute();
        }
        $item_stmt->close();
        $stock_stmt->close();

        // ÉTAPE 5 : Si c'est une vente à crédit (Dette), créer le registre de dette
        if ($payment_status === 'Dette') {
            $debt_status = ($amount_paid_initial >= $total_amount) ? 'Paid' : 'Pending';
            $debt_stmt = $conn->prepare("INSERT INTO debts (sale_id, customer_id, amount_due, amount_paid, status) VALUES (?, ?, ?, ?, ?)");
            $debt_stmt->bind_param("iidds", $sale_id, $customer_id, $total_amount, $amount_paid_initial, $debt_status);
            $debt_stmt->execute();
            $debt_stmt->close();
        }

        // ÉTAPE 6 : Validation finale de la transaction
        $conn->commit();
        echo json_encode(["success" => true, "sale_id" => $sale_id, "total" => $total_amount]);

    } catch (Exception $e) {
        // En cas d'erreur, on annule absolument toutes les modifications faites lors de l'appel
        $conn->rollback();
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit();
}
`,

  dettesPhp: `<?php
/**
 * dettes.php
 * Module de suivi des dettes clients et remboursements
 * Requêtes préparées MySQLi
 */

require_once 'db_connect.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Accès non autorisé."]);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// --- RECHERCHE/CRUD CLIENTS ---
if ($action === 'customers') {
    if ($method === 'GET') {
        $result = $conn->query("SELECT id, name, phone FROM customers ORDER BY name ASC");
        $customers = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($customers);
        exit();
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $phone = trim($data['phone'] ?? '');

        if (empty($name) || empty($phone)) {
            http_response_code(400);
            echo json_encode(["error" => "Nom et Téléphone du client requis."]);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO customers (name, phone) VALUES (?, ?)");
        $stmt->bind_param("ss", $name, $phone);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "id" => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Erreur lors de l'enregistrement du client."]);
        }
        $stmt->close();
        exit();
    }
}

// --- GESTION DES DETTES ---
if ($action === 'debts') {
    if ($method === 'GET') {
        // Liste complète des dettes avec infos client et vente
        $sql = "SELECT d.*, c.name as customer_name, c.phone as customer_phone, s.total_amount, s.created_at as sale_date
                FROM debts d 
                JOIN customers c ON d.customer_id = c.id
                JOIN sales s ON d.sale_id = s.id
                ORDER BY d.created_at DESC";
        $result = $conn->query($sql);
        $debts = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($debts);
        exit();
    }

    // Remboursement d'une dette (Partiel ou Total)
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $debt_id = (int)($data['debt_id'] ?? 0);
        $payment_amount = (float)($data['payment_amount'] ?? 0);

        if ($debt_id <= 0 || $payment_amount <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Données de remboursement invalides."]);
            exit();
        }

        // Récupérer la dette courante
        $stmt = $conn->prepare("SELECT amount_due, amount_paid FROM debts WHERE id = ?");
        $stmt->bind_param("i", $debt_id);
        $stmt->execute();
        $debt = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$debt) {
            http_response_code(404);
            echo json_encode(["error" => "Dette introuvable."]);
            exit();
        }

        $new_paid_total = $debt['amount_paid'] + $payment_amount;
        
        if ($new_paid_total > $debt['amount_due']) {
            http_response_code(400);
            echo json_encode(["error" => "Le montant payé dépasse la somme due restant (Max requis: " . ($debt['amount_due'] - $debt['amount_paid']) . " BIF)."]);
            exit();
        }

        $status = ($new_paid_total >= $debt['amount_due']) ? 'Paid' : 'Pending';

        $update_stmt = $conn->prepare("UPDATE debts SET amount_paid = ?, status = ? WHERE id = ?");
        $update_stmt->bind_param("dsi", $new_paid_total, $status, $debt_id);
        
        if ($update_stmt->execute()) {
            echo json_encode([
                "success" => true, 
                "amount_paid_total" => $new_paid_total,
                "status" => $status
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Impossible d'enregistrer le remboursement."]);
        }
        $update_stmt->close();
        exit();
    }
}
`,

  dashboardPhp: `<?php
/**
 * dashboard.php
 * Module d'indicateurs de performance (KPI) et rapports financiers
 * Calcul instantané du chiffre d'affaires et bénéfice net basé sur les prix réels
 */

require_once 'db_connect.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Accès non autorisé."]);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

// 1. Chiffre d'Affaires Total (CA)
$ca_res = $conn->query("SELECT SUM(total_amount) as total_ca FROM sales");
$total_ca = (float)($ca_res->fetch_assoc()['total_ca'] ?? 0.0);

// 2. Total des Dettes Actives en attente (Reste à recouvrer)
$debt_res = $conn->query("SELECT SUM(amount_due - amount_paid) as total_debts FROM debts WHERE status = 'Pending'");
$total_debts_pending = (float)($debt_res->fetch_assoc()['total_debts'] ?? 0.0);

// 3. Calcul Automatique du Bénéfice Net Réel
// Bénéfice = Somme des (Quantité * (Prix Vente - Prix Achat)) pour chaque article vendu
$profit_sql = "SELECT SUM(si.quantity * (p.selling_price - p.purchase_price)) as net_profit 
               FROM sale_items si 
               JOIN products p ON si.product_id = p.id";
$profit_res = $conn->query($profit_sql);
$net_profit = (float)($profit_res->fetch_assoc()['net_profit'] ?? 0.0);

// 4. Nombre de Produits en Alerte de Stock Bas
$stock_alert_res = $conn->query("SELECT COUNT(*) as alert_count FROM products WHERE stock_quantity <= alert_quantity");
$alert_count = (int)($stock_alert_res->fetch_assoc()['alert_count'] ?? 0);

// 5. Total des ventes
$sales_count_res = $conn->query("SELECT COUNT(*) as sales_count FROM sales");
$sales_count = (int)($sales_count_res->fetch_assoc()['sales_count'] ?? 0);

// Envoyer la réponse structurée
echo json_encode([
    "kpis" => [
        "chiffre_affaires" => $total_ca,
        "dettes_en_cours" => $total_debts_pending,
        "benefice_net" => $net_profit,
        "alertes_stock" => $alert_count,
        "nombre_ventes" => $sales_count
    ],
    "last_sales" => $conn->query("
        SELECT s.id, s.total_amount, s.payment_status, s.created_at, 
               COALESCE(c.name, 'Client Comptant') as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.created_at DESC LIMIT 5
    ")->fetch_all(MYSQLI_ASSOC)
]);
`,

  settingsPhp: `<?php
/**
 * ============================================================================
 * settings.php — Module Paramètres (DEFFLOX STOCK & FINANCE)
 * Éditeur : FLODELIXA TECHNOLOGIES (AI • SOFTWARE • DIGITAL SOLUTIONS)
 * Architecture : PHP 8+ / PDO (Requêtes préparées) + HTML5 + Tailwind CSS + Vanilla JS
 * ============================================================================
 */
declare(strict_types=1);

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
]);

// ----------------------------------------------------------------------------
// 1. CONFIGURATION & CONNEXION PDO SÉCURISÉE
// ----------------------------------------------------------------------------
const DB_HOST = 'localhost';
const DB_NAME = 'flodelixa_business';
const DB_USER = 'root';
const DB_PASS = '';

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME),
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    error_log('[DEFFLOX][PDO] Erreur connexion : ' . $e->getMessage());
    http_response_code(500);
    exit('Erreur interne de connexion à la base de données.');
}

// Auto-initialisation sécurisée de la table system_settings si absente
$pdo->exec("
    CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

// ----------------------------------------------------------------------------
// 2. CONTRÔLE D'ACCÈS & PROTECTION CSRF
// ----------------------------------------------------------------------------
$currentUserRole = $_SESSION['role'] ?? 'Admin'; // En production : rediriger si non authentifié
$allowedRoles    = ['Admin', 'Gérant'];
$canEditSettings = in_array($currentUserRole, $allowedRoles, true);

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Liste blanche stricte des clés autorisées + valeurs par défaut
$defaultSettings = [
    // Onglet 1 : Boutique & Devise
    'shop_name'                => 'DEFFLOX Boutique Bujumbura',
    'shop_address'             => 'Avenue de la Mission, Bujumbura, Burundi',
    'shop_phone'               => '+257 22 00 00 00',
    'shop_email'               => 'contact@defflox.bi',
    'shop_currency'            => 'BIF',

    // Onglet 2 : Reçus & POS
    'receipt_header'           => 'FACTURE OFFICIELLE • DEFFLOX STOCK & FINANCE',
    'receipt_footer'           => 'Merci pour votre achat ! À très bientôt.',
    'auto_print_receipt'       => '1',

    // Onglet 3 : Stock & Alertes
    'critical_stock_threshold' => '5',
    'allow_negative_stock'     => '0',

    // Onglet 4 : Utilisateurs & Droits
    'role_admin_discount'      => '1',
    'role_gerant_discount'     => '1',
    'role_caissier_discount'   => '0',
    'role_admin_view_margin'   => '1',
    'role_gerant_view_margin'  => '1',
    'role_caissier_view_margin'=> '0',
];

$flashMessage = null;
$flashType    = 'success';
$activeTab    = $_POST['active_tab'] ?? ($_GET['tab'] ?? 'boutique');

// ----------------------------------------------------------------------------
// 3. TRAITEMENT POST (SAUVEGARDE DYNAMIQUE VIA INSERT ... ON DUPLICATE KEY UPDATE)
// ----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $submittedToken = $_POST['csrf_token'] ?? '';

    if (!hash_equals($_SESSION['csrf_token'], $submittedToken)) {
        $flashType    = 'error';
        $flashMessage = 'Session expirée ou jeton CSRF invalide. Veuillez réessayer.';
    } elseif (!$canEditSettings) {
        $flashType    = 'error';
        $flashMessage = 'Accès refusé : seuls les rôles Admin ou Gérant peuvent modifier les paramètres.';
    } else {
        $allowedCurrencies = ['BIF', 'USD', 'EUR'];
        $postedCurrency    = strtoupper(trim((string)($_POST['shop_currency'] ?? 'BIF')));
        $currency          = in_array($postedCurrency, $allowedCurrencies, true) ? $postedCurrency : 'BIF';

        $emailRaw = trim((string)($_POST['shop_email'] ?? ''));
        if ($emailRaw !== '' && !filter_var($emailRaw, FILTER_VALIDATE_EMAIL)) {
            $flashType    = 'error';
            $flashMessage = "L'adresse email saisie n'est pas valide.";
        } else {
            $threshold = max(0, (int)($_POST['critical_stock_threshold'] ?? 5));

            $payload = [
                'shop_name'                 => trim((string)($_POST['shop_name'] ?? $defaultSettings['shop_name'])),
                'shop_address'              => trim((string)($_POST['shop_address'] ?? '')),
                'shop_phone'                => trim((string)($_POST['shop_phone'] ?? '')),
                'shop_email'                => $emailRaw,
                'shop_currency'             => $currency,
                'receipt_header'            => trim((string)($_POST['receipt_header'] ?? '')),
                'receipt_footer'            => trim((string)($_POST['receipt_footer'] ?? '')),
                'auto_print_receipt'        => isset($_POST['auto_print_receipt']) ? '1' : '0',
                'critical_stock_threshold'  => (string)$threshold,
                'allow_negative_stock'      => isset($_POST['allow_negative_stock']) ? '1' : '0',
                'role_admin_discount'       => '1', // Admin conserve toujours tous les droits
                'role_gerant_discount'      => isset($_POST['role_gerant_discount']) ? '1' : '0',
                'role_caissier_discount'    => isset($_POST['role_caissier_discount']) ? '1' : '0',
                'role_admin_view_margin'    => '1',
                'role_gerant_view_margin'   => isset($_POST['role_gerant_view_margin']) ? '1' : '0',
                'role_caissier_view_margin' => isset($_POST['role_caissier_view_margin']) ? '1' : '0',
            ];

            try {
                $pdo->beginTransaction();

                $stmt = $pdo->prepare("
                    INSERT INTO system_settings (setting_key, setting_value)
                    VALUES (:setting_key, :setting_value)
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                ");

                foreach ($payload as $key => $value) {
                    if (array_key_exists($key, $defaultSettings)) {
                        $stmt->execute([
                            ':setting_key'   => $key,
                            ':setting_value' => $value,
                        ]);
                    }
                }

                $pdo->commit();
                $flashType    = 'success';
                $flashMessage = 'Tous les paramètres système ont été enregistrés avec succès.';
            } catch (PDOException $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                error_log('[DEFFLOX][SETTINGS_SAVE] ' . $e->getMessage());
                $flashType    = 'error';
                $flashMessage = 'Une erreur est survenue lors de la sauvegarde en base de données.';
            }
        }
    }
}

// ----------------------------------------------------------------------------
// 4. LECTURE DES PARAMÈTRES EXISTANTS (FUSION AVEC LES VALEURS PAR DÉFAUT)
// ----------------------------------------------------------------------------
$settings = $defaultSettings;
try {
    $rows = $pdo->query('SELECT setting_key, setting_value FROM system_settings')->fetchAll();
    foreach ($rows as $row) {
        if (array_key_exists($row['setting_key'], $settings)) {
            $settings[$row['setting_key']] = (string)($row['setting_value'] ?? '');
        }
    }
} catch (PDOException $e) {
    error_log('[DEFFLOX][SETTINGS_READ] ' . $e->getMessage());
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paramètres — DEFFLOX STOCK & FINANCE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-100 text-slate-800 antialiased min-h-screen flex flex-col md:flex-row">

    <!-- ===================================================================
         SIDEBAR DARK SLATE (slate-900)
         =================================================================== -->
    <aside class="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between flex-shrink-0 md:min-h-screen">
        <div>
            <!-- Branding Commerce -->
            <div class="px-5 py-5 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-sm">
                        <i class="fa-solid fa-boxes-stacked"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-extrabold tracking-tight text-white truncate">DEFFLOX</p>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Stock &amp; Finance</p>
                    </div>
                </div>
                <p class="mt-3 text-[11px] text-slate-400 truncate">
                    <i class="fa-solid fa-store mr-1.5 text-slate-500"></i><?= e($settings['shop_name']) ?>
                </p>
            </div>

            <!-- Navigation -->
            <nav class="p-3 space-y-1 text-sm">
                <a href="dashboard.php" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i class="fa-solid fa-chart-line w-4 text-center"></i>
                    <span>Tableau de Bord</span>
                </a>
                <a href="pos.php" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i class="fa-solid fa-cash-register w-4 text-center"></i>
                    <span>Point de Vente (POS)</span>
                </a>
                <a href="stock.php" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i class="fa-solid fa-cubes w-4 text-center"></i>
                    <span>Gestion Stocks</span>
                </a>
                <a href="dettes.php" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i class="fa-solid fa-users w-4 text-center"></i>
                    <span>Dettes &amp; Clients</span>
                </a>
                <a href="settings.php" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold shadow-sm">
                    <i class="fa-solid fa-gear w-4 text-center"></i>
                    <span>Paramètres</span>
                </a>
            </nav>
        </div>

        <!-- Footer Développeur -->
        <div class="p-4 border-t border-slate-800 text-center">
            <p class="text-[10.5px] font-extrabold tracking-wider text-slate-200 uppercase">
                FLO<span class="text-cyan-400 font-black">D</span>ELIXA TECHNOLOGIES
            </p>
            <p class="text-[8px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
                AI • SOFTWARE • DIGITAL SOLUTIONS
            </p>
        </div>
    </aside>

    <!-- ===================================================================
         CONTENU PRINCIPAL (bg-slate-50 / bg-slate-100)
         =================================================================== -->
    <main class="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div class="max-w-5xl mx-auto space-y-6">

            <!-- En-tête de page -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        <i class="fa-solid fa-sliders text-blue-600 mr-2"></i>Paramètres du Système
                    </h1>
                    <p class="text-xs sm:text-sm text-slate-500 mt-1">
                        Configurez votre boutique à Bujumbura, les tickets POS, les alertes de stock et les droits utilisateurs.
                    </p>
                </div>
                <div class="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3 py-2 rounded-lg text-slate-600">
                    <i class="fa-solid fa-coins text-blue-600"></i>
                    <span>Devise active : <strong class="text-slate-900"><?= e($settings['shop_currency']) ?></strong></span>
                </div>
            </div>

            <!-- Message Flash -->
            <?php if ($flashMessage !== null): ?>
                <div id="flash-alert" class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium <?= $flashType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800' ?>">
                    <div class="flex items-center gap-2.5">
                        <i class="fa-solid <?= $flashType === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-circle-exclamation text-rose-600' ?>"></i>
                        <span><?= e($flashMessage) ?></span>
                    </div>
                    <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            <?php endif; ?>

            <!-- Navigation des 4 Onglets -->
            <div class="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1.5 shadow-sm" role="tablist">
                <button type="button" data-tab-btn="boutique" class="tab-btn flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition">
                    <i class="fa-solid fa-store"></i>
                    <span>1. Boutique &amp; Devise</span>
                </button>
                <button type="button" data-tab-btn="recus" class="tab-btn flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition">
                    <i class="fa-solid fa-receipt"></i>
                    <span>2. Reçus &amp; POS</span>
                </button>
                <button type="button" data-tab-btn="stock" class="tab-btn flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition">
                    <i class="fa-solid fa-boxes-packing"></i>
                    <span>3. Stock &amp; Alertes</span>
                </button>
                <button type="button" data-tab-btn="droits" class="tab-btn flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition">
                    <i class="fa-solid fa-user-shield"></i>
                    <span>4. Utilisateurs &amp; Droits</span>
                </button>
            </div>

            <!-- Formulaire Unique Modulaire -->
            <form method="POST" action="settings.php" id="settingsForm" class="space-y-6">
                <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                <input type="hidden" name="active_tab" id="activeTabInput" value="<?= e($activeTab) ?>">

                <!-- ===========================================================
                     ONGLET 1 : BOUTIQUE & DEVISE
                     =========================================================== -->
                <section data-tab-panel="boutique" class="tab-panel bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                    <div class="border-b border-slate-100 pb-3">
                        <h2 class="text-base font-bold text-slate-900">Identité de l'établissement &amp; Devise</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Informations affichées sur le tableau de bord, les devis et les factures clients.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label for="shop_name" class="block text-xs font-bold text-slate-700 mb-1.5">Nom du commerce *</label>
                            <input type="text" id="shop_name" name="shop_name" required
                                   value="<?= e($settings['shop_name']) ?>"
                                   placeholder="Ex: Quincaillerie Centrale Bujumbura"
                                   class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                        </div>

                        <div>
                            <label for="shop_currency" class="block text-xs font-bold text-slate-700 mb-1.5">Devise principale *</label>
                            <select id="shop_currency" name="shop_currency"
                                    class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600">
                                <option value="BIF" <?= $settings['shop_currency'] === 'BIF' ? 'selected' : '' ?>>BIF — Franc Burundais (FBu)</option>
                                <option value="USD" <?= $settings['shop_currency'] === 'USD' ? 'selected' : '' ?>>USD — Dollar Américain ($)</option>
                                <option value="EUR" <?= $settings['shop_currency'] === 'EUR' ? 'selected' : '' ?>>EUR — Euro (€)</option>
                            </select>
                        </div>

                        <div>
                            <label for="shop_phone" class="block text-xs font-bold text-slate-700 mb-1.5">Téléphone *</label>
                            <input type="text" id="shop_phone" name="shop_phone" required
                                   value="<?= e($settings['shop_phone']) ?>"
                                   placeholder="+257 79 00 00 00"
                                   class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                        </div>

                        <div>
                            <label for="shop_email" class="block text-xs font-bold text-slate-700 mb-1.5">Adresse Email</label>
                            <input type="email" id="shop_email" name="shop_email"
                                   value="<?= e($settings['shop_email']) ?>"
                                   placeholder="contact@boutique.bi"
                                   class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                        </div>

                        <div class="md:col-span-2">
                            <label for="shop_address" class="block text-xs font-bold text-slate-700 mb-1.5">Adresse complète / Ville *</label>
                            <input type="text" id="shop_address" name="shop_address" required
                                   value="<?= e($settings['shop_address']) ?>"
                                   placeholder="Ex: Avenue de l'Université, Rohero, Bujumbura"
                                   class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                        </div>
                    </div>
                </section>

                <!-- ===========================================================
                     ONGLET 2 : REÇUS & POS
                     =========================================================== -->
                <section data-tab-panel="recus" class="tab-panel hidden bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                    <div class="border-b border-slate-100 pb-3">
                        <h2 class="text-base font-bold text-slate-900">Configuration des Reçus &amp; Point de Vente (POS)</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Personnalisation des tickets thermiques 80mm et comportement à l'encaissement.</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label for="receipt_header" class="block text-xs font-bold text-slate-700 mb-1.5">En-tête du ticket de caisse</label>
                            <input type="text" id="receipt_header" name="receipt_header"
                                   value="<?= e($settings['receipt_header']) ?>"
                                   placeholder="Ex: FACTURE OFFICIELLE • NIF 4000123456"
                                   class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                        </div>

                        <div>
                            <label for="receipt_footer" class="block text-xs font-bold text-slate-700 mb-1.5">Pied de page du ticket</label>
                            <textarea id="receipt_footer" name="receipt_footer" rows="2"
                                      placeholder="Ex: Les marchandises vendues ne sont ni reprises ni échangées. Merci !"
                                      class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"><?= e($settings['receipt_footer']) ?></textarea>
                        </div>

                        <label class="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                            <div>
                                <span class="text-sm font-bold text-slate-800 block">Impression automatique après validation de vente</span>
                                <span class="text-xs text-slate-500">Déclenche automatiquement l'aperçu d'impression thermique dès l'encaissement POS.</span>
                            </div>
                            <input type="checkbox" name="auto_print_receipt" value="1"
                                   <?= $settings['auto_print_receipt'] === '1' ? 'checked' : '' ?>
                                   class="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-600">
                        </label>
                    </div>
                </section>

                <!-- ===========================================================
                     ONGLET 3 : STOCK & ALERTES
                     =========================================================== -->
                <section data-tab-panel="stock" class="tab-panel hidden bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                    <div class="border-b border-slate-100 pb-3">
                        <h2 class="text-base font-bold text-slate-900">Règles de Gestion des Stocks &amp; Alertes</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Applicable à toutes les unités (Pièce, Sac 50kg, Barre 12m, Boîte de 100...).</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        <div>
                            <label for="critical_stock_threshold" class="block text-xs font-bold text-slate-700 mb-1.5">
                                Seuil minimal global pour alerte critique
                            </label>
                            <div class="relative">
                                <input type="number" id="critical_stock_threshold" name="critical_stock_threshold" min="0" required
                                       value="<?= e($settings['critical_stock_threshold']) ?>"
                                       class="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                                <span class="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">unités</span>
                            </div>
                            <p class="text-[11px] text-slate-500 mt-1.5">
                                Tout produit dont le stock atteint ou passe sous ce seuil affiche un badge d'alerte critique.
                            </p>
                        </div>

                        <label class="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                            <div>
                                <span class="text-sm font-bold text-slate-800 block">Autoriser la vente en stock négatif</span>
                                <span class="text-xs text-slate-500">
                                    Si désactivé (recommandé), la caisse POS bloque toute vente dépassant la quantité disponible en stock.
                                </span>
                            </div>
                            <input type="checkbox" name="allow_negative_stock" value="1"
                                   <?= $settings['allow_negative_stock'] === '1' ? 'checked' : '' ?>
                                   class="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-600">
                        </label>
                    </div>
                </section>

                <!-- ===========================================================
                     ONGLET 4 : UTILISATEURS & DROITS
                     =========================================================== -->
                <section data-tab-panel="droits" class="tab-panel hidden bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                    <div class="border-b border-slate-100 pb-3">
                        <h2 class="text-base font-bold text-slate-900">Matrice des Rôles &amp; Permissions</h2>
                        <p class="text-xs text-slate-500 mt-0.5">Contrôlez les droits d'application des remises et la confidentialité des marges bénéficiaires.</p>
                    </div>

                    <div class="overflow-x-auto border border-slate-200 rounded-xl">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th class="px-5 py-3.5">Rôle Utilisateur</th>
                                    <th class="px-5 py-3.5 text-center">Accorder des Réductions (POS)</th>
                                    <th class="px-5 py-3.5 text-center">Afficher les Marges &amp; Prix d'Achat</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <!-- Admin -->
                                <tr class="hover:bg-slate-50/70">
                                    <td class="px-5 py-4">
                                        <span class="font-bold text-slate-900 block">Admin</span>
                                        <span class="text-xs text-slate-500">Accès système complet (Verrouillé)</span>
                                    </td>
                                    <td class="px-5 py-4 text-center">
                                        <input type="checkbox" checked disabled class="w-4 h-4 text-blue-600 rounded border-slate-300 opacity-60">
                                    </td>
                                    <td class="px-5 py-4 text-center">
                                        <input type="checkbox" checked disabled class="w-4 h-4 text-blue-600 rounded border-slate-300 opacity-60">
                                    </td>
                                </tr>

                                <!-- Gérant -->
                                <tr class="hover:bg-slate-50/70">
                                    <td class="px-5 py-4">
                                        <span class="font-bold text-slate-900 block">Gérant</span>
                                        <span class="text-xs text-slate-500">Supervision boutique, stocks &amp; finances</span>
                                    </td>
                                    <td class="px-5 py-4 text-center">
                                        <input type="checkbox" name="role_gerant_discount" value="1"
                                               <?= $settings['role_gerant_discount'] === '1' ? 'checked' : '' ?>
                                               class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600 cursor-pointer">
                                    </td>
                                    <td class="px-5 py-4 text-center">
                                        <input type="checkbox" name="role_gerant_view_margin" value="1"
                                               <?= $settings['role_gerant_view_margin'] === '1' ? 'checked' : '' ?>
                                               class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600 cursor-pointer">
                                    </td>
                                </tr>

                                <!-- Caissier -->
                                <tr class="hover:bg-slate-50/70">
                                    <td class="px-5 py-4">
                                        <span class="font-bold text-slate-900 block">Caissier</span>
                                        <span class="text-xs text-slate-500">Ventes POS &amp; encaissement client uniquement</span>
                                    </td>
                                    <td class="px-5 py-4 text-center">
                                        <input type="checkbox" name="role_caissier_discount" value="1"
                                               <?= $settings['role_caissier_discount'] === '1' ? 'checked' : '' ?>
                                               class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600 cursor-pointer">
                                    </td>
                                    <td class="px-5 py-4 text-center">
                                        <input type="checkbox" name="role_caissier_view_margin" value="1"
                                               <?= $settings['role_caissier_view_margin'] === '1' ? 'checked' : '' ?>
                                               class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600 cursor-pointer">
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- Barre de Sauvegarde -->
                <div class="flex items-center justify-end gap-3 pt-2">
                    <button type="submit" <?= !$canEditSettings ? 'disabled' : '' ?>
                            class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-floppy-disk"></i>
                        <span>Enregistrer les Paramètres</span>
                    </button>
                </div>
            </form>
        </div>
    </main>

    <!-- ===================================================================
         JAVASCRIPT VANILLA MODERNE (GESTION DES ONGLETS)
         =================================================================== -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const tabButtons = document.querySelectorAll('[data-tab-btn]');
            const tabPanels  = document.querySelectorAll('[data-tab-panel]');
            const activeInput = document.getElementById('activeTabInput');

            const switchTab = (tabName) => {
                tabButtons.forEach((btn) => {
                    const isActive = btn.dataset.tabBtn === tabName;
                    btn.classList.toggle('bg-blue-600', isActive);
                    btn.classList.toggle('text-white', isActive);
                    btn.classList.toggle('shadow-sm', isActive);
                    btn.classList.toggle('text-slate-600', !isActive);
                    btn.classList.toggle('hover:bg-slate-100', !isActive);
                });

                tabPanels.forEach((panel) => {
                    panel.classList.toggle('hidden', panel.dataset.tabPanel !== tabName);
                });

                if (activeInput) {
                    activeInput.value = tabName;
                }
            };

            tabButtons.forEach((btn) => {
                btn.addEventListener('click', () => switchTab(btn.dataset.tabBtn));
            });

            // Restauration de l'onglet actif après soumission POST
            const initialTab = activeInput && activeInput.value ? activeInput.value : 'boutique';
            switchTab(initialTab);
        });
    </script>
</body>
</html>
`
};
