const uploadQueue = [];

let uploading = false;

function addFiles(files){

    for(const file of files){

        uploadQueue.push(file);

    }

    processQueue();

}

function processQueue(){

    // Akan kita isi nanti

}

function uploadFile(file){

    // AJAX upload

}