import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Room from './pages/Room';
import Home from './pages/Home';
import CanvasPage from './pages/Canvas'; // placeholder for your canvas component
import Signup from './pages/Signup';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='/room' element={<Room/>}/>
        <Route path="/canvas/:roomId" element={<CanvasPage />} />
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/about' element={<About/>}/>
        <Route path='/contact' element={<Contact/>}/>
      </Routes>
    </Router>
  );
}

export default App;
