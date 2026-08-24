document.addEventListener("DOMContentLoaded", () => {

    const renameButtons = document.querySelectorAll(".btn-rename");

    const modalElement = document.getElementById("renameModal");
    const oldNameInput = document.getElementById("renameOldName");
    const pathInput = document.getElementById("renamePath");
    const newNameInput = document.getElementById("renameNewName");
    const btnConfirmRename = document.getElementById("btnConfirmRename");

    if (
        !renameButtons.length ||
        !modalElement ||
        !oldNameInput ||
        !pathInput ||
        !newNameInput ||
        !btnConfirmRename
    ) {
        return;
    }

    const modal = new bootstrap.Modal(modalElement);

    renameButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const oldName = button.dataset.name;
            const path = button.dataset.path;

            oldNameInput.value = oldName;
            pathInput.value = path;
            newNameInput.value = oldName;

            modal.show();

            setTimeout(() => {
                newNameInput.focus();
                newNameInput.select();
            }, 300);

        });

    });


    btnConfirmRename.addEventListener("click", async () => {

        const oldName = oldNameInput.value.trim();
        const newName = newNameInput.value.trim();
        const path = pathInput.value;

        if (!newName) {

            alert("Masukkan nama baru.");

            return;

        }

        const formData = new FormData();

        formData.append("path", path);
        formData.append("old_name", oldName);
        formData.append("new_name", newName);

        try {

            const response = await fetch("/rename", {

                method: "POST",
                body: formData

            });

            const result = await response.json();

            if (result.success) {

                modal.hide();

                location.reload();

            } else {

                alert(result.message || "Gagal mengubah nama.");

            }

        } catch (error) {

            console.error(error);

            alert("Terjadi kesalahan saat mengubah nama.");

        }

    });


    newNameInput.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            btnConfirmRename.click();

        }

    });

});