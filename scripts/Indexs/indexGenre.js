const { PrismaClient } = require("@prisma/client");

/**
 * @param {Express} app
 * @param {PrismaClient} prisma
 */
module.exports = function (app, prisma) {

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
    });

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
    });
}