import { BrowserRouter, Route, Routes } from './router'
import { AppProvider } from './context/AppContext'
import Home from './pages/Home'
import MoviePage from './pages/MoviePage'
import UniversePage from './pages/UniversePage'
import SearchPage from './pages/SearchPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/universe/:id" element={<UniversePage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
