// src/App.js
import React from 'react'; // ОБЯЗАТЕЛЬНО!
import './App.css'; // Ваши базовые стили (можете оставить или удалить, если они не нужны)
import CityForecastList from './components/CityForecastList';
import 'antd/dist/antd.css';

function App() {
  return (
      <div className="App">
        <CityForecastList /> {/* <-- Используем наш компонент */}
      </div>
  );
}

export default App;