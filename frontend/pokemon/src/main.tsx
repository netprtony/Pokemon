import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// import ở đầu file main.tsx hoặc App.tsx
import "bootstrap-icons/font/bootstrap-icons.css";
import { UserProvider } from "./contexts/UserContext";
import { BrowserRouter } from "react-router-dom";
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </UserProvider>
  </StrictMode>,
)
