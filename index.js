
const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const env = require('dotenv');
env.config();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 8000;
const URI = process.env.MONGODB_URI;

//import models
const userModel = require('./models/userModel');
const formModel = require('./models/formModel');

app.use(express.json());
app.use(cors());
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

app.get('/', async (req, res) => {
    res.send("Hello GST Suvidha Here!")
})

// Register
app.post('/register', async (req, res) => {
    const user = req.body;
    console.log(user);
    try {
        const existingUser = await userModel.findOne({ email: user.email });
        if (existingUser) return res.status(400).send({ message: `${user.email} is already registered, Please use another email.` });
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;

        if (!passwordRegex.test(user.password)) {
            return res.status(400).send({
                message: "Password must be at least 8 characters long and contain at least one capital letter, one number, and one special character."
            });
        }
        bcrypt.genSalt(10, (err, salt) => {
            if (err) throw err;
            else {
                bcrypt.hash(user.password, salt, async (err, hashedPassword) => {
                    if (err) throw err;
                    else {
                        user.password = hashedPassword;
                        try {
                            const createdUser = await userModel.create(user);
                            res.status(201).send({ message: "User created successfully!", createdUser });
                        }
                        catch (error) {
                            res.status(500).send({ message: "Unable to create User", error });
                        }
                    }
                })
            }
        })
    }
    catch (error) {
        return res.status(500).send(`Server error ${error}`);
    }
})

// Login

app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const user = await userModel.findOne({ email: email })
        if (user) {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    jwt.sign({ email: email }, "jwt-secret-key", (err, token) => {
                        if (!err) {
                            console.log("Token: ", token);
                            res.send({ token: token, message: "Logged In Successfully!", name: user.name, id: user._id });
                        }
                        else {
                            console.log("Error in generating token");
                            res.status(500).send({ message: "Error in generating token" });
                        }
                    })
                }
                else {
                    res.status(403).send({ message: "Invalid Password" });
                }
            })
        }
        else {
            res.status(404).send({ message: "Invalid Email" });
        }
    }
    catch (error) {
        res.status(500).send({ message: "Error in Logging In", error });
    }
})

// User count
app.get('/userCount', async (req, res) => {
    try {
        const userCount = await userModel.countDocuments();
        res.json({ userCount });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Contact Form
app.post('/form', async (req, res) => {
    const formDetails = req.body;
    console.log(formDetails);
    try {
        const createdFormData = await formModel.create(formDetails);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'gstsuvidhakendraghvendra@gmail.com', // Replace with your email
                pass: 'xhvv spbp idnq upat', // Replace with your email password or use an app-specific password
            },
        });

        const mailOptions = {
            from: 'gstsuvidhakendraghvendra@gmail.com',
            to: 'suryatomar303@gmail.com', // Replace with the admin's email address
            subject: 'New Form Submission',
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: Arial, sans-serif;
                }
                .container {
                  max-width: 600px;
                  margin: auto;
                  padding: 20px;
                  background-color: #14213d;
                }
                h1 {
                  color: #fca311;
                }
                p {
                  color: white;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>New Form Submission</h1>
                <p><strong>Name:</strong> ${formDetails.name}</p>
                <p><strong>Email:</strong> ${formDetails.email}</p>
                <p><strong>Phone:</strong> ${formDetails.phone}</p>
                <p><strong>Address:</strong> ${formDetails.address}</p>
                <p><strong>Query:</strong> ${formDetails.query}</p>
              </div>
            </body>
            </html>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).send({ message: "Form Submitted Successfully!", createdFormData });
    }
    catch (error) {
        console.error({ error: "Error in form", error });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
