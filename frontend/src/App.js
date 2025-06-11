import { useState } from 'react';
import './App.css';

function App() {
  const [idea, setIdea] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
              <p>{results.summary}</p>
            </div>

            <div className="result-section">
              <h3>⚠️ Pain Points</h3>
              <p>{results.pain_points}</p>
            </div>

            <div className="result-section">
              <h3>💡 Features Suggested</h3>
              <p>{results.features}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
