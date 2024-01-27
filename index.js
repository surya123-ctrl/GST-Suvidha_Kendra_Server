
const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const env = require('dotenv');
env.config();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 8000;
const URI = process.env.MONGODB_URI;

//import models
const userModel = require('./models/userModel');
const { use } = require('passport');

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
        if (existingUser) return res.status(400).send({ message: `${user.email} is already registered please use another email` });
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
    // console.log(user);
    // res.send("Done");
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
