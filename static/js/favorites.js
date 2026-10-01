document.addEventListener("DOMContentLoaded", function () {

    const favoriteButton = document.getElementById("btnSidebarFavorite");
    const favoriteStar = document.getElementById("favoriteStar");

    if (!favoriteButton || !favoriteStar) {
        return;
    }

    const path = favoriteButton.dataset.path;

    // Kalau sedang di Home, tidak ada folder yang bisa di-Favorite
    if (!path) {
        return;
    }

    // Status awal diambil dari class yang diberikan Flask
    const initiallyFavorite =
        favoriteStar.classList.contains("is-favorite");

    updateStar(initiallyFavorite);

    favoriteButton.addEventListener("click", async function (event) {

        event.preventDefault();

        try {

            const response = await fetch("/favorite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    path: path
                })
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.message || "Gagal mengubah Favorites");
                return;
            }

            // Ubah warna/icon sesuai hasil dari server
            updateStar(result.is_favorite);

            // Reload supaya daftar Favorites di Sidebar ikut berubah
            setTimeout(() => {
                location.reload();
            }, 200);

        } catch (error) {

            console.error("Favorite error:", error);

            alert("Terjadi kesalahan saat mengubah Favorites");

        }

    });


    function updateStar(isFavorite) {

        if (isFavorite) {

            favoriteStar.classList.remove("bi-star");
            favoriteStar.classList.add("bi-star-fill");
            favoriteStar.classList.add("is-favorite");

            favoriteButton.title = "Remove from Favorites";

        } else {

            favoriteStar.classList.remove("bi-star-fill");
            favoriteStar.classList.add("bi-star");
            favoriteStar.classList.remove("is-favorite");

            favoriteButton.title = "Add to Favorites";

        }

    }

});