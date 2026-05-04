CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    birthdate DATE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'librarian', 'admin')),
    createDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    birthdate DATE,
    nationality VARCHAR(50)
);

CREATE TABLE publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    city VARCHAR(50),
    country VARCHAR(50)
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    shelf VARCHAR(20) NOT NULL,
    section VARCHAR(50),
    floor SMALLINT
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    ean VARCHAR(20) UNIQUE,
    publishYear SMALLINT,
    description TEXT,
    publisher_id INT REFERENCES publishers(id) ON DELETE SET NULL
);

CREATE TABLE book_authors (
	id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE (book_id, author_id)
);

CREATE TABLE book_categories (
	id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE (book_id, category_id)
);

CREATE TABLE copies (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    location_id INT REFERENCES locations(id) ON DELETE SET NULL,
    condition VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (condition IN ('new', 'good', 'worn', 'damaged')),
    available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    copy_id INT NOT NULL REFERENCES copies(id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    loanDate DATE NOT NULL DEFAULT CURRENT_DATE,
    dueDate DATE NOT NULL,
    returnDate DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue'))
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reservationDate DATE NOT NULL DEFAULT CURRENT_DATE,
    expiryDate DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'expired')),
	UNIQUE (book_id, user_id)
);

CREATE TABLE fines (
    id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount NUMERIC(8, 2) NOT NULL,
    issueDate DATE NOT NULL DEFAULT CURRENT_DATE,
    paidDate DATE,
    paid BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    requested_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    quantity SMALLINT NOT NULL DEFAULT 1,
    supplier VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'received', 'cancelled')),
    requestedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    expectedDeliveryDate DATE,
    notes TEXT
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notificationType VARCHAR(30) NOT NULL DEFAULT 'system' CHECK (notificationType IN ('loan_due', 'reservation_ready', 'fine_issued', 'order_update', 'system')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    relatedType VARCHAR(50),
    relatedId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    readAt TIMESTAMP,
    isRead BOOLEAN NOT NULL DEFAULT FALSE
);
