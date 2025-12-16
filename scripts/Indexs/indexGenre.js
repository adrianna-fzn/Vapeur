const { PrismaClient } = require("@prisma/client");

/**
 * Exporte toutes les routes concernant les genres
 * @param {Express} app
 * @param {PrismaClient} prisma
 */
module.exports = function (app, prisma) {

    //route pour visualiser la liste de des genres
    app.get("/genres", async (req, res) => {
        const genres = await prisma.genre.findMany({
            orderBy :
                {
                    name: "asc"
                }
        });
        res.render("genres/index", {
            genres,
            pageTitle: "Liste des genres",
            styles : [
                "genreList.css"
            ]
        });
    });

    //route pour visualiser un genre en fonction de son id
    app.get("/genres/:id", async (req, res,next) => {
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
            let e = new Error(`Le genre d'ID ${Number(req.params.id)} n'existe pas !`);
            e.status = 404;
            next(e);
        }
    });
}