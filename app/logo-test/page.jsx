
import React from 'react';

export default function LogoTestPage() {
  const logos = [
    { name: "Foxon Final Logo-01.png", path: "/Foxon%20Final%20Logo-01.png" },
    { name: "Foxon Final Logo-02.png", path: "/Foxon%20Final%20Logo-02.png" },
    { name: "Untitled_design-removebg-preview.png", path: "/Untitled_design-removebg-preview.png" },
    { name: "Untitled_design__1_-removebg-preview.png", path: "/Untitled_design__1_-removebg-preview.png" },
    { name: "your_logo-removebg-preview.png", path: "/your_logo-removebg-preview.png" }
  ];

  return (
    <div style={{ padding: '40px', background: '#333', color: 'white' }}>
      <h1>Logo Inspection (Dark Background)</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
        {logos.map(logo => (
          <div key={logo.path} style={{ border: '1px solid #555', padding: '20px' }}>
            <h3>{logo.name}</h3>
            <img src={logo.path} style={{ maxWidth: '100%', height: 'auto', border: '1px solid red' }} alt={logo.name} />
          </div>
        ))}
      </div>
      <h1 style={{ marginTop: '50px', background: 'white', color: 'black', padding: '20px' }}>Logo Inspection (Light Background)</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px', background: 'white', padding: '20px' }}>
        {logos.map(logo => (
          <div key={logo.path} style={{ border: '1px solid #ddd', padding: '20px', color: 'black' }}>
            <h3>{logo.name}</h3>
            <img src={logo.path} style={{ maxWidth: '100%', height: 'auto', border: '1px solid red' }} alt={logo.name} />
          </div>
        ))}
      </div>
    </div>
  );
}
