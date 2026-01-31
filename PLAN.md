## Plan: Svelte App with CSV Import for Lifecycle Data

Build a Svelte web app focused on robust CSV import, allowing users to upload Lifecycle exports and replace all existing data with each import. The app will parse and store the data in memory for further processing.

### Steps
- [x] Scaffold a Svelte app in [lifecycle-web](lifecycle-web).
- [ ] Implement a file input component for CSV upload.
- [ ] Integrate a CSV parser (e.g., `papaparse` or similar JS library).
- [ ] On upload, parse the CSV and replace all in-memory data with the new import.
- [ ] Add basic error handling for invalid or malformed CSV files.

### Further Considerations
1. Proceed with "delete all and import fresh" for simplicity and reliability.
2. Consider how to structure in-memory data for easy future insights.
3. UI/UX for upload: drag-and-drop, progress, and error messages.