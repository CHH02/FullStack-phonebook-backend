require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()
morgan.token('body', request => JSON.stringify(request.body))

app.use(express.static('dist'))
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

let persons = []
Person.find({}).then(result => persons = result)

app.get('/api/persons', (request, response) => {
    Person.find({}).then((persons) => {
        response.json(persons)
    })
})

app.get('/info', (request, response) => {
    Person.find({}).then((perons) => {
        response.send(`
                <p>Phonebook has info for ${persons.length} ${(persons.length === 1) ? 'person' : 'people'}</p>
                <p>${Date(Date.now()).toString()}</p>
        `)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
  
    Person.findById(id)
        .then((person) => {
            response.json(person)
        })
        .catch((error) => {
            next(error)
            console.log('error finding person by ID:', error.message);
            response.status(404).end()
        })
})

app.delete('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Person.findByIdAndDelete(id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))  
})
  
app.post('/api/persons', (request, response, next) => {
    const body = request.body
  
    if (!body.name) {
        return response.status(400).json({ 
            error: 'name missing' 
        })
    } else if (!body.number) {
        return response.status(400).json({
            error: 'number missing'
        })
    } else if (persons.some(n => n.name === body.name)) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }
  
    const person = new Person({
      name: body.name,
      number: body.number
    })
    
    person.save().then((savedPerson) => {
        response.json(savedPerson)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body
  
    Person.findById(request.params.id)
      .then(person => {
        if (!person) {
          return response.status(404).end()
        }
  
        person.name = name
        person.number = number
  
        return person.save().then((updatedPerson) => {
          response.json(updatedPerson)
        })
      })
      .catch(error => next(error))
  })

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
  
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})