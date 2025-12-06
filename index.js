const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const hbs = require("hbs");
const multer = require("multer");

const {CModel} = require("./scripts/model");

const app = express();
const prisma = new PrismaClient();
const PORT = 8080;

const model = new CModel(prisma);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('style'))
app.use(express.static('uploads'))
app.set("view engine", "hbs"); // On définit le moteur de template que Express va utiliser
app.set("views", path.join(__dirname, "views")); // On définit le dossier des vues (dans lequel se trouvent les fichiers .hbs)
hbs.registerPartials(path.join(__dirname, "views", "partials")); // On définit le dossier des partials (composants e.g. header, footer, menu...)

//helpers
hbs.registerHelper("Year", (date) => {
    return new Date(date).getFullYear();
});

//route vers la liste de des genres
app.get("/genres", async (req, res) => {
    const genres = await prisma.genre.findMany();
    res.render("genres/index", { genres });
})


app.get("/games/add", async (req, res) => {
    const editors = await prisma.editor.findMany();
    const genres = await prisma.genre.findMany();

    res.render(path.join("games","add"),{
        editors,
        genres
    });
})


// Configuration du stockage des fichiers
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post("/games", upload.single("file"), async (req, res) => {
    let {title, releaseDate, desc, genreId, editorId : editorName}  = req.body;

    genreId = +genreId;
    const editorId = await model.GetIDFromEditorName(editorName);
    if(editorId === -1)
    {
        //FAUT AJOUTER UN EDITOR
    }

    const name = req.file.filename;

    await prisma.game.create({
        data : {
            title,
            releaseDate : new Date(releaseDate),
            desc,
            genreId,
            editorId,
            highlighted : false,
            filename : `${name}`
        }
    })

    res.redirect("/");
});

//--------------------------------------------------------------------------------
app.get("/genres/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const genre = await prisma.genre.findUnique({
            where: {
                id: Number(id)
            }, include: {
                Game: true
            }
        });

        res.render("genres/detail", {
            genre,
            games: genre.Game
        });

    } catch (err) {
        res.status(404).redirect("/zx");
    }

})


app.get("/", async (req, res) => {

    const games = await prisma.game.findMany({
        where: {
            highlighted: true,
        }
    });

    res.render("index",{
        games,
        title : "Accueil - Vapeur",
        // styles : [{
        //     href : "test.css"
        // }],
    });
})

app.get("/games", async (req, res) => {
    const games = await prisma.game.findMany();

    res.render("games/list",{
        games,
        title : "Accueil - Vapeur",
        // styles : [{
        //     href : "test.css"
        // }],
    });
})

//Affiche l'editeur qui correspond à l'id
app.get("/editeurs/:id", async (req, res) => {
    try{
        console.log(req.params.id);
        const editeur = await prisma.editor.findFirst({
            where: {
                id: Number(req.params.id),
            },
            include: {
                Game: true //Récupère tous les jeux liés à l'éditeur
            }
        });

        res.render("editors/detail", {
            editeur,
            games: editeur.Game,
            title: `Editeur : ${editeur.name}`
        });

    } catch (err){//Gère l'erreur quand l'id n'existe pas
        res.status(404).send("Cet éditeur n'existe pas !");
    }
})


app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, "404.html"));
})

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Quelque chose s'est mal passé !");
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});