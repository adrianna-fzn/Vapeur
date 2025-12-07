(() => {
    const dropZone = document.querySelector("#file-drop");
    if(!(dropZone instanceof  HTMLElement))
        return;

    const fileInput = document.querySelector("#file");

    /**
     * @param {Event} e
     * */
    function preventDefault(e){
        e.preventDefault();
    }

    dropZone.addEventListener("dragover", preventDefault);
    dropZone.addEventListener("dragenter", preventDefault);

    dropZone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        dropZone.classList.toggle("drag-over");
    })

    dropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropZone.classList.toggle("drag-over");
    })

    /**
     * @param {DragEvent} e
     * */
    function handleDrop(e){
        e.preventDefault();

        const files = e.dataTransfer.files;

        if(files.length > 0 && files[0].type.startsWith("image/")){
            fileInput.file = files[0];
            dropZone.textContent = files[0].name;
        }

        dropZone.classList.remove("drag-over");
        handleFile(files[0]);
    }

    dropZone.addEventListener("drop", handleDrop);

    fileInput.addEventListener("change", (e) =>  {
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