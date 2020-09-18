const express = require('express');
const app = express();

app.set('port', process.env.PORT || 1337)
app.locals.title = 'Smell Ya Later'

app.get('/', (request, response) => {
    response.send(`Welcome to ${app.locals.title}`)
})

app.listen(app.get('port'), () => {
    console.log(`${app.locals.title} is running on http://localhost:${app.get('port')}`)
});