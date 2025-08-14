# National Park Finder

A full stack MERN web app allowing users to filter national parks based on interest

## Link
https://quick-parks-national-park-finder.vercel.app/

## About this Project

This project is an application that allows users to find national parks of their choice by inputing preferred activies, topics, and distance radius. A neat list of parks is then rendered when the user clicks on the search button. This project was a passion project of mine. As I explored different national parks, I became more interested in hiking and nature and wanted to develop a tool that could help me find the best places to hike.

### Features
* Login/Sign-up/Persisted Session
* Filtering through parks by using the NPS API
* Allowing users to save parks in their account

### Tech Stack
* Frontend: React (Vite)
* Backend: Node.js, Express
* Database: MongoDB Atlas 
* External API: NPS Developer API 
* Infrastructure: Vercel (client) + Render (server)
  
## Deploying Instructions

### Prerequisites
* Node.js
* NPS(National Park Services) API key
* Mongo Altas account

### Installing
1. Create a free MongoDB cluster
   * allow network access from anywhere
   * get your SRV connection string
2. Clone repo
3. Install dependiencies on both client and server
```bash
cd server
npm install
```
```bash
cd client
npm install
```
4. Create MongoDB atlas cluster 
5. Create a .env file in the client for you backend api base
```bash
VITE_API_BASE=http://localhost:4000
```
6. Create a .env file in the client and add these env variables
```bash
MONGODB_URI=your_atlas_srv_uri
JWT_SECRET=some_long_random_value
NPS_API_KEY=your_nps_api_key
CORS_ORIGIN=http://localhost:5173
```
7. Run the starting scripts
```bash
cd server
npm run dev
```
```bash
cd client
npm run dev
```
8. Open the web app in your browser (http://localhost:5173)


