import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import News from './pages/News';
import Following from './pages/Following';
import CategoryNews from './pages/CategoryNews';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // Check if current page should hide sidebar
  const hiddenPages = ['/login', '/register', '/news', '/following'];
  const shouldShowSidebar = !hiddenPages.includes(location.pathname);
  
  // Check if current page is an auth page (login or register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Apply auth-page class to body when on auth pages
  useEffect(() => {
    if (isAuthPage) {
      document.body.classList.add('auth-page-body');
    } else {
      document.body.classList.remove('auth-page-body');
    }
    
    // Clean up on unmount
    return () => {
      document.body.classList.remove('auth-page-body');
    };
  }, [isAuthPage]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <AuthProvider>
      <div className={`app ${isAuthPage ? 'auth-app' : ''}`}>
        <Navbar />
        <div className="main-container">
          {!isAuthPage && <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />}
          <main className={`content ${isAuthPage ? 'auth-content' : ''}`}>
            <Routes>
              {/* Private Routes - Only accessible when logged in */}
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/news" 
                element={
                  <PrivateRoute>
                    <News />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/following" 
                element={
                  <PrivateRoute>
                    <Following />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/category/:category" 
                element={
                  <PrivateRoute>
                    <CategoryNews />
                  </PrivateRoute>
                } 
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Redirect any unknown routes to Home or Login based on auth status */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
        {shouldShowSidebar && !isAuthPage && (
          <button className="toggle-sidebar-mobile" onClick={toggleSidebar}>
            {isSidebarOpen ? '←' : '→'}
          </button>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
