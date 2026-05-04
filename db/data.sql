/*
    FILE: data.sql
    DESCRIPTION: Static data dump for testing purposes.
*/

INSERT INTO users (firstName, lastName, email, birthdate, password, role)
VALUES
    ('Admin', 'LMS', 'admin@library.com', '2000-05-15', 'passwd', 'admin'),
    ('Anna', 'Czytelnik', 'reader@library.com', '1998-03-12', 'passwd', 'reader'),
    ('Marta', 'Bibliotekarz', 'librarian@library.com', '1990-01-20', 'passwd', 'librarian');

INSERT INTO authors (firstName, lastName, birthdate, nationality)
VALUES ('J.K.', 'Rowling', '1965-07-31', 'British');

INSERT INTO publishers (name, city, country)
VALUES ('Media Rodzina', 'Poznań', 'Poland');

INSERT INTO categories (name, description)
VALUES ('Fantasy', 'Literatura fantasy i science-fiction');

INSERT INTO locations (shelf, section, floor)
VALUES ('A1', 'Fantasy', 1);

INSERT INTO books (title, ean, publishYear, description, publisher_id)
VALUES ('Harry Potter i Kamień Filozoficzny', '111-11-1111-111-1', 1997, 'Harry dowiaduje się, że jest czarodziejem i trafia do Hogwartu.', 1);

INSERT INTO book_authors (book_id, author_id)
VALUES (1, 1);

INSERT INTO book_categories (book_id, category_id)
VALUES (1, 1);

INSERT INTO copies (book_id, location_id, condition, available)
VALUES (1, 1, 'good', TRUE);

INSERT INTO loans (copy_id, user_id, loanDate, dueDate, status)
VALUES (1, 2, CURRENT_DATE - 30, CURRENT_DATE - 1, 'overdue');

INSERT INTO reservations (book_id, user_id, reservationDate, expiryDate, status)
VALUES (1, 2, CURRENT_DATE, CURRENT_DATE + 7, 'pending');

INSERT INTO fines (loan_id, user_id, amount, issueDate, paid)
VALUES (1, 2, 2.50, CURRENT_DATE, FALSE);

INSERT INTO orders (book_id, requested_by_id, quantity, supplier, status, requestedAt, expectedDeliveryDate, notes)
VALUES (1, 3, 5, 'Media Rodzina', 'submitted', CURRENT_TIMESTAMP, CURRENT_DATE + 14, 'Uzupełnienie egzemplarzy do zestawu fantasy');

INSERT INTO notifications (user_id, notificationType, title, message, relatedType, relatedId, isRead)
VALUES
    (2, 'fine_issued', 'Nowa kara', 'Twoje wypożyczenie zostało oznaczone jako przeterminowane.', 'fine', 1, FALSE),
    (3, 'order_update', 'Zamówienie złożone', 'Zamówienie na kolejne egzemplarze książki zostało wysłane do dostawcy.', 'order', 1, FALSE);
