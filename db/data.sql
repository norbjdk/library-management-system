/* 
    FILE: data.sql
    DESCRIPTION: Static data dump for testing purposes.
*/

INSERT INTO users (firstName, lastName, email, birthdate, password, role)
VALUES ('Admin', 'LMS', 'admin@library.com', '2000-05-15', 'passwd', 'admin');

INSERT INTO authors (firstName, lastName, birthdate, nationality)
VALUES ('J.K.', 'Rowling', '1965-07-31', 'British');

INSERT INTO publishers (name, city, country)
VALUES ('Media Rodzina', 'Poznań', 'Poland');

INSERT INTO categories (name, description)
VALUES ('Fantasy', 'Literatura fantasy i science-fiction');

INSERT INTO locations (shelf, section, floor)
VALUES ('A1', 'Fantasy', 1);

INSERT INTO books (title, isbn, publishYear, description, publisher_id)
VALUES ('Harry Potter i Kamień Filozoficzny', '111-11-1111-111-1', 1997, 'Harry dowiaduje się, że jest czarodziejem i trafia do Hogwartu.', 1);

INSERT INTO book_authors (book_id, author_id)
VALUES (1, 1);

INSERT INTO book_categories (book_id, category_id)
VALUES (1, 1);

INSERT INTO copies (book_id, location_id, condition, available)
VALUES (1, 1, 'good', TRUE);

INSERT INTO loans (copy_id, user_id, loanDate, dueDate, status)
VALUES (1, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'active');

INSERT INTO reservations (book_id, user_id, reservationDate, expiryDate, status)
VALUES (1, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'pending');

INSERT INTO fines (loan_id, user_id, amount, issueDate, paid)
VALUES (1, 1, 2.50, CURRENT_DATE, FALSE);
