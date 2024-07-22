import { useState } from "react";
import { useQuery, useApolloClient  } from "@apollo/client";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import { ALL_AUTHORS, ALL_BOOKS, CURRENT_USER } from "./queries";
import LoginForm from './components/LoginForm'
import Notify from "./components/Notify";
import Recommendations from "./components/Recommendations"
import { useEffect } from "react";

const App = () => {
  const authorsResult = useQuery(ALL_AUTHORS);
  const booksResult = useQuery(ALL_BOOKS);
  const activeUserResult = useQuery(CURRENT_USER)

  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(null)
  const client = useApolloClient()

  const [page, setPage] = useState("authors");

  useEffect(() => {
    const activeToken = localStorage.getItem('books-user-token')
    if (activeToken) setToken(activeToken)
  }, [activeUserResult.data])

  if (authorsResult.loading || booksResult.loading || activeUserResult.loading) {
    return <div>loading...</div>
  }

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
    setPage("login")
  }

  const setTokenFromLogin = (token) => {
    setToken(token)
    localStorage.setItem('books-user-token', token)
    setPage("books")
  }

  return (
    <div>
      <Notify errorMessage={errorMessage} />
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {!token && <button onClick={() => setPage("login")}>login</button>}
        {token && <button onClick={() => setPage("add")}>add book</button>}
        {token && <button onClick={() => setPage("recommendations")}>recommendations</button>}
        {token && <button onClick={() => logout()}>logout</button>}
      </div>

      <Authors show={page === "authors"} authors={authorsResult.data.allAuthors} />

      <Books show={page === "books"} books={booksResult.data.allBooks}/>

      <NewBook show={page === "add"} />

      <LoginForm show={page=="login"} setToken={setTokenFromLogin} setError={notify}></LoginForm>
    
      <Recommendations show={page=="recommendations"} books={booksResult.data.allBooks} activeUser={activeUserResult.data.me}/>
    </div>
  );
};

export default App;
