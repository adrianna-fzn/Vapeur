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

    body.addEventListener("dragover", preventDefault);
    body.addEventListener("dragenter", preventDefault);
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
            fileInput.setAttribute("value", "C:\\fakepath\\"+files[0].name);
        }

        dropImageSection.classList.add("disable");
        dropImageSection.classList.remove("active");
        handleFile(files[0]);
    }

    body.addEventListener("drop", handleDrop);

    fileInput.addEventListener("change", (e) =>  {
        console.log(fileInput.value);
        console.log(e)
        /**
         * @type {FileList}
         * */
        const filesList = e.currentTarget.files;
        dropZone.textContent = filesList.item(0).name;


        handleFile(filesList.item(0));
    })

    /**
     * @param {File} file
     * */
    function handleFile(file) {

        // Initializing the FileReader API and reading the file
        const reader = new FileReader();
        reader.readAsDataURL(file);

        console.log("Loading")
        // Once the file has been loaded, fire the processing
        reader.onloadend = function (e) {
            console.log("end Loading")
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