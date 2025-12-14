
const express = require("express");
const { NextFunction, Request, Response } = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const path = require("path");
const hbs = require("hbs");
const multer = require("multer");
const {CModel} = require("./scripts/model.js");
const {init} = require("./scripts/config_hbs.js");
const {InitTest} = require("./scripts/test.js");
const fs = require("fs");

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

//route vers la liste de des genres
app.get("/genres", async (req, res) => {
    const genres = await prisma.genre.findMany({
        orderBy : {
            name : "asc"
        }
    });
    res.render("genres/index", {
        genres,
        pageTitle: "Liste des genres",
        styles : [
            "genreList.css"
        ]
    });
})


app.get("/games/add", async (req, res) => {
    const editors = await prisma.editor.findMany();
    const genres = await prisma.genre.findMany();

    res.render(path.join("games","add"),{
        pageTitle : "Ajouter un jeu",
        editors,
        genres,
        styles : [
            "form.css"
        ]
    });
})


// Configuration du stockage des fichiers
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

/**
 *  Ajoute un editeur à la base de données si il n'existe pas.
 * @param {Express.Request} req
 * */
async function checkEditorExist(req)
{
    let {title, releaseDate, desc, genreId, editorId : editorName}  = req.body;

    genreId = +genreId;
    let editorId = await model.GetIDFromEditorName(editorName);
    if(editorId === -1 && editorName!=="")
    {
        editorId = await model.AddEditor(editorName);
        if(editorId === false)
            return {};
    }
    return {title, releaseDate, desc, genreId, editorId};
}

app.post("/games", upload.single("file"), async (req, res) => {

    const {title, releaseDate,desc, editorId, genreId} = await checkEditorExist(req);

    console.log(req.file);
    let name = "";

    if (req.file)
        name = req.file.filename;

    await prisma.game.create({
        data : {
            title,
            releaseDate : new Date(releaseDate),
            desc,
            genreId,
            editorId : editorId === -1 ? undefined : editorId,
            highlighted : false,
            filename : `${name}`
        }
    })

    res.redirect("/games");
});

app.get("/games/add", async (req, res) => {

    const {editors,genres} = await model.GetEditorsAndGenres();
    res.render(path.join("games","add"),{
        editors,
        genres,
        pageTitle : "Créer un jeu",
        style : [
            "form.css",
        ]
    });
})

app.post("/games/:id/edit", upload.single("file"), async (req, res) => {

    const id = +req.params.id;
    const {title, releaseDate,desc, editorId, genreId} = await checkEditorExist(req);

    //On récupère les champs highlighted et filename dans le body.
    //Ces 2 champs ne sont pas présents dans l'ajout normal alors on peut pas récupérer depuis checkEditorExist.
    let { highlighted, filename } = req.body;
    if (filename === undefined)
        filename = "";

    highlighted = highlighted === "oui";
    const name = req.file ? req.file.filename : filename;

    //Supprimer l'ancienne image
    try{
        console.log(filename);
        if(req.file && req.file.filename !== filename)
        {
            fs.rmSync(path.join(__dirname,"public","uploads",filename));
            console.log(path.join(__dirname,"public","uploads",filename) + " deleted");
        }

    }
    catch (err)
    {
        console.error(err);
    }

    if(editorId !==-1)
        await prisma.game.update({
            data : {
                title,
                releaseDate : new Date(releaseDate),
                desc,
                genreId,
                editorId,
                highlighted : highlighted,
                filename : `${name}`.replace("/uploads/","")
            },
            where : {
                id : id
            }
        })
    else
        await prisma.game.update({
            data : {
                title,
                releaseDate : new Date(releaseDate),
                desc,
                genreId,
                highlighted : highlighted,
                filename : `${name}`.replace("/uploads/","")
            },
            where : {
                id : id
            }
        })

    res.redirect("/");
})


app.post("/games/:id/delete", async (req, res) => {
    try{

        const id = +req.params.id;

        /**@type {import("./scripts/type").game_t | undefined}*/
        const game = await prisma.game.findFirst({
            where: {
                id: id
            }
        });

        try{
            console.log(game);
            if(game.filename)
                fs.rmSync(path.join(__dirname,"public","uploads",game.filename));
        }
        catch (err)
        {
            console.error(err);
        }

        await prisma.game.delete({
            where: {
                id: +req.params.id,
            }
        })
        res.status(201).redirect("/"); // On redirige vers la page des jeux
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "game supression failed" });
    }
})

