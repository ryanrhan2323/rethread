DROP TABLE IF EXISTS offers;
DROP TABLE IF EXISTS repairrequests;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer','mender','admin') NOT NULL
);

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL
);

CREATE TABLE repairrequests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(255),
  status ENUM('open','in_progress','completed') NOT NULL DEFAULT 'open',
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE offers (
  offer_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  mender_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (request_id) REFERENCES repairrequests(request_id),
  FOREIGN KEY (mender_id) REFERENCES users(user_id)
);

INSERT INTO users (name, email, password, role) VALUES
('Roman Admin', 'admin@example.com', '123456', 'admin'),
('Liam O''Connor', 'liam.oconnor@gmail.com', '123456', 'customer'),
('Olivia Smith', 'olivia.smith@gmail.com', '123456', 'customer'),
('Jack Williams', 'jack.williams@gmail.com', '123456', 'customer'),
('Chloe Brown', 'chloe.brown@gmail.com', '123456', 'customer'),
('Noah Taylor', 'noah.taylor@gmail.com', '123456', 'customer'),
('Emily Wilson', 'emily.wilson@gmail.com', '123456', 'customer'),
('Mark Mender', 'mark@rethread.com', '123456', 'mender'),
('Sarah Tailor', 'sarah@rethread.com', '123456', 'mender'),
('Daniel Stitch', 'daniel@rethread.com', '123456', 'mender');

INSERT INTO categories (category_name) VALUES
('Jackets'),
('Coats'),
('Trousers'),
('Shirts'),
('Skirts'),
('Shoes');

INSERT INTO repairrequests (user_id, title, description, category, image_url, status) VALUES
(2, 'Denim jacket sleeve repair', 'Torn denim jacket sleeve needs stitching and patch repair.', 'Jackets', 'jacket1.jpg', 'open'),
(3, 'Winter coat zipper replacement', 'Zipper of winter coat is broken and needs replacement.', 'Coats', 'coat1.jpg', 'in_progress'),
(4, 'Formal trousers adjustment', 'Formal trousers require waist adjustment and hemming.', 'Trousers', 'trousers1.jpg', 'open'),
(5, 'Shirt button replacement', 'The shirt has missing buttons and needs fixing.', 'Shirts', 'shirt1.jpg', 'completed'),
(6, 'Leather jacket lining repair', 'Leather jacket has a ripped lining and needs inner repair.', 'Jackets', 'jacket2.jpg', 'open'),
(7, 'Skirt resizing and tear repair', 'Skirt needs resizing and minor fabric tear fixing.', 'Skirts', 'skirt1.jpg', 'open');

INSERT INTO offers (request_id, mender_id, price, message, status) VALUES
(1, 8, 18.00, 'I can stitch and patch the sleeve within 2 days.', 'accepted'),
(2, 9, 25.00, 'I can replace the zipper and check the lining as well.', 'accepted'),
(3, 10, 12.50, 'I can adjust the waist and hem the trousers by tomorrow.', 'pending'),
(4, 8, 8.00, 'I can replace all missing buttons neatly.', 'accepted'),
(5, 9, 22.00, 'I can repair the inner lining without changing the outer look.', 'pending'),
(6, 10, 15.00, 'I can resize the skirt and repair the tear carefully.', 'rejected');