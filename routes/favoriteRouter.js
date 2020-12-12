const express = require('express');
const bodyParser = require("body-parser");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");
const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());
favoriteRouter.route("/")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
        .populate("user")
        .populate("campsites")
        .then(favorites => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorites);
        })
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        Favorite.findOne({user: req.user._id})
            .then(dbFavorite => {
                if(dbFavorite){
                    req.body.forEach(reqFavorite => {
                        if (!dbFavorite.campsites.includes(reqFavorite)) {
                            dbFavorite.campsites.push(reqFavorite)
                        }
                    });
                    dbFavorite.save()
                        .then(dbFavorite => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(dbFavorite);
                        })
                        .catch(err => name(err));
                } else {
                    Favorite.create({user: req.user._id, campsites: req.body})
                        .then(dbFavorite => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(dbFavorite);
                        })
                }
            })
            .catch(err => next(err))
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites");
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({"user": req.user._id})
        .then((favorite) => {
            res.statusCode = 200;
            if(favorite){
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
            } else {
                res.setHeader("Content-Type", "application/json");
                res.end("You do not have any favorites to delete");
            }
        }).catch(err = next(err));
    });
favoriteRouter.route("/:campsiteId")
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("GET operation not supported on /favorites/"+ req.params.campsiteId);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        Favorite.findOne({user: req.user._id})
        .then((favorite) => {
            if (favorite) {
                req.body.forEach(favorite => {
                    if (!favorite.campsites.includes(req.params.campsiteId)) {
                        favorite.campsites.push(req.params.campsiteId);
                    } else {
                        console.log("You already have a favorite campsite in this list")
                    }
                });
            }
            else {
                Favorite.create({"user": req.user._id, "campsites": [req.params.campsiteId]})
                .then((favorite) => {
                    console.log("Favorite Created", favorite);
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                })
            }
        });
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites/"+ req.params.campsiteId);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
   
    Favorite.findOne({user: req.user._id})
        .then(favorite => {
            if (favorite) {
                const index = favorite.campsites.indexOf(req.params.campsiteId)
                if (index >= 0) {
                    favorite.campsites.splice(index, 1)
                }
                favorite.save()
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json")
                        res.json(favorite)
                    })
                    .catch(err => next(err))
            }
            else {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite)
            }
        });
    });
module.exports = favoriteRouter;