const bcrypt = require('bcrypt');
const express = require("express");
const session = require('express-session');
const router = express.Router();

/**
 * @desc Configure session middleware
 */
router.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

/**
 * @desc Middleware to print route being accessed (for debugging purposes)
 */
router.use((req, res, next) => {
    console.log(`Route accessed: ${req.url}`);
    next();
});



//       MINIMUM MIDTERM PROJECT REQUIREMENTS       //


// THE FOLLOWING BLOCK OF DISPLAYS HOME PAGE
/**
 * @desc Route to the home page
 */
router.get('/', (req, res, next) => {
    const query = `
        SELECT 
            blogpost.blogpost_id, 
            blogpost.title, 
            blogpost.likes, 
            users.username 
        FROM 
            blogpost 
        JOIN 
            users 
        ON 
            blogpost.user_id = users.user_id 
        ORDER BY 
            blogpost.likes DESC 
        LIMIT 5`;

    global.db.all(query, (err, mostLikedPosts) => {
        if (err) {
            return next(err);
        }

        res.render('index', { user: req.session.user, mostLikedPosts });
    });
});

// THE FOLLOWING BLOCK OF DISPLAYS AUTHOR'S HOME PAGE
/**
 * @desc Route to the author's home page.
 * Query the database 
 */
router.get('/:username/author-home', (req, res, next) => {
    const username = req.params.username;

    // Query to retrieve blog posts for the specified user
    const blogpostsQuery = `
        SELECT b.blogpost_id, b.title, b.body, b.date_published, b.last_modified, b.likes, b.views, u.username AS author
        FROM blogpost b
        JOIN users u ON b.user_id = u.user_id
        WHERE u.username = ?;`;

    // Query to retrieve drafts for the specified user
    const draftsQuery = `
        SELECT d.draft_id, d.title, d.body, d.created, d.last_modified, u.username AS author
        FROM drafts d
        JOIN users u ON d.user_id = u.user_id
        WHERE u.username = ?;`;

    // Query to retrieve the blog title for the specified user
    const blogTitleQuery = `
        SELECT blog_title
        FROM users
        WHERE username = ?;`;

    // Run all queries
    global.db.get(blogTitleQuery, [username], (err, userRow) => {
        if (err) {
            return next(err);
        }
        
        global.db.all(blogpostsQuery, [username], (err, blogposts) => {
            if (err) {
                return next(err);
            }
            
            global.db.all(draftsQuery, [username], (err, drafts) => {
                if (err) {
                    return next(err);
                }
                
                res.render('author-home.ejs', {
                    availableBlogposts: blogposts,
                    availableDrafts: drafts,
                    blogTitle: userRow.blog_title,
                    user: req.session.user
                });
            });
        });
    });
});

/**
 * @desc Route to render settings page with user data
 */
router.get('/:username/settings', (req, res, next) => {
    const { username } = req.params;
    
    // Query to fetch user data
    const query = 'SELECT username, blog_title FROM users WHERE username = ?';

    global.db.get(query, [username], (err, user) => {
        if (err) {
            return next(err);
        }
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('settings', {
            user: user.username,
            blogTitle: user.blog_title
        });
    });
});

/**
 * @desc Route to handle form submission for updating user settings
 */
router.post('/:username/settings', (req, res, next) => {
    const { username } = req.params;
    const { newUsername, newBlogTitle } = req.body;

    // Query to update user data
    const query = 'UPDATE users SET username = ?, blog_title = ? WHERE username = ?';

    global.db.run(query, [newUsername, newBlogTitle, username], function (err) {
        if (err) {
            return next(err);
        }

        // Update username in session
        req.session.user = newUsername;

        res.redirect(`/${newUsername}/author-home`);
    });
});

/**
 * @desc Route to render new draft page 
 */
router.get('/:username/new-draft', (req, res) => {
    const { username } = req.params;
    res.render('new-draft', { user: username });
});

/**
 * @desc Route to handle form submission for new drafts
 */
