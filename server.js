const express = require('express');
const items = require('./items');
const cors = require('cors')
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const bodyParser = require('body-parser')
require('dotenv').config()
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
);

const app = express();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE"
    )
    next();
});

app.set('port', process.env.PORT || 1337)
app.locals.title = 'Smell Ya Later'
app.locals.items = items.items
app.locals.messages = []
client.messages.list()
    .then(messages => messages.forEach(m => app.locals.messages.push(m)))

app.get('/', (request, response) => {
    response.send(`Welcome to ${app.locals.title}`)
})

app.get('/api/v1/items', (request, response) => {
    const items = app.locals.items

    response.json({ items })
})

app.post('/api/v1/items', (request, response) => {
    response.header('Content-Type', 'application/json')
    const requiredProperties = [ 'imageUrl', 'name'];
    const receivedProperties = Object.keys(request.body);

    for(let property of requiredProperties) {
        if(!receivedProperties.includes(property)) {
            return response.status(422).json({error: `Cannot POST: missing property ${property} in request.`})
        }
    }

    let message;
    const item = {
        id: Date.now(),
        name: request.body.name,
        imageUrl: request.body.imageUrl
    }

    app.locals.items[item.id] = item
    message = `${item.name} has been added to your Smell Kit`

    return response.status(201).json({ message })
})

app.get('/api/v1/messages', (request, response) => {
    const messages = app.locals.messages

    response.json({ messages })
})

app.post('/api/v1/messages', (req, res) => {
    res.header('Content-Type', 'application/json')
    client.messages
        .create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: req.body.to,
            body: req.body.body
        })
        .then(() => {
            res.send(JSON.stringify({ success: true }))
        })
        .catch(err => {
            console.log(err);
            res.send(JSON.stringify({ success: false }))
        })
})

app.delete('/api/v1/messages/:id', (request, response) => {
    response.header('Content-Type', 'application/json')
    const { id } = request.params;

    if(!id) {
        return response.status(422).json({ errorMessage: 'No message id included in request'});
    };
    const foundMessage = app.locals.messages.find(message => message.sid == id)

    if(!foundMessage) {
        return response.status(404).json({ errorMessage: `Cannot DELETE: no message with an id of ${id} found`})
    }

    client.messages(id).remove()
    const shortenedMessages = app.locals.messages.filter(message => message.sid != id)
    app.locals.messages = shortenedMessages
    response.sendStatus(204)
})

app.post('/api/v1/sms', (request, response) => {
    newMessage = {
        direction: 'inbound',
        body: request.body.Body,
        dateCreated: Date.now(),
        id: request.body.MessageSid
    }

    const newMessages = [newMessage, ...app.locals.messages]
    app.locals.messages = newMessages
    const twiml = new MessagingResponse();

    const message = twiml.message('Thanks for your response!')

    response.writeHead(200, { 'Content-Type': 'text/xml' })
    response.end(twiml.toString());
})

app.listen(app.get('port'), () => {
    console.log(`${app.locals.title} is running on http://localhost:${app.get('port')}`)
});