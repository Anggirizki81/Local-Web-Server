const uploadQueue = [];

let activeUploads = 0;
const MAX_CONCURRENT_UPLOADS = 3;
let totalUploads = 0;
let completedUploads = 0;


document.addEventListener("DOMContentLoaded", () => {

    const fileInput = document.getElementById("fileInput");

    if (!fileInput) {
        return;
    }

    fileInput.addEventListener("change", () => {

        const files = Array.from(fileInput.files);

        if (!files.length) {
            return;
        }

        addFiles(files);

        // Reset input agar file yang sama bisa dipilih lagi
        fileInput.value = "";

    });

});


function addFiles(files) {

    for (const file of files) {

        uploadQueue.push(file);

    }

    totalUploads += files.length;

    processQueue();

}


function processQueue() {

    while (
        activeUploads < MAX_CONCURRENT_UPLOADS &&
        uploadQueue.length > 0
    ) {

        const file = uploadQueue.shift();

        activeUploads++;

        uploadFile(file)
            .finally(() => {

                activeUploads--;
                completedUploads++;

                processQueue();

                // Semua upload selesai
                if (
                    uploadQueue.length === 0 &&
                    activeUploads === 0
                ) {

                    console.log("Semua upload selesai.");

                    totalUploads = 0;
                    completedUploads = 0;

                    setTimeout(() => {
                        location.reload();
                    }, 500);

                }

            });

    }

}


function uploadFile(file) {

    return new Promise((resolve, reject) => {

        const formData = new FormData();

        const pathInput =
            document.querySelector("input[name='path']");

        const currentPath =
            pathInput ? pathInput.value : "";

        formData.append("file", file);
        formData.append("path", currentPath);


        const xhr = new XMLHttpRequest();

        xhr.open("POST", "/upload", true);


        xhr.upload.addEventListener("progress", (event) => {

            if (!event.lengthComputable) {
                return;
            }

            const percent =
                Math.round((event.loaded / event.total) * 100);

            console.log(
                `${file.name}: ${percent}%`
            );

        });


        xhr.onload = () => {

            if (xhr.status >= 200 && xhr.status < 300) {

                try {

                    const result = JSON.parse(xhr.responseText);

                    if (result.success) {

                        console.log(
                            `Upload selesai: ${file.name}`
                        );

                        resolve(result);

                    } else {

                        console.error(
                            `Upload gagal: ${file.name}`,
                            result.message
                        );

                        reject(
                            new Error(result.message)
                        );

                    }

                } catch (error) {

                    reject(error);

                }

            } else {

                reject(
                    new Error(
                        `Server error: ${xhr.status}`
                    )
                );

            }

        };


        xhr.onerror = () => {

            reject(
                new Error("Network error")
            );

        };


        xhr.onabort = () => {

            reject(
                new Error("Upload dibatalkan")
            );

        };


        xhr.send(formData);

    });

}