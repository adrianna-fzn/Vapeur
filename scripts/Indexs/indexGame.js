const { PrismaClient } = require("@prisma/client");
const path = require("path");
const multer = require("multer");
const {CModel} = require("../model");
const fs = require("fs");

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

/**
 *  Ajoute un editeur à la base de données s'il n'existe pas.
 * @param {Express.Request} req
 * @param {CModel} model
 * */
async function checkEditorExist(req,  model)
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

/**
 * Exporte toutes les routes concernant les jeux
 * @param {Express} app
 * @param {PrismaClient} prisma
 * @param {CModel} model
 */
module.exports = function(app, prisma, model){

    //route pour créer un jeu, qui vérifie si l'éditeur existe, et si non le créé
    app.post("/games", upload.single("file"), async (req, res) => {

        const {title, releaseDate,desc, editorId, genreId} = await checkEditorExist(req, model);

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

    //route pour visualiser la page d'ajout d'un jeu
    app.get("/games/add", async (req, res) => {

        const {editors,genres} = await model.GetEditorsAndGenres();
        res.render(path.join("games","add"),{
            editors,
            genres,
            pageTitle : "Créer un jeu",
            styles : [
                "form.css"
            ]
        });
    });

    //route pour modifier un jeu en fonction de son id, ici aussi, si l'éditeur n'existe pas, il est créé
    app.post("/games/:id", upload.single("file"), async (req, res,next) => {

        const id = +req.params.id;
        const {title, releaseDate,desc, editorId, genreId} = await checkEditorExist(req, model);

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

        try {
            if (editorId !== -1)
                await prisma.game.update({
                    data: {
                        title,
                        releaseDate: new Date(releaseDate),
                        desc,
                        genreId,
                        editorId,
                        highlighted: highlighted,
                        filename: `${name}`.replace("/uploads/", "")
                    },
                    where: {
                        id: id
                    }
                })
            else
                await prisma.game.update({
                    data: {
                        title,
                        releaseDate: new Date(releaseDate),
                        desc,
                        genreId,
                        highlighted: highlighted,
                        filename: `${name}`.replace("/uploads/", "")
                    },
                    where: {
                        id: id
                    }
                })
        }
        catch (err){
            let updateErr = new Error(`Le jeu d'ID ${id} n'existe pas !`);
            err.status = 404;
            next(updateErr);
            return;
        }
        res.redirect("/");
    });

    //route pour supprimer un jeu
    app.post("/games/:id/delete", async (req, res,next) => {
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
            let err = new Error(`la supression du jeu ${title} à échouée.`);
            err.status = 400;
            next(err);
        }
    });

    //route pour visualiser les jeux
    app.get("/games", async (req, res) => {

        /**@type {import("../type").games_t}*/
        let games = await prisma.game.findMany({
            orderBy : [{
                title : 'asc'
            }]
        });

        /**@type {import("../type").games_t}*/
        games = games.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));

        /**@type {import("../type").games_t}*/
        res.render("games/list", {
            games,
            pageTitle: "Liste des jeux - Vapeur",
            styles : [
                "gameList.css",
                "editButtons.css"
            ]
        });
    });

    //Route pour visualiser un jeu en details en fonction de son id
    app.get("/games/:id", async (req, res,next) => {
        try {
            const id = +req.params.id;

            /**@type {import("./scripts/type").games_t}*/
            const game = await prisma.game.findFirst({
                where: {
                    id
                },
                include: {
                    editor: true,
                    genre: true,
                }
            })

            res.render("games/detail", {
                game,
                pageTitle: "Détails de " + game.title + " - Vapeur",
                styles: [
                    "gameDetails.css",
                    "editButtons.css"
                ]
            });
        }
        catch (err){
            const e = new Error(`Le jeu d'ID ${+req.params.id} n'existe pas !`);
            e.status = 404;
            next(e);
        }
    });

    //route pour visualiser la page de modification d'un jeu
    app.get("/games/:id/edit", async (req, res,next) => {
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
            const err = new Error(`Le jeu d'ID ${id} n'existe pas ! Impossible de le modifier.`);
            err.status = 404;
            next(err);
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
            action:`/games/${game.id}`,
            styles : [
                "form.css"
            ]
        })
    });

    //route pour mettre un jeu en avant
    app.post("/games/:id/highlight", async (req, res,next) => {

        /** @type {import("./scripts/type").game_t | undefined} */
        const game = await prisma.game.findFirst({
            where: {
                id: +req.params.id,
            }
        })
        try {
            await prisma.game.update({
                where: {
                    id: +req.params.id,
                },
                data: {
                    highlighted: !game.highlighted,
                }
            })
        }
        catch (e){
            const err = new Error(`Le jeu d'ID ${id} n'existe pas ! Impossible de le mettre en avant.`);
            err.status = 404;
            next(err);
            return;
        }
        res.redirect("/games");
    });
}