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
('Anna Customer', 'anna@example.com', '123456', 'customer'),
('Mark Mender', 'mark@example.com', '123456', 'mender');

INSERT INTO categories (category_name) VALUES
('Jackets'),
('Trousers'),
('Shoes'),
('Dresses');

INSERT INTO repairrequests (user_id, title, description, category, image_url, status) VALUES
(2, 'Fix jacket zipper', 'The front zipper is broken and needs replacement.', 'Jackets', 'jacket.jpg', 'open'),
(2, 'Shorten trousers', 'Need to shorten the length of formal trousers.', 'Trousers', 'trousers.jpg', 'in_progress'),
(2, 'Repair shoe sole', 'The sole is coming off and needs to be glued properly.', 'Shoes', 'shoes.jpg', 'completed');

INSERT INTO offers (request_id, mender_id, price, message, status) VALUES
(1, 3, 15.00, 'I can replace the zipper in 2 days.', 'pending'),
(2, 3, 10.00, 'I can shorten the trousers by tomorrow.', 'accepted'),
(3, 3, 12.50, 'I can fix the shoe sole with strong adhesive.', 'rejected');