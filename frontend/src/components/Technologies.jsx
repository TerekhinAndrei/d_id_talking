import React from 'react';
import { TECHNOLOGIES } from '../constants';

const Technologies = () => {

  return (
    <div className="section">
      <h2>Технологии</h2>
      <div className="flex flex-wrap gap-2">
        {TECHNOLOGIES.map((tech, index) => (
          <span key={`tech-${tech}-${index}`} className="status status-info">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Technologies;