router.post('/:username/new-draft', (req, res, next) => {
    const { username } = req.params;
    const { title, body, action } = req.body;
    const date = new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: undefined,
        hour12: false
    }).replace(',', '');

    let tableName;
    let query;
    let queryParameters;

    if (action === 'publish') {
        tableName = 'blogpost';
        query = `INSERT INTO ${tableName} (title, body, date_published, last_modified, user_id) VALUES (?, ?, ?, ?, ?);`;
        queryParameters = [title, body, date, date, 1]; // Replace 1 with the actual user_id
    } else if (action === 'save') {
        tableName = 'drafts';
        query = `INSERT INTO ${tableName} (title, body, created, last_modified, user_id) VALUES (?, ?, ?, ?, ?);`;
        queryParameters = [title, body, date, date, 1]; // Replace 1 with the actual user_id
    } else {
        // Handle invalid action (optional)
        return res.status(400).send('Invalid action');
    }

    db.run(query, queryParameters, function (err) {
        if (err) {
            next(err); // Send the error to the error handler
        } else {
            // Redirect to the author home page after successful insertion
            res.redirect(`/${username}/author-home`);
        }
    });
});

/**
 * @desc Displaying the edit page 
 */
router.get('/:type/:id/edit', (req, res, next) => {
    const { type, id } = req.params;
    const table = type === 'blogpost' ? 'blogpost' : 'drafts';
    const idColumn = type === 'blogpost' ? 'blogpost_id' : 'draft_id';
    
    const query = `SELECT * FROM ${table} WHERE ${idColumn} = ?`;
    global.db.get(query, [id], (err, item) => {
        if (err) {
            return next(err);
        } else if (!item) {
            return res.status(404).send(`${type} not found`);
        } else {
            res.render('edit', { item, type, user: req.session.user });
        }
    });
});

/**
 * @desc Update a blog post or draft
 */
router.post('/:type/:id/edit', (req, res, next) => {
    const { type, id } = req.params;
    const { title, body, action } = req.body;
    const date = new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: undefined,
        hour12: false
    }).replace(',', '');

    if (type === 'draft') {
        if (action === 'save') {
            // Update an existing draft
            const query = `UPDATE drafts SET title = ?, body = ?, last_modified = ? WHERE draft_id = ?`;
            const queryParameters = [title, body, date, id];
            db.run(query, queryParameters, function (err) {
                if (err) {
                    return next(err); // Send the error to the error handler
                } else {
                    // Redirect to the author home page after successful update or publish
                    return res.redirect(`/${req.session.user}/author-home`);
                }
            });
        } else if (action === 'publish') {
            // Move draft to blogpost table as a new record and delete from drafts
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                db.run(
                    `INSERT INTO blogpost (title, body, date_published, last_modified, user_id)
                     SELECT title, body, ?, ?, user_id FROM drafts WHERE draft_id = ?`,
                    [date, date, id],
                    function (err) {
                        if (err) {
                            return db.run('ROLLBACK', () => next(err)); // Rollback and send the error to the error handler
                        }
                        db.run(
                            `DELETE FROM drafts WHERE draft_id = ?`,
                            [id],
                            function (err) {
                                if (err) {
                                    return db.run('ROLLBACK', () => next(err)); // Rollback and send the error to the error handler
                                }
                                db.run('COMMIT', function (err) {
                                    if (err) {
                                        return next(err); // Send the error to the error handler
                                    }
                                    // Redirect to the author home page after successful update or publish
                                    return res.redirect(`/${req.session.user}/author-home`);
                                });
                            }
                        );
                    }
                );
            });
        }
    } else if (type === 'blogpost') {
        // Update an existing blogpost
        query = `UPDATE blogpost SET title = ?, body = ?, last_modified = ? WHERE blogpost_id = ?`;
        queryParameters = [title, body, date, id];

        db.run(query, queryParameters, function (err) {
            if (err) {
                next(err); // Send the error to the error handler
            } else {
                // Redirect to the author home page after successful update or publish
                return res.redirect(`/${req.session.user}/author-home`);
            }
        });

    } else {
        // Handle invalid type (optional)
        return res.status(400).send(`Invalid type: ${type}`);
    }
});

