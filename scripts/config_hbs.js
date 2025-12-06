const { Instance } = require("hbs");
const hbs = require("hbs");
const path = require("path");

/**
 * Helper pour vérifier que 2 éléments sont les mêmes
 * @param {String} a
 * @param {String} b
 * */
function areSame(a,b)
{
    return a === b;
}

function default_(a,b)
{
    if(!a)
        return b;
    return a;
}
/**
 * @param {Instance} hbs
 * */
function init(hbs)
{
    hbs.registerPartials(path.join(__dirname,"..", "views", "partials")); // On définit le dossier des partials (composants e.g. header, footer, menu...)

    //helpers
    hbs.registerHelper("Year", (date) => {
        return new Date(date).getFullYear();
    });

    hbs.registerHelper("default", (a,b) => default_(a,b));

    hbs.registerHelper("areSame", (a,b) => areSame(a,b));
}



module.exports = {
    init,
}