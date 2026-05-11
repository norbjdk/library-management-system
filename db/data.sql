INSERT INTO users ("firstName", "lastName", email, birthdate, password, role, "createDate")
VALUES
    ('Admin', 'LMS', 'admin@library.com', '2000-05-15', 'passwd', 'admin', CURRENT_TIMESTAMP),
    ('Anna', 'Czytelnik', 'reader@library.com', '1998-03-12', 'passwd', 'reader', CURRENT_TIMESTAMP),
    ('Ola', 'Rezerwująca', 'reader2@library.com', '1996-07-08', 'passwd', 'reader', CURRENT_TIMESTAMP),
    ('Marta', 'Bibliotekarz', 'librarian@library.com', '1990-01-20', 'passwd', 'librarian', CURRENT_TIMESTAMP);

INSERT INTO authors ("firstName", "lastName", birthdate, nationality)
VALUES
    ('J.K.', 'Rowling', '1965-07-31', 'British'),
    ('Andrzej', 'Sapkowski', '1948-06-21', 'Polish'),
    ('Dmitry', 'Glukhovsky', '1979-06-12', 'Russian'),
    ('John', 'Flanagan', '1944-05-22', 'Australian'),
    ('E.L.', 'James', '1963-03-07', 'British');

INSERT INTO publishers (name, city, country)
VALUES
    ('Media Rodzina', 'Poznań', 'Poland'),
    ('Wydawnictwo Literackie', 'Kraków', 'Poland'),
    ('Insignis', 'Kraków', 'Poland'),
    ('Jaguar', 'Warszawa', 'Poland'),
    ('Sonia Draga', 'Katowice', 'Poland');

INSERT INTO categories (name, description)
VALUES
    ('Fantasy', 'Literatura fantasy i science-fiction'),
    ('Dystopia', 'Powieści antyutopijne'),
    ('Postapo', 'Powieści postapokaliptyczne i survivalowe'),
    ('Young Adult', 'Literatura młodzieżowa i przygodowa'),
    ('Romance', 'Powieści obyczajowe i romansowe');

INSERT INTO locations (shelf, section, floor)
VALUES
    ('A1', 'Fantasy', 1),
    ('B2', 'Dystopia', 1),
    ('C3', 'Young Adult', 2),
    ('D4', 'Romance', 1),
    ('E5', 'Archiwum', 3);

INSERT INTO books (title, ean, "publishYear", description, publisher_id)
VALUES
    ('Harry Potter i Kamień Filozoficzny', '111-11-1111-111-1', 1997, 'Harry dowiaduje się, że jest czarodziejem i trafia do Hogwartu.', 1),
    ('Wiedźmin: Ostatnie życzenie', '222-22-2222-222-2', 1993, 'Zbiór opowiadań o Geralcie z Rivii.', 2),
    ('Metro 2033', '333-33-3333-333-3', 2005, 'Życie ocalałych ludzi w tunelach moskiewskiego metra po katastrofie.', 3),
    ('Zwiadowcy: Ruiny Gorlanu', '444-44-4444-444-4', 2004, 'Początek przygód Willa i Korpusu Zwiadowców.', 4),
    ('50 twarzy Greya', '555-55-5555-555-5', 2011, 'Romans Any i Christiana, który wywołał szeroką dyskusję.', 5);

INSERT INTO book_authors (book_id, author_id)
VALUES
    (1, 1),
    (2, 2),
    (3, 3),
    (4, 4),
    (5, 5);

INSERT INTO book_categories (book_id, category_id)
VALUES
    (1, 1),
    (2, 1),
    (3, 2),
    (3, 3),
    (4, 1),
    (4, 4),
    (5, 5);

INSERT INTO copies (book_id, location_id, condition, available)
VALUES
    (1, 1, 'good', TRUE),
    (1, 5, 'good', TRUE),
    (2, 1, 'good', FALSE),
    (2, 2, 'worn', TRUE),
    (3, 2, 'good', FALSE),
    (3, 5, 'worn', TRUE),
    (4, 3, 'new', TRUE),
    (5, 4, 'good', FALSE);

INSERT INTO loans (copy_id, user_id, "loanDate", "dueDate", status)
VALUES
    (3, 2, CURRENT_DATE - 28, CURRENT_DATE - 2, 'overdue'),
    (5, 3, CURRENT_DATE - 6, CURRENT_DATE + 5, 'active'),
    (8, 2, CURRENT_DATE - 16, CURRENT_DATE - 3, 'overdue');

INSERT INTO reservations (book_id, user_id, "reservationDate", "expiryDate", status)
VALUES
    (2, 2, CURRENT_DATE - 1, CURRENT_DATE + 6, 'pending'),
    (2, 3, CURRENT_DATE, CURRENT_DATE + 7, 'pending'),
    (3, 2, CURRENT_DATE - 1, CURRENT_DATE + 5, 'pending'),
    (4, 3, CURRENT_DATE - 2, CURRENT_DATE + 4, 'fulfilled'),
    (5, 2, CURRENT_DATE, CURRENT_DATE + 8, 'pending');

INSERT INTO fines (loan_id, user_id, amount, "issueDate", paid)
VALUES
    (1, 2, 7.50, CURRENT_DATE, FALSE),
    (3, 2, 12.00, CURRENT_DATE - 1, FALSE);

INSERT INTO orders (book_id, requested_by_id, quantity, supplier, status, "requestedAt", "expectedDeliveryDate", notes)
VALUES
    (1, 4, 5, 'Media Rodzina', 'submitted', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_DATE + 12, 'Uzupełnienie egzemplarzy do zestawu fantasy'),
    (3, 4, 4, 'Insignis', 'processing', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_DATE + 9, 'Wysoki popyt na literaturę postapo'),
    (4, 1, 6, 'Jaguar', 'draft', CURRENT_TIMESTAMP - INTERVAL '12 hours', CURRENT_DATE + 15, 'Rozbudowa działu młodzieżowego');

INSERT INTO notifications (user_id, "notificationType", title, message, "relatedType", "relatedId", "isRead", "createdAt")
VALUES
    (2, 'fine_issued', 'Nowa kara', 'Twoje wypożyczenie zostało oznaczone jako przeterminowane.', 'fine', 1, FALSE, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (2, 'loan_due', 'Termin zwrotu minął', 'Wypożyczenie książki 50 twarzy Greya jest przeterminowane.', 'loan', 3, FALSE, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (3, 'reservation_ready', 'Rezerwacja Metro 2033', 'Twoja rezerwacja książki Metro 2033 przesunęła się w kolejce.', 'reservation', 3, FALSE, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (4, 'order_update', 'Zamówienie zaktualizowane', 'Zamówienie Metro 2033 zostało przeniesione do realizacji.', 'order', 2, TRUE, CURRENT_TIMESTAMP - INTERVAL '30 minutes');
