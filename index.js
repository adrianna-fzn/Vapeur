const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const hbs = require("hbs");
const multer = require("multer");

const {CModel} = require("./scripts/model");
const {init} = require("./scripts/config_hbs");

const app = express();
const prisma = new PrismaClient();
const PORT = 8080;

const model = new CModel(prisma);

model.GenresCreation();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('style'))
app.use(express.static('uploads'))
app.use(express.static("pageScript"));
app.use(express.static("public"));
app.set("view engine", "hbs"); // On définit le moteur de template que Express va utiliser
app.set("views", path.join(__dirname, "views")); // On définit le dossier des vues (dans lequel se trouvent les fichiers .hbs)
init(hbs);

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
        genres,
        styles : [
            "gestionGame.css"
        ]
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

/**
 * @param {Express.Request} req
 * */
async function getGameData(req)
{
    let {title, releaseDate, desc, genreId, editorId : editorName}  = req.body;

    genreId = +genreId;
    let editorId = await model.GetIDFromEditorName(editorName);
    if(editorId === -1)
    {
        editorId = await AddEditor(editorName);
        if(editorId === false)
            return {};
    }
    return {title, releaseDate, desc, genreId, editorId};
}

app.post("/games", upload.single("file"), async (req, res) => {

    const {title, releaseDate,desc, editorId, genreId} = await getGameData(req);

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

    // let {title, releaseDate, desc, genreId, editorId : editorName}  = req.body;
    //
    // genreId = +genreId;
    // let editorId = await model.GetIDFromEditorName(editorName);
    // if(editorId === -1)
    // {
    //     editorId = await AddEditor(editorName);
    //     if(editorId === false)
    //         return;
    // }
    const {title, releaseDate,desc, editorId, genreId} = await getGameData(req);

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


app.post("/games/:id/delete", async (req, res) => {
    try{
        await prisma.game.delete({
            where: {
                id: +req.params.id,
            }
        })
        res.status(201).redirect("/games"); // On redirige vers la page des jeux
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "game supression failed" });
    }
})

app.get("/games", async (req, res) => {
    const games = await prisma.game.findMany();

    res.render("games/list", {
        games,
        title: "Accueil - Vapeur",
        // styles : [{
        //     href : "test.css"
        // }],
    });
})

app.get("/games/:id", async (req, res) => {
    const id = +req.params.id;
    if(!id)
    {
        res.redirect("/games");
    }
    const game = await prisma.game.findFirst({
        where : {
            id
        },
        include : {
            editor : true,
            genre : true,
        }
    })

    if(!game)
    {
        res.status(404).render("404", {
            message : `Le jeu d'ID ${id} n'existe pas !`
        });
        return;
    }

    res.render("games/detail", { game });
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
        editorName : game.editor?.name ?? "non",
        editors,
        genres,
        date: date.toISOString().split("T")[0],
        submit_text : "Modifier",
        action:`/games/${game.id}/edit`,
        styles : [
            "gestionGame.css"
        ]
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


//jeux mis en avant
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

/**
 * @param {String} name
 * @return {boolean | number}
 * */
async function AddEditor(name)
{
    try {
        /**
         * @type {[{
         *     id : number,
         *     name : string
         * }]}
         * */
        const editor = await prisma.editor.createManyAndReturn({
            data:[{ name },],
        });

        console.log("editor : ",editor)

        return editor[0].id;
    } catch (err) {
        return false;
    }
}

app.post("/games/:id/highlight", async (req, res) => {
    const game = await prisma.game.findFirst({
        where: {
            id: +req.params.id,
        }
    })
    await prisma.game.update({
        where: {
            id: +req.params.id,
        },
        data: {
            highlighted: !game.highlighted,
        }
    })
    res.redirect("/games");
})



app.post("/editors", async (req, res) => {
    const { name } = req.body;
    if(AddEditor(name) !== false)
    {
        res.status(201).redirect("/editors");
    }
    else {
        res.status(404).redirect("/zx");
    }
})

app.get("/editors/add", async (req, res) => {

    res.render("editors/add");
})

app.get("/editors", async (req, res) => {
    const editors = await prisma.editor.findMany();
    res.render("editors/index", { editors });
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

app.post("/editors/:id/delete", async (req, res) => {
    try{
        await prisma.editor.delete({
            where:{
                id : +req.params.id,
            }
        })
        res.status(201).redirect("/editors");
    }catch (error){
        console.error(error);
    res.status(400).send("Un jeu possède cet éditeur !");
    }
})






app.get("/editors/:id/edit", async (req, res) =>{
    try{
        const editor = await prisma.editor.findFirst({
            where : {
                id : +req.params.id,
            }
        });

        res.render("editors/edit", { editor });
    } catch (error) {
        console.error(error);
        res.status(400).send("Un problème !");
    }
})

app.post("/editors/:id/edit", async (req, res) =>{
    console.log("dans le post");
    try{
        const {name} = req.body;
        await prisma.editor.update ({
            where : {
                id : +req.params.id
            },
            data : {
                name
            }
        });
        res.redirect("/editors");
    }catch(error){
        console.error(error);
        res.status(400).send("Un probleme !")
    }
})












app.use((req, res, next) => {
    res.status(404).render("404", {
        message : "La page que vous cherchez n'existe pas !"
    });
})

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Quelque chose s'est mal passé !");
})

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})