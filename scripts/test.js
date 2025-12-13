
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
        const GameCreated = await prisma.game.create({
            data :
                {
                    title : "GTA VI",
                    releaseDate : new Date(),
                    desc : "No desc",
                    genreId : 1,
                    highlighted : false,
                }

        });
        log("Le jeu à été crée");
        //0n a crée un seul jeu alors on le prend

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
        const EditorCreated = await prisma.editor.create({
            data :
                {
                    name : "Unknown Editor",
                }

        });

        log("L'editeur à été crée");
        //0n a crée un seul jeu alors on le prend

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