/**
 * @desc Deleting the blog post (article) alongside its comments from the database and reloading the author's home page
 */
router.post('/blogpost/:id/delete-post', (req, res, next) => {
    const blogpostId = req.params.id;

    // Begin transaction
    global.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            return next(err); // Send the error to the error handler middleware
        }

        // Delete comments associated with the blog post
        const deleteComments = `
            DELETE FROM comments
            WHERE blogpost_id = ?;
        `;

        global.db.run(deleteComments, [blogpostId], (err) => {
            if (err) {
                return global.db.run('ROLLBACK', (rollbackErr) => {
                    return next(err || rollbackErr); // Send the error to the error handler middleware
                });
            }

            // Delete the blog post from the database
            const deleteBlogpost = `
                DELETE FROM blogpost
                WHERE blogpost_id = ?;
            `;

            global.db.run(deleteBlogpost, [blogpostId], (err) => {
                if (err) {
                    return global.db.run('ROLLBACK', (rollbackErr) => {
                        return next(err || rollbackErr); // Send the error to the error handler middleware
                    });
                }

                // Commit transaction
                global.db.run('COMMIT', (err) => {
                    if (err) {
                        return next(err); // Send the error to the error handler middleware
                    }

                    // Redirect to the author's home page after successful deletion
                    res.redirect(`/${req.session.user}/author-home`);
                });
            });
        });
    });
});


/**
 * @desc Deleting the post (article) draft from the database and reloading the author's home page
 */
router.post('/draft/:id/delete-draft', (req, res, next) => {
    const draftId = req.params.id;

    // Delete the draft from the database
    const deleteDraft = `
        DELETE FROM drafts
        WHERE draft_id = ?;
    `;

    global.db.run(deleteDraft, [draftId], (err) => {
        if (err) {
            return next(err); // Send the error to the error handler middleware
        } else {
            // Redirect to the author's home page after successful deletion
            res.redirect(`/${req.session.user}/author-home`);
        }
    });
});



// THE FOLLOWING BLOCK OF CODE DISPLAYS READER - HOME PAGE
/**
 * @desc Displays reader's page with a list of blog posts
 */
router.get('/reader', (req, res, next) => {
    const query = `
        SELECT u.username, b.blogpost_id, b.title, b.date_published
        FROM users u
        LEFT JOIN blogpost b ON u.user_id = b.user_id
        ORDER BY u.username, b.date_published;
    `;
    global.db.all(query, [], (err, rows) => {
        if (err) {
            next(err);
        } else {
            const availableUsers = [];
            const userMap = {};

            rows.forEach(row => {
                if (!userMap[row.username]) {
                    userMap[row.username] = {
                        username: row.username,
                        blogposts: []
                    };
                    availableUsers.push(userMap[row.username]);
                }
                if (row.blogpost_id) {
                    userMap[row.username].blogposts.push({
                        blogpost_id: row.blogpost_id,
                        title: row.title,
                        date_published: row.date_published
                    });
                }
            });

            res.render("reader.ejs", { availableUsers, user: req.session.user });
        }
    });
});


// THE FOLLOWING BLOCK OF CODE DISPLAYS READER - ARTICLE PAGE
/**
 * @desc Displays an individual blog post (article)
 */
router.get('/blogpost/:id', (req, res, next) => {
    const blogpostId = req.params.id;

    // Increment the views count
    const updateViewsQuery = `
        UPDATE blogpost
        SET views = views + 1
        WHERE blogpost_id = ?;
    `;

    global.db.run(updateViewsQuery, [blogpostId], (err) => {
        if (err) {
            return next(err); // send the error to the error handler
        }
    })

    // Fetch the blog post and the author's username from the database
    const queryBlogpost = `
        SELECT b.title, b.blogpost_id, b.body, b.date_published, b.last_modified, b.likes, b.views, u.username AS author
        FROM blogpost b
        JOIN users u ON b.user_id = u.user_id
        WHERE b.blogpost_id = ?;
    `;
    
    const queryComments = `
        SELECT username, body, date 
        FROM comments
        WHERE blogpost_id = ?
        ORDER BY date;
    `;

    global.db.get(queryBlogpost, [blogpostId], (err, blogpost) => {
        if (err) {
            next(err); // Send the error to the error handler
        } else if (blogpost) {
            global.db.all(queryComments, [blogpostId], (err, comments) => {
                if (err) {
                    next(err); // Send the error to the error handler
                } else {
                    // Render the blogpost page with the fetched blog post data and comments
                    res.render('blogpost.ejs', { blogpost, comments, user: req.session.user });
                }
            });
        } else {
            res.status(404).send('Blog post not found');
        }
    });
});

