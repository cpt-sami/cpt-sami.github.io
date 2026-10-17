// Google Apps Script for song recommendations.
// Paste this into the song list spreadsheet via Extensions > Apps Script,
// then Deploy > New deployment > Web app, Execute as "Me", access "Anyone".
// Put the web app URL in RECOMMENDATIONS_URL in song-finder.js.

const SHEET_NAME = "Recommendations";
const MAX_LENGTH = 100;

function doGet() {
    return json({ recommendations: getRecommendations() });
}

function doPost(e) {
    let data;

    try {
        data = JSON.parse(e.postData.contents);
    } catch (error) {
        return json({ error: "Invalid request." });
    }

    // Honeypot field: people never see it, bots fill it in.
    if (data.website) {
        return json({ recommendations: getRecommendations() });
    }

    const song = clean(data.song);
    const artist = clean(data.artist);

    if (!song || !artist) {
        return json({ error: "Song and artist are both required." });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
        const recommendations = getRecommendations();
        const duplicate = recommendations.some((item) => {
            return item.song.toLowerCase() === song.toLowerCase() &&
                item.artist.toLowerCase() === artist.toLowerCase();
        });

        if (!duplicate) {
            // Prefix a quote so text like "=HYPERLINK(...)" is stored as text, not a formula.
            getSheet().appendRow([new Date(), safeCell(song), safeCell(artist)]);
            recommendations.push({ song: song, artist: artist });
        }

        return json({ recommendations: recommendations, duplicate: duplicate });
    } finally {
        lock.releaseLock();
    }
}

function getSheet() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
        sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    // Make sure row 1 is the header, even if the tab was made by hand and already has data.
    const firstCell = String(sheet.getRange(1, 2).getDisplayValue()).trim().toLowerCase();

    if (firstCell !== "song") {
        if (sheet.getLastRow() > 0) {
            sheet.insertRowBefore(1);
        }

        sheet.getRange(1, 1, 1, 3).setValues([["Submitted", "Song", "Artist"]]);
    }

    return sheet;
}

function getRecommendations() {
    return getSheet()
        .getDataRange()
        .getDisplayValues()
        .slice(1)
        .map((row) => ({ song: row[1].trim(), artist: row[2].trim() }))
        .filter((item) => item.song || item.artist);
}

function clean(value) {
    return String(value || "").trim().slice(0, MAX_LENGTH);
}

function safeCell(text) {
    return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
