document.addEventListener("DOMContentLoaded", () => {

    const deleteButtons = document.querySelectorAll(".btn-delete");

    deleteButtons.forEach((button) => {

        button.addEventListener("click", async () => {

            const name = button.dataset.name;
            const path = button.dataset.path;
            const isDir = button.dataset.dir === "true";

            const itemType = isDir ? "folder beserta seluruh isinya" : "file";

            const confirmed = confirm(
                `Yakin ingin menghapus ${itemType} "${name}"?\n\nTindakan ini tidak dapat dibatalkan.`
            );

            if (!confirmed) {
                return;
            }

            const formData = new FormData();

            formData.append("path", path);
            formData.append("name", name);

            try {

                button.disabled = true;

                const response = await fetch("/delete", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (result.success) {

                    location.reload();

                } else {

                    alert(result.message || "Gagal menghapus.");

                    button.disabled = false;

                }

            } catch (error) {

                console.error(error);

                alert("Terjadi kesalahan saat menghapus.");

                button.disabled = false;

            }

        });

    });

});