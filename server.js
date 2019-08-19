const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

app.use(function middleware(req, res, next) {
    console.log(req.method + ' ' + req.path + ' - ' + req.ip)
    next();
});

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

//create user schema and user table
var userTableSchema = new mongoose.Schema({
    "username": String
});
var ExerciseUserTable = mongoose.model("ExerciseUser", userTableSchema);


//create exercise schema and exercise table
var ExerciseDetailsSchema = new mongoose.Schema({
    description: String,
    duration: Number,
    date: Date,
    userId: String
});

var ExerciseDetailsTable = mongoose.model("ExerciseDetails", ExerciseDetailsSchema);


app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

//create user and return object with username and id
app.post('/api/exercise/new-user', function (req, res, next) {
    const username = req.body.username;
    //const userId = generateUniqueId(7);   
    ExerciseUserTable.findOne({ "username": username }, function (err, datauser) {
        //check if username exists first
        if (datauser) {
            res.send("This username is already taken")
        } else {

            //saving username and id in db in order to be able to get it after          
            const newUsernameAndId = new ExerciseUserTable({
                "username": username
            });

            newUsernameAndId.save();

            console.log(newUsernameAndId);
            res.json({ "username": newUsernameAndId.username, "Id": newUsernameAndId._id });
        }
    });
});


//get all users and return an array with username and id for each user
app.get('/api/exercise/users', function (req, res) {
    ExerciseUserTable.find({}, function (error, users) {
        if (error)
            console.log('Cannot find users');
        else {
            var responses = users.map(UserMap);
            res.send(responses);
        }
    });
});

// function to get username and userid only
function UserMap(user) {
    return {
        _id: user._id,
        username: user.username
    }
}


//add exercise to any user
app.post('/api/exercise/add', function (req, res) {
    const username = req.body.username;
    const userId = req.body.userId;
    const description = req.body.description;
    const duration = req.body.duration;
    const requiredFieldsToComplete = userId && description && duration;

    if (requiredFieldsToComplete) {
        var user = ExerciseUserTable.findById(userId, function (error, user) {
            if (error) {
                res.send(error);
            }
            if (user) {
                const date = (req.body.date) ? new Date(req.body.date) : new Date();
                const newExercise = {
                    description: description,
                    duration: duration,
                    date: date,
                    userId: userId
                };

                const newExerciseDetails = new ExerciseDetailsTable(newExercise);

                newExerciseDetails.save();

                res.json({
                    description: newExerciseDetails.description,
                    duration: newExerciseDetails.duration,
                    date: newExerciseDetails.date,
                    userId: newExerciseDetails.userId,
                    username: user.username

                });

            }
        });

    } else {
        res.send("Please complete Required fields!")
    }
});

//get user's full erxercise log or part of a log and return user object
//with an array of log and count(exercises count)




const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
});
