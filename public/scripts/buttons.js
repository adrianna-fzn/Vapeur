//redirige vers la route pour mettre en avant un jeu ou non
const CheckReload = async (id) => {
    await fetch("/games/"+ id +"/highlight", {
        method: "post",
    })
    window.location.reload()
}

//supprime un jeu
const DeleteGame = async (id) => {
    if (!confirm("Voulez-vous supprimer ce jeu ?")){
            return 0
        }

    await fetch("/games/"+ id +"/delete", {
        method: "post",
    })
    const currentUrl = window.location.href;
    //fait une requete vers la page pour test
    const test = await fetch(currentUrl, { method: "GET" });

    //test si la page existe encore
    if (test.ok) {
        window.location.reload();
    } else {
        window.location.href = "/";
    }
}

//supprime un editeur
const DeleteEditor = async (id) => {
    if (!confirm("Voulez-vous supprimer cet éditeur ?")){
            return 0
        }
    await fetch("/editors/"+ id +"/delete", {
        method: "post",
    })
    window.location.reload();
}
