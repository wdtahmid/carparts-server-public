const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config()

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.pdmjf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const partsCollection = client.db("carParts").collection("parts");
        const orderCollection = client.db("carParts").collection("orders");
        const reviewCollection = client.db("carParts").collection("reviews");
        const userCollection = client.db("carParts").collection("users");

        app.get('/profileinfo', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })
        app.put('/updateprofile', async (req, res) => {
            const profile = req.body;
            const email = req.query.email;
            const filter = { email: email };
            console.log(filter);
            const options = { upsert: true };
            const updateDoc = {
                $set: profile
            }
            const result = userCollection.updateOne(filter, updateDoc, options);
            console.log(result);
        })

        app.put('/addtoprofile', async (req, res) => {
            const profile = req.body;
            const email = req.query.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: profile
            }
            const result = userCollection.updateOne(filter, updateDoc, options)
        })


        app.put('/upsertuser', async (req, res) => {
            const user = req.body;
            const email = req.body.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
        })


        app.post('/addreview', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            console.log(result);
            res.send(result)
        })
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            console.log(result);
            res.send(result)
        })

        app.get('/myorders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = await partsCollection.find(query).toArray();
            console.log(cursor);
            res.send(cursor)
        })
        app.get('/purchase/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = await partsCollection.findOne(query);
            res.send(cursor)
        })

    } finally {
        //await client.close();
    }
}
run().catch(console.dir);



















app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})