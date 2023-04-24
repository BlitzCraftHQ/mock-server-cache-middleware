const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const axios = require("axios");

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const dotenv = require("dotenv");
dotenv.config();

const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});
redisClient.connect();
redisClient.on("error", (err) => console.log("Redis Client Error", err));

app.get("*", async (req, res) => {
  try {
    let key = req.url;
    let data = await redisClient.get(key);
    if (data) {
      console.log(`Got From Redis : ${key}`);
      res.json(JSON.parse(data));
    } else {
      await axios
        .get(`${process.env.MOCK_URL}${key}`)
        .then((res) => res.data)
        .then(async (data) => {
          console.log(`Setting in Redis : ${key}`);
          await redisClient.set(key, JSON.stringify(data));
          res.json(data);
        })
        .catch((err) => {
          res.status(500);
          res.json(err);
        });
    }
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json(err);
  }
});

app.listen(parseInt(process.env.PORT || "5000"), "0.0.0.0", () => {
  console.log(`Server is listening on port ${process.env.PORT || "5000"}`);
  console.log("http://localhost:5000");
});
