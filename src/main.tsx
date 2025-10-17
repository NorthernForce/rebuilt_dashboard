import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './home/Home';
import { NT4Provider } from '@frc-web-components/react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Ralph from './reefscape/Ralph';
import ConnectionManaged from './components/ConnectionManaged';

let url = new URL(window.location.href);
let ip = url.searchParams.get('ip') || url.hostname || 'localhost';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <NT4Provider address={ip}>
      <ConnectionManaged>
        <BrowserRouter>
          <Routes>
            <Route index element={<Home />} />
            <Route path="ralph" element={<Ralph />} />
          </Routes>
        </BrowserRouter>
      </ConnectionManaged>
    </NT4Provider>
  </StrictMode>
)