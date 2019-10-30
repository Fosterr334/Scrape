// grabbing the libraries

// grabs express framework to build server
var express = require("express");
// grabs mongoose framework to create the database
var mongoose = require("mongoose");
// grabs axios to send http requests
var axios = require("axios");
// grabs morgan for logging requests in the terminal
var logs = require("morgan");
// grabs cherrio to scrap websites
var cheerio = require("cheerio");
// grabs the templates to store the scraped data
var db = require("./models");

// The port for localhost
var PORT = 3000;

//Starts express
var app = express();

// Constructor for placing article information in before sending it to the database
var ArticleConstruct = function (headline1, summary1, link1) {
    this.headline = headline1;
    this.summary = summary1;
    this.link = link1;
}
//Temp Globals
var tempH = [];
var tempS = [];
var tempL = [];
var counter = 0
var counterTwo = 0


//Holds are Article Objects
var articleArray = [];

//Middleware Mainly what Morgan is for
// using express .use() function to use morgan as a callback
// moragn is using the dev which optputs colored rsponces from the server
app.use(logs("dev"));
//Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//Make public a static folder
app.use(express.static("public"));

//Connect to the mongo DB with mongoose
mongoose.connect("mongodb://localhost/scrapedDB", { useUrlNewParser: true })

    // Create the routes
    /
    app.get("/scraping", function (req, res) {
        mongoose.connection.db.dropDatabase;
        axios.get("https://www.roguerocket.com/")
            .then(function (response) {
                var $ = cheerio.load(response.data);
                //gets links from the page, had to be seperated because the link doesnt have the same parent
                $("div ul li")
                    .each(function (i, element) {
                        var results = {};
                        var check = "https://roguerocket.com/2019";
                        var x = 0;

                        results.link = $(this)
                            .children("a")
                            .attr("href")
                        if (results.link.search(check) === 0) {
                            //pushes the link into a global array
                            tempL.push(results.link);
                        }
                        axios.get("https://www.roguerocket.com/")
                            .then(function (response) {
                                //makes the function only run once since its nested in a loop to bypass async problems
                                if (counter < 1) {
                                    counter++;
                                    var $ = cheerio.load(response.data);
                                    //get the headline and summary
                                    $("div")
                                        .each(function (i, element) {
                                            var results = {};

                                            results.headline = $(this)
                                                .children("h2")
                                                .text();
                                            results.summary = $(this)
                                                .children("p")
                                                .text();
                                            if (results.headline != "" && results.summary != "") {
                                                //pushes the link into a global arrays
                                                tempH.push(results.headline);
                                                tempS.push(results.summary);
                                            }
                                        });
                                }
                            })
                            //creates a object with the the global arrays and then store the object in DB
                            .then(function () {
                                //makes the function only run once since its nested in a loop to bypass async problems
                                if (counterTwo < 1) {
                                    counterTwo++
                                    for (i = 1; i < 6; i++) {
                                        var newArticle = new ArticleConstruct(tempH[i], tempS[i], tempL[i - 1]);
                                        // Create a new Article using the newArticle object built from scraping
                                        db.Article.create(newArticle)
                                            .then(function (newArticle) {
                                                // View the added result in the console
                                                console.log(newArticle);
                                            })
                                            .catch(function (err) {
                                                // If an error occurred, log it
                                                console.log(err);
                                            });
                                    }
                                }
                            })
                    });
                res.send("Done Scraping")
            })
    })

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});