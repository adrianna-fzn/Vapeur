const {Application} = require("express");
const {PrismaClient} = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const {CModel} = require("./model.js");
/**
 * @param {Application} app
 * @param {PrismaClient} prisma
 * @param {CModel} model
 * */
async function InitTest(app, prisma, model)
{
    /**
     * @param {string} message
     * */
    const log = (message) => {
        console.log(`[${message}]`);
    }


    // const config = fs.readFileSync(path.join(__dirname,"..","config.json")).toString();
    // const Json = JSON.parse(config);
    app.get("/api/test/:mdp/createGame", async (req, res) => {
        // if(req.params.mdp !== Json["API_MDP"])
        // {
        //     res.status(469).send("Vous n'avez pas la permission");
        //     return;
        // }

        await model.EditorCreation();
        log("Création du jeu");
        const GamesCreated = await prisma.game.createManyAndReturn({
            data : [
                {
                    title : "GTA VI",
                    releaseDate : new Date(),
                    desc : "No desc",
                    genreId : 1,
                    highlighted : false,
                }
            ]
        });
        log("Le jeu à été crée");
        //0n a crée un seul jeu alors on le prend
        const GameCreated = GamesCreated[0];

        log("Suppression du jeu");
        await prisma.game.delete({
            where : {
                id : GameCreated.id
            }
        });
        console.log("[Le jeu a été supprimé]");

        res.status(201).send("OK");
    });

    app.get("/api/test/:mdp/createEditor", async (req, res) => {
        // if(req.params.mdp !== Json["API_MDP"])
        // {
        //     res.status(469).send("Vous n'avez pas la permission");
        //     return;
        // }

        await model.EditorCreation();
        log("Création de l'editeur");
        const EditorsCreated = await prisma.editor.createManyAndReturn({
            data : [
                {
                    name : "Unknown Editor",
                }
            ]
        });

        log("L'editeur à été crée");
        //0n a crée un seul jeu alors on le prend
        const EditorCreated = EditorsCreated[0];

        log("Suppression de l'editor");
        await prisma.editor.delete({
            where : {
                id : EditorCreated.id
            }
        });

        log("L'editor a été supprimé");

        res.status(201).send("OK");
    })
}

module.exports = {
    InitTest
}