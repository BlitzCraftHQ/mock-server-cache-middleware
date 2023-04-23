const express = require('express')
const app = express();

const dotenv = require('dotenv');
dotenv.config();

const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
})

redisClient.connect()

redisClient.on("error", (err) => console.log("Redis Client Error", err));

app.get('*', async (req, res) => {
  let key = req.url.split("?")[0]
  let data = await redisClient.get(key)
  if (data) {
    console.log(`From Redis : ${key}`)
    res.json(JSON.parse(data))
  } else {
    let data = await fetch(`${process.env.MOCK_URL}${key}`)
    let jsonData = await data.json()
    console.log(`Setting in Redis : ${key}`)
    await redisClient.set(key, JSON.stringify(jsonData))
    res.json(jsonData)
  }
})

app.listen(5000, () => {
  console.log("Server is listening on port 5000");
})