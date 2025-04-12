const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const { sequelize } = require('./models/index');
const routes = require('./routes/index');
const multer = require('multer');
require('dotenv').config();

const app = express();
require('./config/passport')(passport);

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());


app.use('/api/v1', routes);

appPort = process.env.APP_PORT || 5000;

sequelize.sync().then(() => {
    app.listen(appPort, () => {
        console.log(process.env.APP_NAME + ' Server running at port: ' + appPort);
    });
});