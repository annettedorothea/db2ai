CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products (product_id),
    quantity INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products (product_id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL
);

INSERT INTO products (name, price) VALUES
    ('Widget', 9.99),
    ('Gadget', 19.50),
    ('Gizmo', 4.25);

INSERT INTO orders (customer_id, product_id, quantity) VALUES
    ('alice', 1, 2),
    ('alice', 2, 1),
    ('bob', 3, 4);

INSERT INTO reviews (product_id, rating, comment) VALUES
    (1, 5, 'Solid widget, would buy again.'),
    (1, 4, 'Good value for money.'),
    (2, 3, 'Gadget works, packaging was dented.');
