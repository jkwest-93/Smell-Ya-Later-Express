const express = require('express');
const items = require('./items');
const cors = require('cors');

const app = express();
app.use(cors());

app.set('port', process.env.PORT || 1337)
app.locals.title = 'Smell Ya Later'
app.locals.items = items.items

app.get('/', (request, response) => {
    response.send(`Welcome to ${app.locals.title}`)
})

app.get('/api/v1/items', (request, response) => {
    const items = app.locals.items

    response.json({ items })
})

app.listen(app.get('port'), () => {
    console.log(`${app.locals.title} is running on http://localhost:${app.get('port')}`)
});