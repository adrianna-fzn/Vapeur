const { PrismaClient } = require("@prisma/client");
const path = require("path");
const multer = require("multer");
const {CModel} = require("scripts/model.js");
const bodyParser = require("body-parser");
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
 *  Ajoute un editeur à la base de données si il n'existe pas.
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
 * @param {Express} app
 * @param {PrismaClient} prisma
 * @param {CModel} model
 */
module.exports = function(app, prisma, model){

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
    });

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
    });

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
    });

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
    });

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
    });

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
    });

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
    });

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
    });
}