import { useState } from 'react';
import './App.css';

function App() {
  const [idea, setIdea] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper function to remove citation brackets like [1], [2], [3], etc.
  const removeCitations = (text) => {
    if (!text) return text;
    return text.replace(/\[\d+\]/g, '').trim();
  };

  // Helper function to format bullet points with bold headings
  const formatBulletPoints = (text) => {
    if (!text) return text;
    
    // Split text into lines
    const lines = text.split('\n');
    const formattedLines = [];
    
    for (let line of lines) {
      line = line.trim();
      
      // Check if line starts with a dash and has a colon
      if (line.startsWith('-') && line.includes(':')) {
        // Extract the part before and after the colon
        const withoutDash = line.substring(1).trim(); // Remove the dash
        const colonIndex = withoutDash.indexOf(':');
        
        if (colonIndex > 0) {
          const heading = withoutDash.substring(0, colonIndex).trim();
          const content = withoutDash.substring(colonIndex + 1).trim();
          
          // Create formatted bullet point with bold heading
          formattedLines.push(
            <li key={formattedLines.length} className="bullet-point">
              <strong>{heading}:</strong> {content}
            </li>
          );
        } else {
          // If no colon found, just format as regular bullet
          formattedLines.push(
            <li key={formattedLines.length} className="bullet-point">
              {withoutDash}
            </li>
          );
        }
      } else if (line.startsWith('-')) {
        // Regular bullet point without colon
        const withoutDash = line.substring(1).trim();
        formattedLines.push(
          <li key={formattedLines.length} className="bullet-point">
            {withoutDash}
          </li>
        );
      } else if (line.length > 0) {
        // Regular paragraph text
        formattedLines.push(
          <p key={formattedLines.length} className="regular-text">
            {line}
          </p>
        );
      }
    }
    
    // If we have bullet points, wrap them in a ul
    const hasBullets = formattedLines.some(line => line.type === 'li');
    if (hasBullets) {
      return (
        <div>
          <ul className="formatted-list">
            {formattedLines.filter(line => line.type === 'li')}
          </ul>
          {formattedLines.filter(line => line.type !== 'li')}
        </div>
      );
    }
    
    // If no bullets, return as div with paragraphs
    return <div>{formattedLines}</div>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError('Please enter a startup idea');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze startup idea');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1 className="title">🚀 Startup Lead Scout</h1>
          <p className="subtitle">Discover what Reddit thinks about your startup idea</p>
        </header>

        <form onSubmit={handleSubmit} className="form">
          <div className="input-group">
            <label htmlFor="startup-idea" className="label">
              Enter your startup idea:
            </label>
            <textarea
              id="startup-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g., Smart pet collar with GPS tracking"
              className="textarea"
              rows="3"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Scraping...' : "Let's Scrape"}
          </button>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {results && (
          <div className="results">
            <div className="result-section">
              <h3>📊 Summary</h3>
              <div className="result-content">
                {formatBulletPoints(removeCitations(results.summary))}
              </div>
            </div>

            <div className="result-section">
              <h3>⚠️ Pain Points</h3>
              <div className="result-content">
                {formatBulletPoints(removeCitations(results.pain_points))}
              </div>
            </div>

            <div className="result-section">
              <h3>💡 Features Suggested</h3>
              <div className="result-content">
                {formatBulletPoints(removeCitations(results.features))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
