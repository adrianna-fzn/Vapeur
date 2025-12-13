/**
 * @typedef {{
 *     id : number,
 *     title : string,
 *     desc : string,
 *     releaseDate : Date,
 *     genere : any,
 *     genreId? : number,
 *     editor : any,
 *     editorId : number,
 *     highlighted : boolean,
 *     filename? : string
 * }} game_t
 * */

/**
 * @typedef {{
 *     id : number,
 *     name : string,
 *     Game : game_t[]
 * }} editor_t
 * */

/**
 * @typedef {editor_t} genre_t
 * */

/**
 * @typedef {game_t[]   | undefined} games_t
 * @typedef {editor_t[] | undefined} editors_t
 * @typedef {genre_t[]  | undefined} genres_t
 * */

/**@type {game_t}*/
let game_t;
/**@type {games_t}*/
let games_t;

/**@type {editor_t}*/
let editor_t;
/**@type {editors_t}*/
let editors_t;

/**@type {genre_t}*/
let genre_t;
/**@type {genres_t}*/
let genres_t;

module.exports = {
    games_t,
    game_t,
    editor_t,
    editors_t,
    genres_t,
    genre_t,
}