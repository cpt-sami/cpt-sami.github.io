// Published Google Sheet CSV URL (File > Share > Publish to web > CSV).
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtfVz3edo5varxSeKdR_XUquCf0wGG5FtCDD3L-SZNygTX3FOwPBTKibcIdgM3-hfW5LG6trIM6pVc/pub?gid=1938684992&single=true&output=csv";
// Apps Script web app URL (Deploy > New deployment > Web app). See recommendations.gs.
const RECOMMENDATIONS_URL = "https://script.google.com/macros/s/AKfycbyDsOz0j7i5PyuPbYd5dicrKOaIDJh7_TvNUcvoMAk7BjTMoovfe9PHiF81oCqS38nz/exec";

const searchInput = document.getElementById("search");
const songList = document.getElementById("song-list");
const status = document.getElementById("status");
const recommendForm = document.getElementById("recommend-form");
const recommendStatus = document.getElementById("recommend-status");
const recommendationList = document.getElementById("recommendation-list");

let songs = [];

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
        const character = text[i];
        const nextCharacter = text[i + 1];

        if (character === '"' && quoted && nextCharacter === '"') {
            field += '"';
            i += 1;
        } else if (character === '"') {
            quoted = !quoted;
        } else if (character === "," && !quoted) {
            row.push(field);
            field = "";
        } else if ((character === "\n" || character === "\r") && !quoted) {
            if (character === "\r" && nextCharacter === "\n") {
                i += 1;
            }

            row.push(field);
            if (row.some((value) => value.trim() !== "")) {
                rows.push(row);
            }
            row = [];
            field = "";
        } else {
            field += character;
        }
    }

    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

function rowsToSongs(rows) {
    if (rows.length === 0) {
        return [];
    }

    const headings = rows[0].map((heading) => heading.trim().toLowerCase());
    const songColumn = headings.indexOf("song");
    const artistColumn = headings.indexOf("artist");

    if (songColumn === -1 || artistColumn === -1) {
        throw new Error('The CSV needs columns named "Song" and "Artist".');
    }

    return rows
        .slice(1)
        .map((row) => ({
            song: (row[songColumn] || "").trim(),
            artist: (row[artistColumn] || "").trim()
        }))
        .filter((item) => item.song || item.artist);
}

function compareText(first, second) {
    return first.localeCompare(second, undefined, {
        sensitivity: "base",
        numeric: true
    });
}

function getVisibleSongs() {
    const query = searchInput.value.trim().toLowerCase();

    return songs
        .filter((item) => {
            return item.song.toLowerCase().includes(query) ||
                item.artist.toLowerCase().includes(query);
        })
}

function renderSongs() {
    const visibleSongs = getVisibleSongs();
    const fragment = document.createDocumentFragment();

    songList.replaceChildren();

    for (const item of visibleSongs) {
        const row = document.createElement("tr");
        const songCell = document.createElement("td");
        const artistCell = document.createElement("td");

        songCell.textContent = item.song;
        artistCell.textContent = item.artist;
        row.append(songCell, artistCell);
        fragment.append(row);
    }

    songList.append(fragment);
    status.textContent = `${visibleSongs.length} song${visibleSongs.length === 1 ? "" : "s"}`;
}

async function loadSongs() {
    try {
        const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Could not load the song list (${response.status}).`);
        }

        songs = rowsToSongs(parseCsv(await response.text()));
        renderSongs();
    } catch (error) {
        status.textContent = "Could not load the song list. Try refreshing the page.";
        console.error(error);
    }
}

function renderRecommendations(recommendations) {
    const fragment = document.createDocumentFragment();

    recommendationList.replaceChildren();

    if (recommendations.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No recommendations yet. Be the first!";
        recommendationList.append(empty);
        return;
    }

    // Newest first.
    for (const item of [...recommendations].reverse()) {
        const note = document.createElement("li");
        const song = document.createElement("strong");
        const artist = document.createElement("span");

        note.className = "post-it";
        song.textContent = item.song;
        artist.textContent = item.artist;
        note.append(song, artist);
        fragment.append(note);
    }

    recommendationList.append(fragment);
}

// Apps Script answers with an HTML page (not JSON) when access is denied or the script crashes.
async function readScriptResponse(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`The recommendation script did not respond correctly (${response.status}).`);
    }
}

async function loadRecommendations() {
    try {
        const response = await fetch(RECOMMENDATIONS_URL, { cache: "no-store" });
        const data = await readScriptResponse(response);

        if (data.error) {
            throw new Error(data.error);
        }

        renderRecommendations(data.recommendations);
    } catch (error) {
        recommendationList.textContent = "Could not load recommendations.";
        console.error(error);
    }
}

async function submitRecommendation(event) {
    event.preventDefault();

    const button = recommendForm.querySelector("button");
    const formData = new FormData(recommendForm);

    button.disabled = true;
    recommendStatus.textContent = "Sending...";

    try {
        // text/plain keeps this a "simple" request, which Apps Script can accept cross-origin.
        const response = await fetch(RECOMMENDATIONS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(Object.fromEntries(formData))
        });
        const data = await readScriptResponse(response);

        if (data.error) {
            throw new Error(data.error);
        }

        recommendForm.reset();
        recommendStatus.textContent = data.duplicate ?
            "That one's already been recommended!" :
            "Thanks! Your recommendation was added.";
        renderRecommendations(data.recommendations);
    } catch (error) {
        recommendStatus.textContent = `Could not send recommendation. ${error.message}`;
        console.error(error);
    } finally {
        button.disabled = false;
    }
}

searchInput.addEventListener("input", renderSongs);
recommendForm.addEventListener("submit", submitRecommendation);

loadSongs();
loadRecommendations();
