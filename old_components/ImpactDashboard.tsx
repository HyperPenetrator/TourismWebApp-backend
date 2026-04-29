import React from 'react';
import { Heart, Users, Home } from 'lucide-react';

export const ImpactDashboard = () => {
  return (
    <div className="impact-dashboard animate-fade-in">
      <div className="impact-header">
        <h2>Your Social Impact</h2>
        <p className="impact-subtitle">Preserving heritage, supporting lives.</p>
      </div>
      
      <div className="impact-grid">
        <div className="impact-stat-card">
          <div className="stat-icon families">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">3</span>
            <span className="stat-label">Local Families Supported</span>
          </div>
        </div>
        
        <div className="impact-stat-card">
          <div className="stat-icon heritage">
            <Home size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">2</span>
            <span className="stat-label">Sites Preserved</span>
          </div>
        </div>
      </div>

      <div className="impact-quote">
        <Heart size={16} className="heart-icon" />
        <p>&quot;Your journey through Assam isn&apos;t just a trip; it&apos;s a lifeline for our community.&quot;</p>
      </div>
    </div>
  );
};
