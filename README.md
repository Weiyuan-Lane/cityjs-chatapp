# Hello CityJS participants!

A quick rundown of the dependencies of this Chat App:
- Angular v21
- Node v24.13

## Frontend Development

Run the following command to run the frontend angular service
```
npm run start-frontend
```

## Backend Development

Run the following command to run the backend node + frontend service
```
npm run start-e2e
```

Note that you should use `gcloud auth application-default login` for running this locally in your system to associate with your Google Cloud account
You also need to run `gcloud services enable aiplatform.googleapis.com` once at when running this project (or enable directly from Google Cloud)

## Production

Build the docker image directly and push to production in cloud run!
