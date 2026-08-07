# Models

This project keeps queries close to controllers for beginners: every controller imports the shared MySQL pool from `config/db.js` and uses parameterized queries. As the app grows, move each table's queries into a model file in this folder.
