# Aksh [Backend]
Making Data Driven Decisions from Geo-Spatial Data

### Won the 4th Prize at Smart India Hackathon 2018 (ISRO).

Android App Source Code: https://github.com/littlewonder/aksh-app
---


This is the backend of Speaking Geo-GP assistant.

### Following is our tech-stack:

* **Raw Dataset** which includes satellite imagery, metadata and some demographic data provided by `ISRO` and `Census of 2011`.

* **MongoDB** as database since it provides flexible query mechanism for geospatial data.

* **NodeJS** for backend, making it asynchronous, scalable, and agile.
  We use `ExpressJS` to implement a web API which communicates with the Android application.

* **NLP library** for analyzing command and intent from text.

* **Translation library** for translating between regional languages.

---

### Below is the description of the files and directory structure

* `index.js` : The entry point of the express app.
* `queries.js` : This file houses all required methods for geographical queries.
* `queryMapping.js` : This file maps intent obtained from natural language processing to respective database query.

* `populate-database.js` : This script reads given data from ISRO and populates MongoDB database to optimize queries.
