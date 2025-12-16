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
        let editors = await prisma.editor.findMany({
            orderBy : {
                name : "asc"
            }
        });

        /**@type {import('./scripts/type').editors_t}
         * */
        editors = editors.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        /**
         * @type {import('./scripts/type').editors_t}
         * */
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
    app.get("/editors/:id", async (req, res, next) => {
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

        }
        catch (err){//Gère l'erreur quand l'id n'existe pas
            let e = new Error(`L'éditeur d'ID ${Number(req.params.id)} n'existe pas !`);
            e.status = 404;
            next(e);
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

    app.get("/editors/:id/edit", async (req, res,next) =>{
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
            const e = new Error(`L'éditeur d'ID ${Number(req.params.id)} n'existe pas !`);
            e.status = 404;
            next(e);
        }
    });


    //Modification editeur
    app.post("/editors/:id", async (req, res,next) =>{
        console.log("dans le post");
        try{
            let {name, games : EditorGames} = req.body;
            const arrayEditorGames = toArray(EditorGames).map(e => +e);

            const games = await model.getGames();
            const gamesNotInEditor = games.filter(game => !arrayEditorGames.includes(game.id));


            console.log(arrayEditorGames);

            //Transforme plusieurs promises en une unique
            await Promise.all([

                //Changer le nom de l'éditeur
                prisma.editor.update ({
                    where : {
                        id : +req.params.id
                    },

                    data : {
                        name
                    }
                }),

                //Les jeux qui sont associés à l'éditeur, sont mis avec le bon editorId (Si il ne le son pas déjà)
                prisma.game.updateMany({
                    where : {
                        AND : [
                            {
                                id: {
                                    in: arrayEditorGames,
                                },
                            },
                        ],
                    },

                    data : {
                        editorId : +req.params.id,
                    }
                }),

                //Les jeux qui ne sont pas associés à l'éditeur sont mis avec un editeur à null (si ils étaient associé avant)
                prisma.game.updateMany({
                    where : {
                        AND : [
                            {
                                id : {
                                    in : gamesNotInEditor.map(game => game.id)
                                }
                            },
                            {
                                editorId : +req.params.id,
                            }
                        ],


                    },
                    data : {
                        editorId : null
                    }
                })

            ]);

            res.redirect("/editors");
        }catch(error){
            const e = new Error(`L'éditeur d'ID ${Number(req.params.id)} n'existe pas !`);
            e.status = 404;
            next(e);
        }
    });
}