/**
 * @desc Route to handle adding a comment to a blog post
 */
router.post('/blogpost/:id/add-comment', (req, res, next) => {
    const blogpostId = req.params.id;
    const { username, body } = req.body;
    const date = new Date();
    const formattedDate = date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: undefined,
        hour12: false
    }).replace(',', '');

    // Insert the comment into the database
    const query = "INSERT INTO comments (username, body, date, blogpost_id) VALUES (?, ?, ?, ?);";
    const queryParameters = [username, body, formattedDate, blogpostId];

    global.db.run(query, queryParameters, function (err) {
        if (err) {
            next(err); // Send the error to the error handler
        } else {
            // Redirect back to the blog post page after adding comment
            res.redirect(`/blogpost/${blogpostId}`);
        }
    });
});

//       EXTENSIONS       //

// THE FOLLOWING BLOCK OF CODE HANDLES LOGIN FUNCTIONALITY

/**
 * @desc Displays login form
 */
router.get("/login", (req, res) => {
    res.render("login.ejs", {user: req.session.user});
});


/**
 * @desc Handle user login
 */
router.post("/login", (req, res, next) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ?";

    global.db.get(query, [username], (err, user) => {
        if (err) {
            next(err); // Send the error on to the error handler
        } else if (user) {
            // Compare the provided password with the hashed password in the database
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    next(err); // Send the error on to the error handler
                } else if (isMatch) {
                    // Save the user_id in the session
                    req.session.user_id = user.user_id;
                    req.session.user = user.username;
                    res.redirect(`/${username}/author-home`);
                } else {
                    res.render("login.ejs", { error: "Invalid username or password" });
                }
            });
        } else {

            res.render("login.ejs", { error: "Invalid username or password" });
        }
    });
});


/**
 * @desc Handling the sign-out action. 
 * This route destroys the session and redirects the user to the home page.
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // clear the cookie
        res.redirect('/');
    });
});

/**
 * @desc Displays a page with a form for creating a new user (author) record
 */
router.get("/users/add-user", (req, res) => {
    res.render("add-user.ejs", {user: req.session.user});
});

/**
 * @desc Add a new user to the database based on data from the submitted form
 */
router.post("/users/add-user", (req, res, next) => {
    const { username, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.render("add-user.ejs", { error: "Passwords do not match", user: req.session.user });
    }

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            next(err); // Send the error to the error handler
        } else {
            const query = "INSERT INTO users (username, password) VALUES (?, ?);";
            const query_parameters = [username, hash];

            // Execute the query and send a confirmation message
            global.db.run(query, query_parameters, function (err) {
                if (err) {
                    next(err); // Send the error to the error handler
                } else {
                    res.redirect('/reader');
                }
            });
        }
    });
});

/**
 * @desc Displays about page
 */
router.get("/about", (req, res) => {
    res.render("about.ejs", {user: req.session.user});
});

/**
 * @desc Route to handle likes
 */
router.post('/blogpost/:id/like', (req, res, next) => {
    const blogpostId = req.params.id;

    const query = "UPDATE blogpost SET likes = likes + 1 WHERE blogpost_id = ?;";
    global.db.run(query, [blogpostId], function (err) {
        if (err) {
            next(err);
        } else {
            const getLikesQuery = "SELECT likes FROM blogpost WHERE blogpost_id = ?;";
            global.db.get(getLikesQuery, [blogpostId], (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.json({ likes: row.likes });
                }
            });
        }
    });
});

// Export the router object so index.js can access it
module.exports = router;
