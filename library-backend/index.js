const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
require('dotenv').config()

mongoose.set('strictQuery', false)
const MONGODB_URI=process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

/*
  you can remove the placeholder query once your first one has been implemented
*/

const typeDefs = `
  type Author {
    name: String!
    born: Int
    id: ID!
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]!
    allAuthors: [Author]!
  }

  type Mutation {
    addBook(
      title: String!,
      author: String!,
      published: Int,
      genres: [String!]!
    ): Book

    editAuthor(name: String!, setBornTo: Int!): Author
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args, context) => {
      const filters = {}
      if (args.author) filters.author = { name: args.author }
      if (args.genre) filters.genres = { '$all': [ args.genre ] }
      const res = await Book.find(filters).populate('author', { name: 1, id: 1, born: 1})
      const bookCountPerAuthor = res.reduce((res, book) => {
        if (res[book.author.name]) {
          res[book.author.name] += 1
          return res
        }
        res[book.author.name] = 1
        return res
      }, {})
      return res.map(b => {
        b.author.bookCount = bookCountPerAuthor[b.author.name] || 0
        return b
      })
      },
    allAuthors: async (root, args) => {
      let res = await Author.find({})
      res = res.map(a => {
        return {
          id: a._id,
          name: a.name,
          bookCount: a.bookCount || 0,
        }
      })
      return res
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      let book = await Book.findOne({ title: args.title })
      console.log(book)
      if (book) throw new Error('book already exists')
      book = new Book({ ...args })

      let author = await Author.findOne({ name: args.author })
      if(!author) {
        author = new Author({ name: args.author })
        author = await author.save()
      }
      try {
        book.author = author._id + ''
        await book.save()
      } catch (error) {
        throw new GraphQLError('Adding book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error
          }
        })
      }
      return { ...args, ...book, author: { name: author.name, bookCount: author.bookCount || 1, id: author._id + '' } }
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      console.log(author)
      if (!author) {
        return null
      }

      try {
        await Author.updateOne({ name: args.name }, { born: args.setBornTo })
      } catch (error) {
        console.log(error)
        throw new GraphQLError('Updating author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error
          }
        })
      }

      return { name: args.name, born: args.setBornTo, }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})