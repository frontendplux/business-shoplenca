-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) UNIQUE NOT NULL,
    token VARCHAR(255) NULL,
    
    username VARCHAR(50) NOT NULL UNIQUE,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NULL,
    
    email_is_verified BOOLEAN DEFAULT FALSE,
    phone_is_verified BOOLEAN DEFAULT FALSE,
    password VARCHAR(255) NOT NULL,
    
    status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
    is_admin BOOLEAN DEFAULT FALSE,
    admin_default_password VARCHAR(255) NULL,
    
    is_vendor BOOLEAN DEFAULT FALSE,
    is_sub_domain_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code CHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    exchange_rate DECIMAL(18, 6) NOT NULL DEFAULT 1.000000,
    is_default BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
    CONSTRAINT chk_currency_rate CHECK (exchange_rate > 0),
    INDEX idx_currencies_status (status)
) DEFAULT CHARSET=utf8mb4;
-- 2. CATEGORY TABLE
CREATE TABLE IF NOT EXISTS category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords TEXT,
    image VARCHAR(255),
    logo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. SUB CATEGORY TABLE
CREATE TABLE IF NOT EXISTS sub_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords TEXT,
    image VARCHAR(255),
    logo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
);

-- 4. BRAND CATEGORY TABLE
CREATE TABLE IF NOT EXISTS brand_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_category_id INT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords TEXT,
    image VARCHAR(255),
    logo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sub_category_id) REFERENCES sub_category(id) ON DELETE SET NULL
);


-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    product_category_id INT NULL,
    product_sub_category_id INT NULL,
    brand_category_id INT NULL,
    keywords TEXT,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    off_price DECIMAL(5, 2) DEFAULT 0.00,
    
    final_price DECIMAL(10, 2) GENERATED ALWAYS AS (price - (price * (off_price / 100))) STORED,
    
    specification JSON DEFAULT NULL,
    instock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (product_category_id) REFERENCES category(id) ON DELETE SET NULL,
    FOREIGN KEY (product_sub_category_id) REFERENCES sub_category(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_category_id) REFERENCES brand_category(id) ON DELETE SET NULL,

    INDEX idx_products_uid (uid),
    INDEX idx_products_category (product_category_id),
    INDEX idx_products_sub_category (product_sub_category_id),
    INDEX idx_products_brand (brand_category_id),
    INDEX idx_products_instock (instock),
    INDEX idx_products_price (price)
);

CREATE TABLE IF NOT EXISTS products_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NOT NULL,
    parent_id INT DEFAULT NULL,
    product_id INT NOT NULL,
    star TINYINT UNSIGNED NOT NULL DEFAULT 5,
    msg TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES products_reviews(id) ON DELETE CASCADE,

    -- Enforce valid rating scores (1 to 5 stars)
    CONSTRAINT chk_star_rating CHECK (star >= 1 AND star <= 5),

    -- Performance Indexes
    INDEX idx_reviews_uid (uid),
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_parent (parent_id)
);



-- 5. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    UNIQUE KEY uq_user_wishlist_product (uid, product_id),
    INDEX idx_wishlist_uid (uid),
    INDEX idx_wishlist_product (product_id)
);
-- 7. INVENTORIES TABLE
CREATE TABLE IF NOT EXISTS inventories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inv_position INT NOT NULL UNIQUE,
    style_type INT DEFAULT NULL,
    show_ads_next BOOLEAN DEFAULT FALSE,
    ads_id INT DEFAULT NULL,
    ads_id2 INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    image VARCHAR(255) DEFAULT NULL,
    description TEXT,
    keywords TEXT,
    time_start DATETIME NULL,
    time_end DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. PRODUCT INVENTORIES TABLE (Junction Table)
CREATE TABLE IF NOT EXISTS product_inventories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    product_id INT NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    time_start DATETIME NULL,
    time_end DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (inventory_id) REFERENCES inventories(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    UNIQUE KEY uq_inventory_product (inventory_id, product_id),
    INDEX idx_product_inv_inventory (inventory_id),
    INDEX idx_product_inv_product (product_id)
);

-- 9. CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    INDEX idx_cart_items_uid (uid),
    INDEX idx_cart_items_product (product_id),
    UNIQUE KEY uq_user_product (uid, product_id)
);



CREATE TABLE IF NOT EXISTS site_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NOT NULL,
    parent_id INT DEFAULT NULL,
    star TINYINT UNSIGNED NOT NULL DEFAULT 5,
    msg TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES products_reviews(id) ON DELETE CASCADE,

    -- Enforce valid rating scores (1 to 5 stars)
    CONSTRAINT chk_star_rating CHECK (star >= 1 AND star <= 5),

    -- Performance Indexes
    INDEX idx_reviews_uid (uid),
    INDEX idx_reviews_parent (parent_id)
);



CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    excerpt VARCHAR(500) DEFAULT NULL,
    content MEDIUMTEXT NOT NULL,
    image VARCHAR(255) DEFAULT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    tags VARCHAR(255) DEFAULT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    views INT UNSIGNED NOT NULL DEFAULT 0,
    published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
 
    INDEX idx_blog_status_published (status, published_at),
    INDEX idx_blog_category (category),
    INDEX idx_blog_views (views)
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NULL,                       -- set when a logged-in user sends the message
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
    admin_note TEXT NULL,
    replied_at DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE SET NULL,
 
    INDEX idx_contact_status (status),
    INDEX idx_contact_email (email),
    INDEX idx_contact_ip_time (ip_address, created_at),
    INDEX idx_contact_created (created_at)
);
 
CREATE TABLE IF NOT EXISTS contact_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(30) NOT NULL,                  -- address, phone, email, whatsapp, hours, map
    label VARCHAR(100) NOT NULL,
    value VARCHAR(500) NOT NULL,
    icon VARCHAR(50) DEFAULT 'bi-info-circle',  -- Bootstrap Icons class
    link VARCHAR(255) NULL,                     -- tel:, mailto:, https:// ...
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
    INDEX idx_contact_info_order (status, sort_order)
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(150) NOT NULL,
    cover_image VARCHAR(255) DEFAULT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    views INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_books_status (status),
    INDEX idx_books_category (category),
    INDEX idx_books_views (views)
);

CREATE TABLE IF NOT EXISTS book_chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    chapter_no INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uq_book_chapter (book_id, chapter_no)
);

CREATE TABLE IF NOT EXISTS book_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(64) NOT NULL,
    book_id INT NOT NULL,
    chapter_no INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_book (uid, book_id)
);

CREATE TABLE IF NOT EXISTS site_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page VARCHAR(50) NOT NULL,
    tab_slug VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    icon VARCHAR(50) DEFAULT 'bi-file-text',
    content MEDIUMTEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_page_tab (page, tab_slug),
    INDEX idx_site_pages_order (page, status, sort_order)
);