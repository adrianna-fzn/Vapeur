const { PrismaClient } = require("@prisma/client");
const {CModel} = require("../model");

/**
 * Fonction renvoyant un élément dans un tableau, ou l'élément lui même si c'est un tableau
 * @template T
 * @param {T | T[]} elt
 * @return T[]
 * */
const toArray = (elt) => {
    return Array.isArray(elt) ? elt : [elt]
}

/**
 * Exporte les routes concernant les éditeurs
 * @param {Express} app
 * @param {PrismaClient} prisma
 * @param {CModel} model
 */
module.exports = function(app, prisma, model) {

    //route pour créer un éditeur
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
    });

    //route pour visualiser la page d'ajout d'un éditeur
    app.get("/editors/add", async (req, res) => {

        const games = await model.getGames();

        res.render("editors/add", {
            pageTitle: "Ajouter une editeur",
            styles : ["form.css"],
            games,
            action : "/editors"
        });
    });

    //route pour visualiser les éditeurs
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
    });

    //route pour visualiser l'éditeur qui correspond à l'id
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
    });

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
    });

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
    });


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
    });
}