const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const hbs = require("hbs");
const multer = require("multer");

const {CModel} = require("./scripts/model.js");
const {init} = require("./scripts/config_hbs.js");
const {InitTest} = require("./scripts/test.js");

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
    });
})

/**
 * @typedef {{
 *     id : number,
 *     title : string,
 *     desc : string,
 *     releaseDate : Date,
 *     genere : any,
 *     genreId? : number,
 *     editor : any,
 *     editorId : number,
 *     highlighted : boolean,
 *     filename? : string
 * }} game_t
 * */

/**
 * @typedef {game_t[] | undefined} games_t
 * */


app.get("/games/add", async (req, res) => {
    const editors = await prisma.editor.findMany();
    const genres = await prisma.genre.findMany();

    res.render(path.join("games","add"),{
        pageTitle : "Ajouter un jeu",
        editors,
        genres,
        styles : [
            "gestionGame.css"
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
    if(editorId === -1)
    {
        editorId = await AddEditor(editorName);
        if(editorId === false)
            return {};
    }
    return {title, releaseDate, desc, genreId, editorId};
}

app.post("/games", upload.single("file"), async (req, res) => {

    const {title, releaseDate,desc, editorId, genreId} = await checkEditorExist(req);

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

app.get("/games/add", async (req, res) => {

    const {editors,genres} = await model.GetEditorsAndGenres();
    res.render(path.join("games","add"),{
        editors,
        genres,
        pageTitle : "Créer un jeu",
        style : [
            "gestionGame.css",
        ]
    });
})

app.post("/games/:id/edit", upload.single("file"), async (req, res) => {

    const id = +req.params.id;
    const {title, releaseDate,desc, editorId, genreId} = await checkEditorExist(req);

    //On récupère les champs highlighted et filename dans le body.
    //Ces 2 champs ne sont pas présents dans l'ajout normal alors on peut pas récupérer depuis checkEditorExist.
    let { highlighted, filename } = req.body;

    highlighted = highlighted === "oui";
    const name = req.file ? req.file.filename : filename;

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

    res.redirect("/");
})


app.post("/games/:id/delete", async (req, res) => {
    try{
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

    /**
     * @type {games_t}
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
        pageTitle : "Modifier le jeu "+ game.title,
        form_title : `Modification du jeu ${game.title}`,
        title : game.title,
        desc : game.desc,
        genreName : game.genre.name,
        editorName : game.editor?.name ?? "Aucun éditeur",
        editors,
        genres,
        highlighted : game.highlighted ? "oui" : "non",
        filename : game.filename,
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
            pageTitle : "Genre : " + genre.name,
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

/**
 * Fonction permettant d'ajouter un editeur ainsi que ses jeux associés si il en a.
 * @param {String} name
 * @param {String[]} gamesIds
 * @return {false | number}
 * */
async function AddEditor(name, gamesIds = [])
{
    try {
        /**
         * @type {[{
         *     id : number,
         *     name : string
         * }]}
         * */
        const editors = await prisma.editor.createManyAndReturn({
            data:[{ name },],
        });

        const editor = editors[0];
        console.log("editor : ",editor)

        if(gamesIds.length > 0)
        {
            const iGamesIds = gamesIds.map(g => +g);
            /**
             * @type {games_t}
             * */
            const games = await prisma.game.findMany();

            console.log(games);

            if(!games)
                return false;

            const filteredGames = games.filter(game => gamesIds.includes(game.id.toString()));
            for(const game of filteredGames)
            {
                await prisma.game.update({
                    data : {
                        editorId : editor.id
                    },

                    where : {
                        id : game.id
                    }
                })
            }
        }

        return editor.id;
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

/**
 * @template T
 * @param {T | T[]} elt
 * @return T[]
 * */
const toArray = (elt) => {
    return Array.isArray(elt) ? elt : [elt]
}

//Ajouter/creer un editeur
app.post("/editors", async (req, res) => {
    let { name, games } = req.body;

    games = games === undefined ? [] : games;

    if(AddEditor(name, toArray(games)) !== false)
    {
        res.status(201).redirect("/editors");
    }
    else {
        res.status(404).redirect("/zx");
    }
})

app.get("/editors/add", async (req, res) => {
    /**
     * @type {games_t}
     * */
    const games = await prisma.game.findMany();

    res.render("editors/add", {
        pageTitle: "Ajouter une editeur",
        styles : ["gestionGame.css"],
        games
    });
})

app.get("/editors", async (req, res) => {
    const editors = await prisma.editor.findMany({
        orderBy : {
            name : "asc"
        }
    });

    res.render("editors/index", {
        editors,
        pageTitle: "Liste des editeurs",
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
            pageTitle: `Editeur : ${editor.name}`
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