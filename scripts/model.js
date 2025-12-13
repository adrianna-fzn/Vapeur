const {PrismaClient} = require("@prisma/client");

/**
 * Class contenant des méthodes pour faire des choses sympa dans la BDD
 * */
class CModel
{
    /**
     * @param {PrismaClient} prisma
     * */
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Méthode permettant d'avoir l'ID d'un editor en fonction de son nom
     * @param {string} editorName
     * @return {Promise<number>}
     * */
    async GetIDFromEditorName(editorName)
    {
        try
        {
            const editor = await this.prisma.editor.findUnique({
                where : {
                    name : editorName
                }
            });

            return editor.id;
        }
        catch (err)
        {
            console.log(err);
            return -1;
        }

    }

    /**
     * Méthode permettant de récupérer les editeurs et les genres
     * @returns {Promise<{editors : import('./type').editors_t,
     *                   genres : import('./type').genres_t}>}
     * */
    async GetEditorsAndGenres()
    {
        /**@type {import('./type').editors_t}*/
        const editors = await this.prisma.editor.findMany();
        /**@type {import('./type').genres_t}*/
        const genres = await this.prisma.genre.findMany();

        return {editors,genres};
    }

    async GenresCreation()
    {
        const genres = ["Action", "Aventure", "RPG", "Simulation", "Sport", "MMORPG"];

        if(await this.prisma.genre.count() === 0)
        {
            await this.prisma.genre.createMany({
                 data : genres.map(genre => {
                     return {
                         name: genre
                     };
                 })
            });
        }
    }

    async EditorCreation()
    {
        const editors = ["EA","ROCKSTAR"];

        if(await this.prisma.genre.count() !== 0)
            return;

        await this.prisma.genre.createMany({

            data : editors.map(editor => {
                return {
                    name: editor
                };
            })
        });
    }


    /**
     * Méthode permettant d'ajouter un editeur ainsi que ses jeux associés si il en a.
     * @param {String} name
     * @param {String[]} gamesIds
     * @return {false | number}
     * */
    async AddEditor(name, gamesIds = [])
    {

        try {
            /**
             * @type {import("./scripts/type").editor_t | undefined}
             * */
            const editor = await this.prisma.editor.create({
                data:{ name },
            });

            console.log("editor : ",editor)

            if(gamesIds.length > 0)
            {

                const games = await this.getGames();

                console.log(games);

                if(!games)
                    return false;

                const filteredGames = games.filter(game => gamesIds.includes(game.id.toString()));
                for(const game of filteredGames)
                {
                    await this.prisma.game.update({
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

    /**
     * Méthode permettant de récupérer tous les jeux
     * @returns {Promise<games_t>}
     * */
    async getGames(){
        return this.prisma.game.findMany();
    }

}

module.exports = {
    CModel
}