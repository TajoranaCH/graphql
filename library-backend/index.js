const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')
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
  type User {
    username: String!
    favouriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

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
    me: User
  }

  type Mutation {
    addBook(
      title: String!,
      author: String!,
      published: Int,
      genres: [String!]!
    ): Book

    editAuthor(name: String!, setBornTo: Int!): Author
    
    login(
    username: String!
    password: String!
    ): Token

    createUser(username: String!, favouriteGenre: String!): User

  }
  
`

const notAuthenticated = () => {
  throw new Error('not authenticated')
}

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args, context) => {
      const filters = {}
      
      if (args.genre) filters.genres = { '$all': [ args.genre ] }
      try {
        let res = await Book.find(filters).populate('author', { name: 1, _id: 1, born: 1})
        if (args.author) res = res.filter(b => b.author.name === args.author)
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
      } catch (error) {
        console.log(error)
        throw new GraphQLError('finding books failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error
          }
        })
      }
      },
    allAuthors: async (root, args) => {
      const books = await Book.find({}).populate('author', { name: 1, _id: 1, born: 1})
      let res = await Author.find({})
      res = res.map(a => {
        return {
          id: a._id,
          name: a.name,
          bookCount: books.reduce((authorBookCount, book) => {
            if (book.author.name === a.name) authorBookCount += 1
            return authorBookCount
          }, 0),
          born: a.born
        }
      })
      return res
    },
    me: (root, args, context) => {
      if (!currentUser) {
        notAuthenticated()
      }
      return context.currentUser
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        notAuthenticated()
      }

      let book = await Book.findOne({ title: args.title })
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
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        notAuthenticated()
      }

      const author = await Author.findOne({ name: args.name })
      let bookCount
      if (!author) {
        return null
      }

      try {
        await Author.updateOne({ name: args.name }, { born: args.setBornTo })
        bookCount = await Book.countDocuments({ author: { _id: author._id }})
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

      return { name: args.name, born: args.setBornTo, bookCount: bookCount }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secret' ) {
        throw new GraphQLError('wrong credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        })        
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
    createUser: async (root, args) => {
      let user = await User.findOne({ username: args.username })
      if (user) return null
      user = new User({ username: args.username, favouriteGenre: args.favouriteGenre })
  
      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        })
    },
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      )
      const currentUser = await User
        .findById(decodedToken.id)
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})