const express = require('express');
const app = express();
const env = require('dotenv');
env.config();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;
const USER_MAIL = process.env.USER_MAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;
const ADMIN_MAIL = process.env.ADMIN_MAIL;
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));


let userCount = 0;
app.use((req, res, next) => {
    userCount++;
    next();
})



mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true
    // useFindAndModify: false
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const ItemSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    address: String,
    query: String,
});

const Item = mongoose.model('Form_Data', ItemSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: USER_MAIL,
        pass: USER_PASSWORD,
    },
});

app.get('/', (req, res) => {
    res.send('Hello World!');
    connectDatabase();
});

app.get('/api/form', async (req, res) => {
    try {
        const items = await Item.find();
        res.json({
            success: true,
            items
        })
    }
    catch (error) {
        res.status(500).json({
            success: false, message: error
        })
    }
})
app.post('/api/form', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').not().isEmpty(),
    check('phone', 'Phone is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('query', 'Query is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }


    const { name, email, phone, address, query } = req.body;
    const newItem = new Item({ name, email, phone, address, query });
    try {
        await newItem.save();

        const mailOptions = {
            from: USER_MAIL,
            to: ADMIN_MAIL, // replace with admin's email address
            subject: 'New Form Submission',
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}\nQuery: ${query}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.json({
            success: true, message: 'Form Submitted'
        })
    }
    catch (error) {
        res.status(500).json({
            success: false, message: error
        })
    }

})

app.get('/api/userCount', (req, res) => {
    res.json({
        success: true,
        userCount
    })
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
