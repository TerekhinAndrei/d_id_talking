import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import QueryProvider from './providers/QueryProvider';
import AppNew from './AppNew';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <AppNew />
    </QueryProvider>
  </React.StrictMode>
);
