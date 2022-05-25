const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

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

        app.put('/paidorder/:id', async (req, res) => {
            const id = req.params.id;
            console.log(req.body);
            const paymentId = req.body.transectionId;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    paid: true,
                    paymentId: paymentId
                }
            }
            const result = await orderCollection.updateOne(query, updateDoc, options);
            console.log(result);
            res.send(result)
        })

        app.post("/create-payment-intent", async (req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"]
            });

            res.send({ clientSecret: paymentIntent.client_secret });
        });

        //checking for admin role
        async function isAdmin(req, res, next) {
            const email = req.query.email;
            const filter = { email: email };
            const user = await userCollection.findOne(filter);
            if (user.role === 'admin') {
                next()
            }
            else {
                res.status(401).send({ message: 'Unauthorized access' })
            }
        }


        app.delete('/deleteorder', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

        //for payment route
        app.get('/parts', async (req, res) => {
            const id = req.query.id;
            console.log(req.query);
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.findOne(query);
            console.log(result);
            res.send(result);
        })

        //API ror deleting the product
        app.delete('/deleteproduct', isAdmin, async (req, res) => {
            const productId = req.query.id;
            const email = req.query.email;
            const query = { _id: ObjectId(productId) };
            const result = await partsCollection.deleteOne(query);
            console.log(result);
            res.send(result)

        })

        app.get('/makeadmin', isAdmin, async (req, res) => {
            const userId = req.query.id;
            const email = req.query.email;
            const query = { _id: ObjectId(userId) };
            const user = await userCollection.findOne(query);
            if (user.role !== 'admin') {
                const options = { upsert: true };
                const updateDoc = {
                    $set: { role: 'admin' }
                }
                const adminUser = await userCollection.updateOne(query, updateDoc, options);

                res.send(adminUser)
            }
        })
        app.get('/removeadmin', isAdmin, async (req, res) => {
            const userId = req.query.id;
            const email = req.query.email;
            const query = { _id: ObjectId(userId) };
            const userSelected = await userCollection.findOne(query);
            if (userSelected.role === 'admin') {
                const options = { upsert: true };
                const updateDoc = {
                    $set: { role: ' ' }
                }
                const normalUser = await userCollection.updateOne(query, updateDoc, options);

                res.send(normalUser)
            }
        })

        app.post('/addproduct', isAdmin, async (req, res) => {
            const parts = req.body;
            const email = req.query.email;
            const result = partsCollection.insertOne(parts);
            res.send(result);
        })
        app.get('/manageorders', isAdmin, async (req, res) => {
            const query = {};

            const result = await orderCollection.find(query).toArray();
            res.send(result);
        })


        app.get('/allproducts', isAdmin, async (req, res) => {
            const filter = {};
            const products = await partsCollection.find(filter).toArray();
            res.send(products);
        })


        app.get('/allusers', isAdmin, async (req, res) => {
            const filter = {};
            const user = await userCollection.find(filter).toArray();
            res.send(user);
        })

        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const user = await userCollection.findOne(filter);
            res.send(user);
        })


        app.get('/myorders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        })
        app.get('/reviews', async (req, res) => {
            const query = {};
            const result = await reviewCollection.find(query).toArray();
            res.send(result);
        })

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
            res.send(result)
        })
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })



        app.get('/homeparts', async (req, res) => {
            const query = {};
            const cursor = await partsCollection.find(query).toArray();
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