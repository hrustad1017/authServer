var User = require('../models/user');
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
var crypto = require('crypto');
var fs     = require('fs');
var nodemailer = require('nodemailer');

// add a route for doing a remote login by link with api key
module.exports = function(app) {
    app.post('/register', async function(req, res) {
        // console.log(req.body);
        let salt;
        let hash;
        // console.log(req.body.username);
        var newUser = new User(req.body.name, req.body.email, req.body.username, req.body.password);
        // test to see if user gets built correctly
        console.log(newUser);
        // console.log(newUser.name);
        // console.log(newUser.email);
        // console.log(newUser.username);
        // console.log(newUser.password);

        newUser.password = encryptPass(newUser.password, salt, hash);

        console.log(newUser.password);

        const valid = validatePassword(req.body.password, newUser.password.salt, newUser.password.hash);
        console.log(valid);

        if (valid) {
            let user;
            if (req.body.parent === 'NONE') {
                await createAdminUser(newUser).then(async function(result) {
                    console.log(result);
                    var random = await crypto.randomBytes(20);
                    var token = random.toString('hex');
                    await addEmailToken(result, token);
                    sendConfirmEmail(req.body.email, req.headers.host, token, req);
                });
            } else {
                await createUser(newUser, req.body.parent, req.body.level).then(async function(result) {
                    console.log(result);
                    var random = await crypto.randomBytes(20);
                    var token = random.toString('hex');
                    await addEmailToken(result, token);
                    sendConfirmEmail(req.body.email, req.headers.host, token, req);
                });
                // console.log(req.body.user.parent);
            }
        }

        function validatePassword(pass, salt, hash) {
            var newHash = crypto.pbkdf2Sync(pass, salt, 1000, 64, 'sha512').toString('hex');
            return hash === newHash;
        }

        function encryptPass(pass, salt, hash) {
            salt = crypto.randomBytes(16).toString('hex');
            hash = crypto.pbkdf2Sync(pass, salt, 1000, 64, 'sha512').toString('hex');
            const saltHash = {salt: salt, hash: hash};
            return saltHash;
        }

        async function createUser(newUser, par3nt, l3v3l) {
            const remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');
            return await remoteUsers.put({
                _id: 'user' + newUser.username,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                parent: par3nt,
                userDB: 'userDB' + par3nt,
                level: l3v3l,
                confirmed: false,
                status: 'VALID',
                include_docs: true
            }).then(function(res) {
                return res;
            }).catch(function(err) {
                console.log('error creating user');
                console.log(err);
                return;
            });
        }
        
        async function createAdminUser(newUser) {
            const remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');
            return await remoteUsers.put({
                // add username
                _id: 'user' + newUser.username,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                userDB: 'userDB' + newUser.username,
                level: 'ADMIN',
                confirmed: false,
                status: 'VALID',
                include_docs: true
            }).then(function(res) {
                return res;
            }).catch(function(err) {
                console.log('error creating admin user');
                console.log(err);
                return;
            });
        }

        // needs to be tested
        async function addEmailToken(user, token) {
            const remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');
            const doc = await remoteUsers.get(user.id).then(function(result) {
                result.emailToken = token;
                return result;
            }).catch(function(err) {
                console.log('error getting user in addEmailToken');
                console.log(err);
                return;
            });

            return await remoteUsers.put(doc).then(function(result) {
                return result;
            }).catch(function(err) {
                console.log("error updating email token");
                console.log(err);
                return;
            });
        }

        function sendConfirmEmail(email, host, token, request) {
            var uname = process.env.SENDGRIDUNAME;
            var pword = process.env.SENDGRIDPASS;

            var smtpTransport = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: uname,
                    pass: pword
                }
            });

            var mailOPtions = {
                to: email,
                from: 'confirmEmail@demo.com',
                subject: 'Email Confirmation',
            text: 'Hello,\n\n' +
                'This is an email to confirm the email address for: ' + request.body.username +
                '. Click the link to confirm.\n' +
                'http://' + host + '/confirm/' + token
            };
            
        smtpTransport.sendMail(mailOPtions, function(err) {
            res.json({status: 'success', message: 'Success! Your email has been confirmed.'});
            if (err) {
                console.log('error sending mail');
                console.log(err);
            }
        });
        }

    });

    app.post('/login', async function(req, res) {
        if (req.session.key) {
        console.log('session already active');
        req.session.destroy(function(err) {
            if (err) {
                return console.log(err);
            }
        });
        }

        const user = await getUser(req.body.username);
        console.log(user);

        const valid = validatePassword(req.body.password, user.password.salt, user.password.hash);

        if (valid) {
            login(req.session, user);
        } else {
            console.log('password invalid');
        }

        res.send(user);

        async function login(session, user) {
            session.key = user;
            console.log(session);
            console.log('username and password match a user');
        }

        function validatePassword(pass, salt, hash) {
            var newHash = crypto.pbkdf2Sync(pass, salt, 1000, 64, 'sha512').toString('hex');
            return hash === newHash;
        }

        async function getUser(username) {
            const remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');
            return await remoteUsers.get('user' + username).then(function(results) {
                return results;
            }).catch(function(err) {
                console.log('error getting user');
                console.log(err);
                return;
            });
        }

    });

    app.get('/confirm/:token', async function(req, res) {
        var remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');

        await remoteUsers.createIndex({
            index: {
                fields: ['_id', 'emailToken']
            }
        }).then(function(res) {
            return res;
        }).catch(function(err) {
            console.log('error creating index');
            console.log(err);
            return;
        });

        var result =  await remoteUsers.find({
            selector: {emailToken: req.params.token},
            fields: ['_id', 'emailToken'],
            sort: ['_id']
        }).then(function (result) {
            return result;
        }).catch(function(err) {
            console.log('error querying index');
            console.log(err);
            return;
        });

        var user = await remoteUsers.get(result.docs[0]._id).then(function(result) {
            result.confirmed = true;
            result.emailToken = undefined;
            return result;
        }).catch(function(err) {
            console.log('error getting user');
            console.log(err);
            return;
        });

        await remoteUsers.put(user).then(function(result) {
            sendEmailConfirmed(user.email);
            return result;
        }).catch(function(err) {
            console.log('error updating email confirmation');
            console.log(err);
            return;
        });

        function sendEmailConfirmed(email) {
            var uname = process.env.SENDGRIDUNAME;
            var pword = process.env.SENDGRIDPASS;

            var smtpTransport = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: uname,
                    pass: pword
                }
            });

            var mailOPtions = {
                to: email,
                from: 'confirmEmail@demo.com',
                subject: 'Email Confirmation',
                text: 'Thank you, your email address has been confirmed.'
            };
            
            smtpTransport.sendMail(mailOPtions, function(err) {
                res.json({status: 'success', message: 'Success! Your email has been confirmed.'});
                if (err) {
                    console.log('error sending confirmation success mail');
                    console.log(err);
                }
            });
        }
    });

    app.post('/logout', function(req, res) {
        if(req.session.key) {
            req.session.destroy(function(err) {
                if (err) {
                    return console.log(err);
                }
            });
        }
    });

    // app.route('/forgotPasswordResponse').post(forgotPasswordResponse);

    app.post('/forgotPasswordResponse', async function(req, res) {
        forgotPasswordResponse(req, res);
    });

    async function forgotPasswordResponse(req, res) {

        var random = await crypto.randomBytes(20);
        var token = random.toString('hex');

        var remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');
        var username = req.body.username;
        var email = req.body.email;
        var userID = 'user' + username;

        var user = await remoteUsers.get(userID).then(function(res) {
            res.resetPasswordToken = token;
            res.resetPasswordExpires = Date.now() + 3600000;
            return res;
        }).catch(function(error) {
            console.log('error getting user');
            console.log(error);
            return;
        });

        console.log(user);

        await remoteUsers.put(user).then(function(res) {
            return res;
        }).catch(function(error) {
            console.log('error updating reset password');
            console.log(error);
            return;
        });

        var uname = process.env.SENDGRIDUNAME;
        var pword = process.env.SENDGRIDPASS;

        var smtpTransport = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: uname,
                pass: pword
            }
        });

        const mailOPtions = {
            to: email,
            from: 'passwordreset@demo.com',
            subject: 'Password Reset',
            text: 'You are recieving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste the link into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };

        smtpTransport.sendMail(mailOPtions, function(err) {
            console.log('Hi: ' + email);
            res.json({status: 'success', message: 'An e-mail has been sent to ' + email + ' with further instructions.'});
            if (err) {
                console.log(err);
            }
        });

    }

    app.route('/reset/:token').get(resetPasswordResponse);

    async function resetPasswordResponse(req, res) {
        var remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');

        await remoteUsers.createIndex({
            index: {
                fields: ['_id', 'resetPasswordToken', 'resetPasswordExpires']
            }
        }).then(function(res) {
            return res;
        }).catch(function(err) {
            console.log('error creating index');
            console.log(err);
            return;
        });

        await remoteUsers.find({
            // look for greater than conditional like mongo
            selector: {resetPasswordToken: req.params.token},
            fields: ['_id', 'resetPasswordToken', 'resetPasswordExpires'],
            sort: ['_id']
        }).then(function (result) {
            if (result.docs[0].resetPasswordExpires > Date.now()) {
                fs.readFile("views/passReset.html", function(error, data) {
                    console.log("reset page working");
                    if(error) {
                        console.log('error reading pass reset page');
                        console.log(error);
                        res.writeHead(404);
                        res.write('Contents you are looking for are not found');
                    } else {
                        res.write(data);
                    }
                    res.end();
                });
                return result;
            } else {
                res.write('Reset token is expired');
                console.log('token is expired');
            }
            
        }).catch(function(err) {
            console.log('error querying index');
            console.log(err);
            return;
        });

        // console.log(result);
    }

    app.route('/reset/:token').post(setPasswordResponse);

    async function setPasswordResponse(req, res) {
        var remoteUsers = new PouchDB(process.env.COUCHCONNECT + '/auth-test-users');
        await remoteUsers.createIndex({
            index: {
                fields: ['_id', 'resetPasswordToken']
            }
        }).then(function(res) {
            return res;
        }).catch(function(err) {
            console.log('error creating index');
            console.log(err);
            return;
        });

        var result =  await remoteUsers.find({
            selector: {resetPasswordToken: req.params.token},
            fields: ['_id', 'resetPasswordToken'],
            sort: ['_id']
        }).then(function (result) {
            return result;
        }).catch(function(err) {
            console.log('error querying index');
            console.log(err);
            return;
        });

        let salt;
        let hash;

        var encPass = encryptPass(req.body.Password, salt, hash);

        function encryptPass(pass, salt, hash) {
            salt = crypto.randomBytes(16).toString('hex');
            hash = crypto.pbkdf2Sync(pass, salt, 1000, 64, 'sha512').toString('hex');
            const saltHash = {salt: salt, hash: hash};
            return saltHash;
        }

        console.log(result.docs[0]._id);

        var user = await remoteUsers.get(result.docs[0]._id).then(function(result) {
            result.password = encPass;
            result.resetPasswordToken = undefined;
            result.resetPasswordExpires = undefined;
            return result;
        }).catch(function(err) {
            console.log('error getting user');
            console.log(err);
            return;
        });

        await remoteUsers.put(user).then(function(result) {
            return result;
        }).catch(function(err) {
            console.log('error updating password');
            console.log(err);
            return;
        });

        var uname = process.env.SENDGRIDUNAME;
        var pword = process.env.SENDGRIDPASS;

        var smtpTransport = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: uname,
                pass: pword
            }
        });

        var mailOPtions = {
            to: user.email,
            from: 'passwordreset@demo.com',
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account' + user.username +
                ' has just been changed.\n'
            };
            
        smtpTransport.sendMail(mailOPtions, function(err) {
            res.json({status: 'success', message: 'Success! Your password has been changed.'});
            if (err) {
                console.log('error sending mail');
                console.log(err);
            }
        });

        }

        // ================================================
        // Middleware examples, not actually implemented

        function isConfirmed(req, res, next) {
            var confirmed = req.session.confirmed;
            console.log(confirmed);
            if (confirmed === true) {
                next();
            } else {
                console.log('email is not confirmed');
                return;
            }
        }

        function isAdmin(req, res, next) {
            var level = req.session.level;
            console.log(level);
            if (level === 'ADMIN') {
                next();
            } else {
                console.log('You must be admin to do that');
                return;
            }
        }

        function isLoggedIn(req, res, next) {
            if (req.session.key) {
                next();
            } else {
                console.log('You must be logged in to do that');
                return;
            }
        }
        
    }
