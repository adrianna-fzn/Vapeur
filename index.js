const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const hbs = require("hbs");

const app = express();
const prisma = new PrismaClient();
const PORT = 8080;


app.set("view engine", "hbs"); // On définit le moteur de template que Express va utiliser
app.set("views", path.join(__dirname, "views")); // On définit le dossier des vues (dans lequel se trouvent les fichiers .hbs)
hbs.registerPartials(path.join(__dirname, "views", "partials")); // On définit le dossier des partials (composants e.g. header, footer, menu...)





app.get("/", (req, res) => {
    res.send("Hello World!");
})






app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, "404.html"));
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Quelque chose s'est mal passé !");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});