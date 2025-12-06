const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const hbs = require("hbs");
const {Instance} = require("hbs");

const multer = require("multer");

const {CModel} = require("./scripts/model");
const {init} = require("./scripts/config_hbs");

const app = express();
const prisma = new PrismaClient();
const PORT = 8080;

const model = new CModel(prisma);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('style'))
app.use(express.static('uploads'))
app.set("view engine", "hbs"); // On définit le moteur de template que Express va utiliser
app.set("views", path.join(__dirname, "views")); // On définit le dossier des vues (dans lequel se trouvent les fichiers .hbs)

init(hbs);

//route vers la liste de des genres
app.get("/genres", async (req, res) => {
    const genres = await prisma.genre.findMany();
    res.render("genres/index", { genres });
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
            highlighted : true,
            filename : `${name}`

        }
    })

    res.redirect("/");
});

app.get("/games/add", async (req, res) => {

    const {editors,genres} = await model.GetEditorsAndGenres();
    res.render(path.join("games","add"),{
        editors,
        genres
    });
})

app.post("/games/:id/edit", upload.single("file"), async (req, res) => {

    const game = await prisma.game.findFirst({
        where: {
            id: +req.params.id,
        }
    })

    let {title, releaseDate, desc, genreId, editorId : editorName}  = req.body;

    genreId = +genreId;
    const editorId = await model.GetIDFromEditorName(editorName);
    if(editorId === -1)
    {
        //FAUT AJOUTER UN EDITOR
    }

    const name = req.file ? req.file.filename : game.filename;

    await prisma.game.update({
        data : {
            title,
            releaseDate : new Date(releaseDate),
            desc,
            genreId,
            editorId,
            highlighted : game.highlighted,
            filename : `${name}`
        },

        where : {
            id : game.id
        }
    })

    res.redirect("/");
})

app.get("/games/:id/edit", async (req, res) => {
    const id = +req.params.id;

    /**
     * @type {{
     *     id : number,
     *     title : string,
     *     desc : string,
     *     releaseDate : Date,
     *     genre : { name : string},
     *     genreId : number,
     *     editor : {name : string},
     *     editorId : string,
     *     highlighted : boolean,
     *     filename : string
     * }}
     * */
    const game = await prisma.game.findFirst({
        where : {
            id
        },
        include : {
            editor : true,
            genre : true
        }
    });


    const {editors,genres} = await model.GetEditorsAndGenres();

    if(!game)
    {
        res.status(404).redirect('/');
        return;
    }

    /**@type {Date} */
    const date = game.releaseDate;


    console.log(game.genre);
    res.render("games/edit", {
        form_title : `Modification du jeu ${game.title}`,
        title : game.title,
        desc : game.desc,
        genreName : game.genre.name,
        editorName : game.editor.name,
        editors,
        genres,
        date: date.toISOString().split("T")[0],
        submit_text : "Modifier",
        action:`/games/${game.id}/edit`
    })
})

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

//Affiche l'editeur qui correspond à l'id
app.get("/editors/:id", async (req, res) => {
    try{
        console.log(req.params.id);
        const editor = await prisma.editor.findFirst({
            where: {
                id: Number(req.params.id),
            },
            include: {
                Game: true //Récupère tous les jeux liés à l'éditeur
            }
        });

        res.render("editors/detail", {
            editeur: editor,
            games: editor.Game,
            title: `Editeur : ${editor.name}`
        });

    } catch (err){//Gère l'erreur quand l'id n'existe pas
        res.status(404).redirect("/zx");
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