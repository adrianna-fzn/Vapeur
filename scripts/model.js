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


}

module.exports = {
    CModel
}