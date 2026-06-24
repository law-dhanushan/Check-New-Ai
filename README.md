# Court Role Book — PWA

This repository contains a Progressive Web App (PWA) that helps you maintain a court role book and prepare daily court lists. It is simple to host via GitHub Pages and can be saved/installed on a phone as an app.

What the app does
- Store cases locally in your browser (no server required). Data persists in your browser storage.
- Add and update case next dates and next steps. Case number and date are mandatory.
- Import data from Excel/CSV or from a Google Sheets CSV export (read-only sync from Google Sheet).
- Display a monthly calendar. Click any date to view cases grouped by Next Step (Trial, Defense Trial, Submission, Argument/Inquiry, Calling).
- Export the selected day's list to Excel, PDF, or Word (.doc).
- Preserve history of previous dates/steps for each case (viewable by searching case number).

Google Sheets sync (read-only)
- The app can import (sync) data from a Google Sheet that you publish as a CSV.
- Steps to get the CSV URL:
  1. Open your Google Sheet.
  2. File gt Share gt Publish to web.
  3. In Publish to web choose the Sheet (not entire document) and choose CSV format (or publish and copy link then modify to export? See below).
  4. The generated URL will look like: https://docs.google.com/spreadsheets/d/<<SHEET_ID>>/export?format=csv&gid=0
  5. Paste that URL into the app's Google Sheets URL field and click "Sync Now (Google Sheet)".
- Auto-sync: You can enable Auto-sync and set an interval in minutes. The app will periodically pull the CSV and import rows.

Notes and limitations
- Google sync implemented here is read-only (app pulls data from the published CSV). Writing back to Google Sheets requires additional setup (Google OAuth or an Apps Script web endpoint) which I can help set up if you want.
- Data is stored locally in each browser/device. To access the same data across devices you can:
  - Use the Google Sheet as the primary source and Auto-sync on each device (recommended if you manage the sheet centrally).
  - Or request a cloud sync (e.g., Firebase) — I can add that for a small extra step.

Publish to GitHub Pages (easy steps)
1. In this repository: files are already added. If you want me to push updates, I can.
2. Go to Settings gt Pages in your repository on GitHub.
3. Under "Build and deployment", select the branch "main" and the folder "/ (root)". Click Save.
4. Within a minute the site will be available at: https://<your-username>.github.io/<repo-name>/
5. Open it on your phone. Use the browser menu gt Add to Home screen / Install to make it behave like an app.

If you want me to:
- Enable two-way Google Sheets sync (so changes in the app update the Google Sheet), I can provide a ready-to-deploy Google Apps Script and update the app to call it. You will need to deploy the Apps Script as a web app under your Google account (I will provide step-by-step instructions and the code).
- Add cloud sync using Firebase (so data syncs automatically across devices) — I can add this and set up the Firebase project, or provide instructions for you to create a Firebase project and I'll wire the app to it.

Tell me which option you prefer for cross-device syncing:
- A: Continue using Google Sheets (read-only sync). I will finish and publish the app and give final instructions.
- B: I set up a Google Apps Script endpoint to allow two-way sync (requires you to authorize/deploy it). I will provide the script and guide you through deployment.
- C: Use Firebase for real-time two-way sync (I'll help set up the project and integrate it).

If you want me to publish to GitHub Pages for you, confirm and I'll enable Pages by creating a branch and file commit if necessary, and then provide the live URL and final steps to Add to Home screen.
