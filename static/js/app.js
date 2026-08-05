const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const uploadForm = document.getElementById("uploadForm");

if (dropZone) {

    dropZone.onclick = () => fileInput.click();

    fileInput.onchange = () => {

        if (fileInput.files.length) {

            for (const file of fileInput.files) {
                uploadFile(file);
            }

        }

    };

    dropZone.addEventListener("dragover", e => {

        e.preventDefault();

        dropZone.classList.add("dragover");

    });

    dropZone.addEventListener("dragleave", () => {

        dropZone.classList.remove("dragover");

    });

    dropZone.addEventListener("drop", e => {

        e.preventDefault();

        dropZone.classList.remove("dragover");

        fileInput.files = e.dataTransfer.files;

        for (const file of e.dataTransfer.files) {
            uploadFile(file);
        }


    });

    function uploadFile(file){

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "path",
        document.querySelector("input[name=path]").value
    );

    const xhr = new XMLHttpRequest();

    xhr.open("POST","/upload");

    const progress=document.getElementById("uploadProgress");

    const bar=document.getElementById("progressBar");

    progress.style.display="block";

    xhr.upload.onprogress=function(e){

        if(e.lengthComputable){

            const percent=Math.round(
                e.loaded/e.total*100
            );

            bar.style.width=percent+"%";

            bar.innerHTML=percent+"%";

        }

    };

    xhr.onload=function(){

        location.reload();

    };

    xhr.send(formData);

}

}