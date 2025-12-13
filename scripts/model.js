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
     * Fonction permettant d'avoir l'ID d'un editor en fonction de son nom
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

    async GetEditorsAndGenres()
    {
        const editors = await this.prisma.editor.findMany();
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
}

module.exports = {
    CModel
}