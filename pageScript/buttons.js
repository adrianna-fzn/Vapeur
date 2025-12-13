const CheckReload = async (id) => {
    console.log("test");
    await fetch("/games/"+ id +"/highlight", {
        method: "post",
    })
    window.location.reload()
}

const DeleteGame = async (id) => {
    await fetch("/games/"+ id +"/delete", {
        method: "post",
    })
    window.location.reload()
}