app.get("/games", async (req, res) => {

    /**@type {import("./scripts/type").games_t}*/
    const games = await prisma.game.findMany({
        orderBy : [{
            title : 'asc'
        }]
    });

    res.render("games/list", {
        games,
        pageTitle: "Liste des jeux - Vapeur",
        styles : [
            "gameList.css",
            "editButtons.css"
        ]
    });
})

app.get("/games/:id", async (req, res) => {

    const id = +req.params.id;
    if(!id)
    {
        res.redirect("/games");
    }

    /**@type {import("./scripts/type").games_t}*/
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

    res.render("games/detail", {
        game,
        pageTitle: "Détails de " + game.title + " - Vapeur",
        styles : [
            "gameDetails.css",
            "editButtons.css"
        ] });
})

app.get("/games/:id/edit", async (req, res) => {
    const id = +req.params.id;

    /**@type {import("./scripts/type").games_t}*/
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


    res.render("games/edit", {
        pageTitle : "Modifier le jeu "+ game.title,
        form_title : `Modification du jeu ${game.title}`,
        title : game.title,
        desc : game.desc,
        genreName : game.genre.name,
        editorName : game.editor?.name,
        editors,
        genres,
        highlighted : game.highlighted ? "oui" : "non",
        filename : game.filename,
        date: date.toISOString().split("T")[0],
        submit_text : "Modifier",
        action:`/games/${game.id}/edit`,
        styles : [
            "form.css"
        ]
    })
})

//--------------------------------------------------------------------------------

app.get("/genres/:id", async (req, res) => {
    const id = req.params.id;
    try {

        /**@type {import("./scripts/type").genre_t | undefined}*/
        const genre = await prisma.genre.findUnique({
            where: {
                id: Number(id)
            }, include: {
                Game: true
            }
        });

        res.render("genres/detail", {
            pageTitle : "Genre : " + genre.name,
            genre,
            games: genre.Game,
            styles : [
                "gameList.css",
                "editButtons.css"
            ]
        });

    } catch (err) {
        res.status(404).redirect("/zx");
    }
})


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


app.post("/games/:id/highlight", async (req, res) => {

    /** @type {import("./scripts/type").game_t | undefined} */
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

/**
 * Fonction renvoyant un élément dans un tableau, ou l'élément lui même si c'est un tableau
 * @template T
 * @param {T | T[]} elt
 * @return T[]
 * */
const toArray = (elt) => {
    return Array.isArray(elt) ? elt : [elt]
}

app.post("/editors", async (req, res) => {
    let { name, games } = req.body;

    games = games === undefined ? [] : games;

    if(model.AddEditor(name, toArray(games)) !== false)
    {
        res.status(201).redirect("/editors");
    }
    else {
        res.status(404).redirect("/zx");
    }
})

app.get("/editors/add", async (req, res) => {

    const games = await model.getGames();

    res.render("editors/add", {
        pageTitle: "Ajouter une editeur",
        styles : ["form.css"],
        games
    });
})

app.get("/editors", async (req, res) => {

    /**
     * @type {import('./scripts/type').editors_t}
     * */
    const editors = await prisma.editor.findMany({
        orderBy : {
            name : "asc"
        }
    });

    res.render("editors/index", {
        editors,
        pageTitle: "Liste des editeurs",
        styles : [
            "editorList.css",
            "editButtons.css"
        ],
        action : "/editors"
    });
})


//Affiche l'editeur qui correspond à l'id
app.get("/editors/:id", async (req, res) => {
    try{
        console.log(req.params.id);
        /**
         * @type {import('./scripts/type').editors_t}
         * */
        const editor = await prisma.editor.findFirst({
            where: {
                id: Number(req.params.id),
            },
            include: {
                Game: true //Récupère tous les jeux liés à l'éditeur
            }
        });

        res.render("editors/detail", {
            editor: editor,
            games: editor.Game,
            pageTitle: `Editeur : ${editor.name}`,
            styles : [
                "gameList.css",
                "editButtons.css"
            ]
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
        /**
         * @type {import('./scripts/type').editor_t}
         * */
        const editor = await prisma.editor.findFirst({
            where : {
                id : +req.params.id,
            }
        });


        const games = await model.getGames();

        if(!games)
            return;

        const ids = games.filter(game => game.editorId === editor.id)
            .map(game => game.id);
        res.render("editors/edit", {
            editor,
            styles : ["form.css"],
            games,
            editor_name : editor.name,
            form_title : "Modification de " + editor.name,
            ids,
            action: "/editors/"+ req.params.id,
        });
    } catch (error) {
        console.error(error);
        res.status(400).send("Un problème !");
    }
})

app.post("/editors/:id", async (req, res) =>{
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

/**
 * Fonction utilisé pour les erreurs d'express
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