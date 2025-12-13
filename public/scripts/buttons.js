const CheckReload = async (id) => {
    await fetch("/games/"+ id +"/highlight", {
        method: "post",
    })
    window.location.reload()
}

const DeleteGame = async (id) => {
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
