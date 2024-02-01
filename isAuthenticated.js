const jwt = require('jsonwebtoken');
const isAuthenticated = (req, res, next) => {
    if (!req.headers.authorization) res.status(401).send({ message: "Please login to access this resource" });
    else {
        const token = req.headers.authorization.split(' ')[1];
        console.log(token);
        jwt.verify(token, "jwt-secret-key", (err, data) => {
            if (!err) {
                console.log(data);
                next();
            }
            else {
                res.status(403).send({ message: "Invalid token" });
            }
        })
    }
}
module.exports = isAuthenticated;