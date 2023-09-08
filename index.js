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
    const appointmentOptionsCollection = client
      .db("Dentop")
      .collection("appointmentOptions");
    const bookingsCollection = client.db("Dentop").collection("bookings");

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
      const service = await serviceCollection.findOne(query).toArray();

      res.send(service);
    });

    //load service for booking slots only
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //get appoinmentOptions
    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentOptionsCollection.find(query).toArray();
      //allreadyBooked Products of the date
      const bookingQuery = { appointmentDate: date };
      const allreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();

      options.forEach((option) => {
        const optionBooked = allreadyBooked.filter(
          (book) => book.treatment === option.name
        );

        const bookedSlots = optionBooked.map((book) => book.slot);

        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );

        //set options slots to remaining slots
        option.slots = remainingSlots;
      });

      res.send(options);
    });

    //post appointment from single service
    app.post("/appointment", async (req, res) => {
      const appointment = req.body;
      console.log(appointment, "appointment body");
      //limit one user to take one appointment
      const query = {
        appointmentDate: appointment.appointmentDate,
        email: appointment.email,
        treatment: appointment.treatment,
      };

      // const alreadyBooked= await bookingsCollection.find(query).toArray()
      // console.log(alreadyBooked, 'alreadyBooked')
      // if (alreadyBooked.appointmentDate===appointment.appointmentDate){
      //   const message= `You already have a booking on ${appointment.appointmentDate}`
      //   return res.send({acknowledged:false, message})
      // }

      const result = await bookingsCollection.insertOne(appointment);
      res.send(result);
    });

    //post booking

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      //limit one user to take one appointment
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
      // console.log(result);
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
      // check if already added review
      const query= {
        serviceName: review.serviceName,
        email: review.email
      }
      console.log(query, "query check")
      const allreadyAdded= await reviewCollection.find(query).toArray()
      
      if(allreadyAdded.length){
        const message= `You already added a review for ${review.serviceName}`
        return res.send({acknowledged:false, message})
      }
      
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
    
    //get my appointments
    app.get("/myappointment", async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      
      const appointments = await bookingsCollection.find(query).toArray();
      res.send(appointments);
      
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
