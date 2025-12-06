const { Instance } = require("hbs");
const hbs = require("hbs");
const path = require("path");

/**
 * @param {Instance} hbs
 * */
function init(hbs)
{
    hbs.registerPartials(path.join(__dirname, "views", "partials")); // On définit le dossier des partials (composants e.g. header, footer, menu...)

    //helpers
    hbs.registerHelper("Year", (date) => {
        return new Date(date).getFullYear();
    });
}

module.exports = {
    init,
}