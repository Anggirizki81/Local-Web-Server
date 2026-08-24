document.addEventListener("DOMContentLoaded", () => {

    const btnNewFolder = document.getElementById("btnNewFolder");
    const btnCreateFolder = document.getElementById("btnCreateFolder");

    if (!btnNewFolder || !btnCreateFolder) return;

    const modalElement = document.getElementById("newFolderModal");
    const modal = new bootstrap.Modal(modalElement);

    btnNewFolder.addEventListener("click", () => {

        document.getElementById("folderName").value = "";

        modal.show();

    });

    btnCreateFolder.addEventListener("click", createFolder);

});

async function createFolder() {

    const folderName = document.getElementById("folderName").value.trim();

    if (!folderName) {

        alert("Masukkan nama folder.");

        return;

    }

    const path = document.querySelector("input[name='path']").value;

    const formData = new FormData();

    formData.append("name", folderName);
    formData.append("path", path);

    const response = await fetch("/new-folder", {

        method: "POST",
        body: formData

    });

    const result = await response.json();

    if (result.success) {

        location.reload();

    } else {

        alert(result.message);

    }

}