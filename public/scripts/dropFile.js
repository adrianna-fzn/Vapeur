(() => {
    const dropZone = document.querySelector("#file-drop");
    const body = document.querySelector("body");
    const dropImageSection = document.querySelector(".DragDropSection")
    const dropImage = document.querySelector(".DragDropImg");

    if(!(dropZone instanceof  HTMLElement))
        return;

    const fileInput = document.querySelector("#file");

    if(!(fileInput instanceof HTMLInputElement))
        return;

    /**
     * @param {Event} e
     * */
    function preventDefault(e){
        e.preventDefault();
    }

    // /**
    //  * Fonction permettant d'obtenir les dimensions d'une image à partir d'une url
    //  *
    //  * @param {string} url
    //  * @return {Promise<{
    //  *     width : number,
    //  *     height : number
    //  * }>}
    //  * */
    // const GetDimension = url => {
    //     return new Promise(resolve => {
    //         const img = new Image();
    //         img.src = url;
    //         img.onload = () => {
    //             resolve({
    //                 width: img.width,
    //                 height: img.height,
    //             })
    //         }
    //
    //     })
    // }

    body.addEventListener("dragover", preventDefault);
    dropImage.addEventListener("drop", preventDefault);
    dropImageSection.addEventListener("drop", preventDefault);

    body.addEventListener("dragenter", (e) => {
        e.preventDefault();
        dropZone.classList.toggle("drag-over");
        dropImageSection.classList.add("active");
        dropImageSection.classList.remove("disable");
    })

    body.addEventListener("dragleave", (e) => {
        e.preventDefault();
        if(e.target === dropImage)
        {
            dropZone.classList.toggle("drag-over");
            dropImageSection.classList.remove("active");
            dropImageSection.classList.add("disable");
        }
    })

    /**
     * @param {DragEvent} e
     * */
    function handleDrop(e){
        e.preventDefault();

        const files = e.dataTransfer.files;

        if(files.length > 0 && files[0].type.startsWith("image/")){
            fileInput.files = files;
            dropZone.textContent = files[0].name.substring(0,20);
        }

        dropImageSection.classList.add("disable");
        dropImageSection.classList.remove("active");
        handleFile(files[0]);
    }

    body.addEventListener("drop", handleDrop);

    fileInput.addEventListener("change", async(e) =>  {

        if(e.currentTarget.files.length <= 0)
            return;

        /**
         * @type {FileList}
         * */
        const filesList = e.currentTarget.files;

        // const {height,width} = await GetDimension(URL.createObjectURL(e.currentTarget.files[0]));
        // console.log(height,width);
        dropZone.textContent = filesList.item( 0).name;


        handleFile(filesList.item(0));
    })

    /**
     * @param {File} file
     * */
    function handleFile(file) {

        // Initializing the FileReader API and reading the file
        const reader = new FileReader();
        reader.readAsDataURL(file);

        // Once the file has been loaded, fire the processing
        reader.onloadend = function (e) {
            const preview = document.createElement('img');

            if (isValidFileType(file)) {
                preview.src = e.target.result;
            }

            // Apply styling
            preview.classList.add('preview-image');
            const previewContainer = document.getElementById('preview-container');
            while(previewContainer.hasChildNodes())
                previewContainer.removeChild(previewContainer.firstChild);
            previewContainer.appendChild(preview);
        };

    }

    /**
     * @param {File} file
     * */
    function isValidFileType(file) {
        return file.type.startsWith("image/");
    }


})();