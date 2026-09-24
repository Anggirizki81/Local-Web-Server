let wakeLock = null;

async function requestWakeLock() {

    try {

        if ("wakeLock" in navigator) {

            wakeLock = await navigator.wakeLock.request("screen");

            console.log("🔒 Screen Wake Lock aktif");

            wakeLock.addEventListener("release", () => {
                console.log("🔓 Screen Wake Lock dilepas");
            });

        }

    } catch (error) {

        console.log(
            "Wake Lock tidak tersedia:",
            error.message
        );

    }

}

async function releaseWakeLock() {

    if (wakeLock) {

        try {
            await wakeLock.release();
        } catch (error) {
            console.log(error);
        }

        wakeLock = null;

    }

}

const uploadQueue = [];

let activeUploads = 0;

const MAX_CONCURRENT_UPLOADS = 3;


// =====================================================
// OVERALL PROGRESS
// =====================================================

let totalBytes = 0;
let uploadedBytes = 0;

let totalFiles = 0;
let completedFiles = 0;


// Menyimpan progress masing-masing file
const fileProgress = new Map();


// =====================================================
// DOM READY
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const fileInput =
        document.getElementById("fileInput");

    const dropZone =
        document.getElementById("dropZone");


    // =================================================
    // KLIK DROP ZONE
    // =================================================

    if (dropZone && fileInput) {

        dropZone.addEventListener("click", () => {

            fileInput.click();

        });

    }


    // =================================================
    // PILIH FILE
    // =================================================

    if (fileInput) {

        fileInput.addEventListener("change", () => {

            const files =
                Array.from(fileInput.files);


            if (!files.length) {
                return;
            }


            console.log(
                "File dipilih:",
                files.length
            );


            addFiles(files);


            // Reset input
            fileInput.value = "";

        });

    }


    // =================================================
    // DRAG OVER
    // =================================================

    if (dropZone) {

        dropZone.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                event.stopPropagation();

                dropZone.classList.add(
                    "dragover"
                );

            }
        );


        // =================================================
        // DRAG LEAVE
        // =================================================

        dropZone.addEventListener(
            "dragleave",
            (event) => {

                event.preventDefault();

                event.stopPropagation();

                dropZone.classList.remove(
                    "dragover"
                );

            }
        );


        // =================================================
        // DROP
        // =================================================

        dropZone.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();

                event.stopPropagation();

                dropZone.classList.remove(
                    "dragover"
                );


                const files =
                    Array.from(
                        event.dataTransfer.files
                    );


                console.log(
                    "File di-drop:",
                    files.length
                );


                if (!files.length) {
                    return;
                }


                addFiles(files);

            }
        );

    }

});


// =====================================================
// ADD FILES
// =====================================================

function addFiles(files) {

    console.log(
        "Menambahkan:",
        files.length,
        "file"
    );
    requestWakeLock();


    for (const file of files) {

        uploadQueue.push(file);

        totalBytes += file.size;

        totalFiles++;

        fileProgress.set(
            file,
            0
        );

    }


    console.log(
        "Total file:",
        totalFiles
    );


    console.log(
        "Total ukuran:",
        formatBytes(totalBytes)
    );


    showUploadProgress();

    updateOverallProgress();

    processQueue();

}


// =====================================================
// PROCESS QUEUE
// =====================================================

function processQueue() {

    while (
        activeUploads < MAX_CONCURRENT_UPLOADS &&
        uploadQueue.length > 0
    ) {

        const file =
            uploadQueue.shift();


        activeUploads++;


        console.log(
            "Mulai upload:",
            file.name,
            "| Aktif:",
            activeUploads
        );


        uploadFile(file)

            .then(() => {

                console.log(
                    "Upload selesai:",
                    file.name
                );

            })

            .catch((error) => {

                console.error(
                    "Upload gagal:",
                    file.name,
                    error
                );

            })

            .finally(() => {

                activeUploads--;

                completedFiles++;


                updateOverallProgress();


                processQueue();


                // =========================================
                // SEMUA SELESAI
                // =========================================

                if (
                    uploadQueue.length === 0 &&
                    activeUploads === 0
                ) {

                     console.log("SEMUA UPLOAD SELESAI");

                    setUploadComplete();

                    releaseWakeLock();

                    setTimeout(() => {
                        location.reload();
                    }, 1000);

                }

            });

    }

}


// =====================================================
// UPLOAD FILE
// =====================================================

