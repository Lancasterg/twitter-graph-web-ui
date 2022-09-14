# comsm0104
COMSM0104 Web Technologies Coursework

## Authors
* Justin Salmon (wr18313@bristol.ac.uk)
* George Lancaster (qv18258@bristol.ac.uk)

## Report

The final assessment report can be found at [report/final.html](report/final.html).

## Concept
This project aims to visualise the relationships between Twitter users. By entering a username,
a Twitter users post history is downloaded and input into a graph database for processing. This 
allows us to apply algorithms like pagerank to gain a richer understanding of the relationships in the 
social network. After querying the database, relationships will be plotted in an easily interpretable
and interactive graph. 

## Tools and Frameworks
- Frontend: Vue.js / D3.js / Bootstrap 4
- Server: Express.js
- Database: Neo4j

## Getting the site up and running

Install prerequisites:
```
npm install
```

Run the embedded Neo4J database (Linux/Mac only, requires Java 8):
```
database/start-embedded.sh
```
The database can be stopped with `database/stop-embedded.sh`.

Build the frontend and serve it on localhost:
```
npm start
```
This will start both frontend and backend in a hot-reloadable configuration, suitable for development.
The website will be available at [http://localhost:8080/](http://localhost:8080/).

## Deploying to the cloud

Run the linter and fix any issues:
```
npm run lint
```

Make a production build:
```
npm run build
```

Upload frontend to S3 bucket and sync backend (requires credentials):
```
./deploy.sh
```
