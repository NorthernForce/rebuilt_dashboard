import React from 'react';
import ReactDOM from 'react-dom/client';
import { NT4Provider } from '@frc-web-components/react/networktables';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NT4Provider address='localhost'>
      <App />
    </NT4Provider>
  </React.StrictMode>
);
