const express = require("express");
const { NextFunction, Request, Response } = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const path = require("path");
const hbs = require("hbs");
// const multer = require("multer");
const {CModel} = require("./scripts/model.js");
const {init} = require("./scripts/config_hbs.js");
const {InitTest} = require("./scripts/test.js");
// const fs = require("fs");

const app = express();
const prisma = new PrismaClient();

//Ne pas toucher
const PORT = +(process.env.PORT || 8080);


const model = new CModel(prisma);
InitTest(app,prisma,model);
model.GenresCreation();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.set("view engine", "hbs"); // On définit le moteur de template que Express va utiliser
app.set("views", path.join(__dirname, "views")); // On définit le dossier des vues (dans lequel se trouvent les fichiers .hbs)
init(hbs);

const getUrl = () => {
    if(process.env.PROD === "non")
    {
        return `${process.env.HOST}:${process.env.PORT}`;
    }
    return `${process.env.HOST}`;

}


const genre = require("./scripts/Indexs/indexGenre");
const game = require("./scripts/Indexs/indexGame");
const editor = require("./scripts/Indexs/indexEditor");

genre(app, prisma);
game(app, prisma, model);
editor(app, prisma, model);

///////////////////////////////PAGE D'ACCUEIL
//jeux mis en avant
app.get("/", async (req, res) => {

    /**@type {import("./scripts/type").games_t}*/
    const games = await prisma.game.findMany({
        where: {
            highlighted: true,
        },
        orderBy : [{
            title : 'asc'
        }]
    });

    res.render("index",{
        games,
        pageTitle: "Accueil - Vapeur",
        styles : [
            "gameList.css",
            "editButtons.css"
        ]
    });
})

///////////////////////////////GESTION DES ERREURS

app.use((req, res, next) => {
    res.status(404).render("404", {
        message : "La page que vous cherchez n'existe pas !"
    });
})

/**
 * Fonction utilisée pour les erreurs d'express
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * */
const errorHandler = (err, req, res, next) => {
    console.log(err.stack);
    res.render("505");
}

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})