function uploadFile(file) {

    return new Promise(
        (resolve, reject) => {

            const formData =
                new FormData();


            const pathInput =
                document.querySelector(
                    "input[name='path']"
                );


            const currentPath =
                pathInput
                    ? pathInput.value
                    : "";


            formData.append(
                "file",
                file
            );


            formData.append(
                "path",
                currentPath
            );


            const xhr =
                new XMLHttpRequest();


            xhr.open(
                "POST",
                "/upload",
                true
            );


            // =========================================
            // PROGRESS FILE
            // =========================================

            xhr.upload.addEventListener(
                "progress",
                (event) => {

                    if (
                        !event.lengthComputable
                    ) {
                        return;
                    }


                    const previous =
                        fileProgress.get(file) || 0;


                    const current =
                        event.loaded;


                    const difference =
                        current - previous;


                    // Tambahkan selisih ke
                    // overall progress
                    uploadedBytes += difference;


                    fileProgress.set(
                        file,
                        current
                    );


                    updateOverallProgress();

                }
            );


            // =========================================
            // RESPONSE
            // =========================================

            xhr.onload = () => {

                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    try {

                        const result =
                            JSON.parse(
                                xhr.responseText
                            );


                        if (
                            result.success
                        ) {

                            // Pastikan file
                            // dihitung 100%
                            const previous =
                                fileProgress.get(
                                    file
                                ) || 0;


                            const remaining =
                                file.size -
                                previous;


                            if (
                                remaining > 0
                            ) {

                                uploadedBytes +=
                                    remaining;

                            }


                            fileProgress.set(
                                file,
                                file.size
                            );

                            const progressBar =
                                document.getElementById("progressBar");

                            if (progressBar) {
                                progressBar.textContent = "100% — Menyimpan ke server...";
                            }

                            updateOverallProgress();


                            resolve(result);

                        } else {

                            reject(
                                new Error(
                                    result.message ||
                                    "Upload gagal"
                                )
                            );

                        }

                    } catch (error) {

                        reject(error);

                    }

                } else {

                    reject(
                        new Error(
                            "Server error: " +
                            xhr.status
                        )
                    );

                }

            };


            // =========================================
            // NETWORK ERROR
            // =========================================

            xhr.onerror = () => {

                reject(
                    new Error(
                        "Network error"
                    )
                );

            };


            // =========================================
            // ABORT
            // =========================================

            xhr.onabort = () => {

                reject(
                    new Error(
                        "Upload dibatalkan"
                    )
                );

            };


            // =========================================
            // SEND
            // =========================================

            xhr.send(formData);

        }
    );

}


// =====================================================
// SHOW PROGRESS
// =====================================================

function showUploadProgress() {

    const progressContainer =
        document.getElementById(
            "uploadProgress"
        );


    if (progressContainer) {

        progressContainer.style.display =
            "flex";

    }

}


// =====================================================
// UPDATE OVERALL PROGRESS
// =====================================================

function updateOverallProgress() {

    const progressBar =
        document.getElementById(
            "progressBar"
        );


    if (!progressBar) {
        return;
    }


    let percent = 0;


    if (totalBytes > 0) {

        percent =
            Math.round(
                (
                    uploadedBytes /
                    totalBytes
                ) * 100
            );

    }


    // Jangan lebih dari 100%
    percent =
        Math.min(
            percent,
            100
        );


    progressBar.style.width =
        percent + "%";


    progressBar.textContent =
        percent + "%";


    progressBar.setAttribute(
        "aria-valuenow",
        percent
    );


    // Status file
    progressBar.dataset.status =
        `${completedFiles}/${totalFiles}`;


    // Tooltip / title
    progressBar.title =
        `${completedFiles} dari ${totalFiles} file selesai`;

}


// =====================================================
// UPLOAD COMPLETE
// =====================================================

function setUploadComplete() {

    const progressBar =
        document.getElementById(
            "progressBar"
        );


    if (!progressBar) {
        return;
    }


    progressBar.style.width =
        "100%";


    progressBar.textContent =
        "Upload selesai";


    progressBar.classList.remove(
        "progress-bar-animated"
    );


    progressBar.classList.add(
        "bg-success"
    );

}


// =====================================================
// FORMAT BYTES
// =====================================================

function formatBytes(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];


    const i =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(1024, i)
            ).toFixed(2)
        ) +
        " " +
        units[i]
    );

}