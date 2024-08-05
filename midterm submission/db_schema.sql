-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL, 
    password TEXT NOT NULL,
    blog_title TEXT
);

CREATE TABLE IF NOT EXISTS drafts (
    draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created DATETIME,
    last_modified DATETIME,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS blogpost (
    blogpost_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    date_published DATETIME,
    last_modified DATETIME,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    user_id  INT,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    body TEXT NOT NULL,
    date DATETIME,
    blogpost_id INT,
    FOREIGN KEY (blogpost_id) REFERENCES blogpost (blogpost_id)
);

-- Insert default data (if necessary here) 

-- Set up two users with hashed passwords
INSERT INTO users ('username', 'password', 'blog_title') VALUES ('nikolina', '$2b$10$MxfqE/XwqVYJ.S5scnc9f.ZNtznGi9n9yG1ZdYyuxvV6WWyVkCxcW', 'Random Whatnots');

-- I'm inserting two blog posts and one draft here to show them on the author's home page
INSERT INTO blogpost ('title', 'body', 'date_published', 'last_modified', 'likes','user_id') 
VALUES ('Solo Travel: Why Everyone Should Experience It at Least Once', 'Solo travel is a transformative experience that offers unparalleled personal growth and self-discovery.', '14/02/2024 22:13', '01/04/2024 21:28', 32, 1);

INSERT INTO blogpost ('title', 'body', 'date_published', 'last_modified', 'likes', 'user_id')
VALUES ('10 Amazing Facts About Dolphins You Probably Didn''t Know', 'This blog post contains interesting and lesser-known facts about dolphins.', '05/07/2024 13:46', '07/07/2024 19:35', 12, 1);

INSERT INTO drafts ('title', 'body', 'created', 'last_modified', 'user_id')
VALUES ('Exploring the Hidden Gems of Iceland', 'Iceland is a land of breathtaking landscapes, from cascading waterfalls to volcanic craters. 
Discover the lesser-known spots that will make your trip truly unforgettable.', '16/12/2023 11:54', '02/03/2024 23:32', 1);

COMMIT;
