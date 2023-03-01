const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

//mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.z1jayhr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//

async function run() {
  try {
    const serviceCollection = client.db("Dentop").collection("Services");
    const reviewCollection = client.db("Dentop").collection("reviews");

    //load  services
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });
    //load single service
    app.get("/services/:name", async (req, res) => {
      const name = req.params.name;
      const query = { name: name };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //add service

    app.post("/service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
     
      res.send(result);
    });

    //post review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      
      res.send(result);
    });

    //  load single service review
    app.get("/reviews", async (req, res) => {
      console.log(req.query.name);
      let query = {};
      if (req.query.name) {
        query = {
          serviceName: req.query.name,
        };
      }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    //load signle user's reviews with email query

    app.get("/myreviews", async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
      console.log(reviewCollection);
    });

    //load all services
    app.get("/allservices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const allservices = await cursor.toArray();
      res.send(allservices);
    });

    //update review

    app.patch("/review/:id", async (req, res) => {
      const id = req.params.id;
      const text = req.body.text;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          reviewText: text,
        },
      };
      const result = await reviewCollection.updateOne(query, updateDoc);
      res.send(result);
      console.log(result);
    });
    //delete review
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
      console.log(result);
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send({ running: "true" });
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
