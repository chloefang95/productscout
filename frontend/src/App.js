import { useState } from 'react';
import './App.css';

function App() {
  const [idea, setIdea] = useState('');
  const [analyzeResults, setAnalyzeResults] = useState(null);
  const [reachResults, setReachResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper function to remove citation brackets like [1], [2], [3], etc.
  const removeCitations = (text) => {
    if (!text) return text;
    return text.replace(/\[\d+\]/g, '').trim();
  };

  // Helper function to enhance bullet points with concise summaries
  const enhanceBulletPoints = (text) => {
    if (!text) return text;
    
    const lines = text.split('\n');
    const enhancedLines = [];
    
    for (let line of lines) {
      line = line.trim();
      
      // Check if this is a bullet point that needs enhancement
      if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        // Extract the content without bullet marker
        const content = line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
        
        // Check if content already has good structure (starts with a clear topic followed by colon)
        const alreadyStructured = content.match(/^[A-Z][A-Za-z\s]{1,25}:\s*/);
        
        if (alreadyStructured) {
          // Content is already well-structured, don't enhance
          enhancedLines.push(line);
        } else {
          // Generate a concise summary for this bullet point
          const summary = generateBulletSummary(content);
          
          // Reconstruct the bullet point with summary + original content
          const bulletMarker = line.match(/^[-•*]\s+/) ? '- ' : 
                             line.match(/^\d+\.\s+/) ? line.match(/^\d+\.\s+/)[0] : '- ';
          
          if (summary && summary !== content && !content.toLowerCase().startsWith(summary.toLowerCase())) {
            enhancedLines.push(`${bulletMarker}${summary}: ${content}`);
          } else {
            enhancedLines.push(line); // Keep original if summary generation fails or would be redundant
          }
        }
      } else {
        enhancedLines.push(line); // Keep non-bullet lines as-is
      }
    }
    
    return enhancedLines.join('\n');
  };

  // Function to generate concise summaries for bullet points using dynamic semantic understanding
  const generateBulletSummary = (content) => {
    if (!content || content.length < 20) return null;
    
    // Use semantic analysis to create contextual summaries
    const summary = createDynamicSummary(content);
    
    return summary;
  };

  // Create a dynamic summary by extracting the core topic from the content
  const createDynamicSummary = (content) => {
    // Clean and prepare text for analysis
    const text = content.toLowerCase().trim();
    const originalText = content.trim();
    
    // Step 1: Extract the main topic/subject being discussed
    const mainTopic = extractMainTopic(text, originalText);
    if (mainTopic) return mainTopic;
    
    // Step 2: Look for key descriptive phrases
    const keyPhrase = extractKeyDescriptor(text, originalText);
    if (keyPhrase) return keyPhrase;
    
    // Step 3: Use natural starting words if they're meaningful
    const naturalStart = extractNaturalStart(originalText);
    if (naturalStart) return naturalStart;
    
    return null;
  };

  // Extract the main topic being discussed in the bullet point
  const extractMainTopic = (text, originalText) => {
    // Look for clear topic indicators - the main subject matter
    const topicKeywords = [
      // Direct system/feature names (more comprehensive)
      { patterns: ['credit system', 'generative credit', 'credits', 'credit'], topic: 'Credit System' },
      { patterns: ['pricing structure', 'pricing', 'subscription', 'cost'], topic: 'Pricing' },
      { patterns: ['output quality', 'ai output', 'quality', 'photorealism', 'inferior'], topic: 'Output Quality' },
      { patterns: ['integration', 'fragmented', 'cross-product'], topic: 'Integration' },
      { patterns: ['batch processing', 'batch', 'prompt processing'], topic: 'Batch Processing' },
      { patterns: ['mobile', 'mobile app', 'mobile support', 'mobile features'], topic: 'Mobile Features' },
      { patterns: ['api', 'third-party', 'direct api'], topic: 'API Access' },
      { patterns: ['video generation', 'video', 'video features'], topic: 'Video Features' },
      { patterns: ['disk space', 'storage', 'export resolution'], topic: 'Storage & Resolution' },
      { patterns: ['legal', 'ethical', 'licensing', 'commercial'], topic: 'Legal & Ethics' },
      { patterns: ['photoshop', 'illustrator', 'express', 'adobe'], topic: 'Adobe Integration' },
      { patterns: ['advanced', 'prompt controls', 'prompt weighting', 'seed control'], topic: 'Advanced Controls' },
      { patterns: ['style', 'customization', 'user-trainable', 'style transfer'], topic: 'Style Customization' },
      { patterns: ['higher', 'resolution', 'professional', 'high-end'], topic: 'Resolution & Quality' },
      { patterns: ['deeper', 'workflow', 'after effects', 'creative pipeline'], topic: 'Workflow Integration' },
      
      // Problem types as topics
      { patterns: ['feature limitations', 'lack of', 'missing'], topic: 'Missing Features' },
      { patterns: ['frustration', 'frustrated'], topic: 'User Frustration' },
      { patterns: ['bug', 'error', 'technical'], topic: 'Technical Issues' },
      { patterns: ['performance', 'slow', 'laggy'], topic: 'Performance' },
      { patterns: ['usability', 'confusing', 'difficult'], topic: 'Usability' },
      { patterns: ['support', 'documentation', 'guidance'], topic: 'Support & Documentation' }
    ];
    
    // Find the best match with multiple pattern matching
    let bestMatch = null;
    let maxMatches = 0;
    
    for (const topicGroup of topicKeywords) {
      let matches = 0;
      for (const pattern of topicGroup.patterns) {
        if (text.includes(pattern)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = topicGroup;
      }
    }
    
    if (bestMatch && maxMatches > 0) {
      return bestMatch.topic;
    }
    
    return null;
  };

  // Extract key descriptive phrases that capture the essence
  const extractKeyDescriptor = (text, originalText) => {
    // Look for quoted complaints/descriptions (often the core issue)
    const quotes = originalText.match(/"([^"]+)"/g);
    if (quotes && quotes.length > 0) {
      const quote = quotes[0].replace(/"/g, '').trim();
      // Use the quote if it's concise and descriptive
      if (quote.length > 8 && quote.length < 40 && !quote.includes(',')) {
        return quote;
      }
    }
    
    // Look for parenthetical descriptions
    const parenthetical = originalText.match(/\(([^)]+?)\)/);
    if (parenthetical) {
      const desc = parenthetical[1].trim();
      if (desc.length > 8 && desc.length < 35 && !desc.includes(',') && !desc.includes(';')) {
        return desc;
      }
    }
    
    // Extract compound terms that are descriptive (expanded list)
    const compoundTerms = [
      'generative credit', 'pricing structure', 'output quality', 'feature limitations',
      'batch processing', 'mobile features', 'video generation', 'disk space',
      'user experience', 'technical issues', 'legal concerns', 'advanced prompt',
      'higher resolution', 'deeper integration', 'enhanced style', 'unlimited credits',
      'transparent pricing', 'predictable pricing', 'professional use', 'commercial licensing',
      'workflow integration', 'cross-product', 'frame-accurate', 'user-trainable',
      'style transfer', 'content safety', 'export resolution', 'subscription model',
      'maximum export', 'monthly generative', 'flat-fee tiers', 'microtransactions'
    ];
    
    for (const term of compoundTerms) {
      if (text.includes(term)) {
        return term.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    // Fallback: Create summary from key adjectives + nouns
    const adjectiveNounPatterns = [
      /\b(unlimited|higher|deeper|enhanced|advanced|improved|better|direct|transparent|predictable|professional|commercial)\s+(\w+)/gi,
      /\b(\w+)\s+(support|features|integration|controls|quality|system|access|pricing|resolution|documentation|guidance)/gi
    ];
    
    for (const pattern of adjectiveNounPatterns) {
      const match = text.match(pattern);
      if (match && match[0].length > 8 && match[0].length < 30) {
        return match[0].split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    return null;
  };

  // Extract natural starting words when they form a coherent topic
  const extractNaturalStart = (originalText) => {
    const words = originalText.split(' ');
    
    // If it starts with a clear topic (usually 1-3 words)
    if (words.length >= 2) {
      const firstWord = words[0];
      const firstTwo = words.slice(0, 2).join(' ');
      const firstThree = words.slice(0, 3).join(' ');
      
      // Expanded list of meaningful starting words
      const meaningfulStarters = [
        'Generative', 'Pricing', 'Integration', 'Ethical', 'Feature', 'Disk',
        'Advanced', 'Higher', 'Deeper', 'Enhanced', 'Video', 'Mobile', 'Legal',
        'Credit', 'Output', 'Unlimited', 'Improved', 'Better'
      ];
      
      // Single meaningful word
      if (firstWord.length > 3 && /^[A-Z]/.test(firstWord) && 
          meaningfulStarters.includes(firstWord)) {
        return firstWord;
      }
      
      // Two meaningful words - more flexible matching
      if (firstTwo.length > 5 && firstTwo.length < 30 && 
          /^[A-Z]/.test(firstTwo) && 
          !firstTwo.toLowerCase().includes('the ') &&
          !firstTwo.toLowerCase().includes('this ') &&
          !firstTwo.toLowerCase().includes('some ')) {
        
        // Check if it's a meaningful combination
        const meaningfulCombos = [
          /^(Advanced|Higher|Deeper|Enhanced|Video|Mobile|Legal|Credit|Output|Unlimited|Improved|Better|Direct)/i,
          /^[A-Z][a-z]+ (support|features|integration|controls|quality|system|access)/i
        ];
        
        if (meaningfulCombos.some(regex => firstTwo.match(regex))) {
          return firstTwo;
        }
      }
      
      // Three words for compound concepts
      if (firstThree.length > 8 && firstThree.length < 35 &&
          /^[A-Z]/.test(firstThree) &&
          firstThree.match(/^[A-Z][a-z]+ [a-z]+ (controls|features|integration|support|system|access|quality)/i)) {
        return firstThree;
      }
    }
    
    return null;
  };

  // Helper function to format bullet points with bold headings
  const formatBulletPoints = (text) => {
    if (!text) return text;
    
    // Split text into lines
    const lines = text.split('\n');
    const formattedLines = [];
    
    for (let line of lines) {
      line = line.trim();
      
      // Check if line starts with a bullet (-, •, *) or bullet point patterns
      if (line.match(/^[-•*]\s+/)) {
        // Remove the bullet marker
        const withoutBullet = line.replace(/^[-•*]\s+/, '').trim();
        
        // Look for various patterns where we want to bold the beginning
        let formattedContent;
        
        // Pattern 1: Text ending with colon (like "Market Size:")
        const colonMatch = withoutBullet.match(/^([^:]+):\s*(.*)$/);
        if (colonMatch) {
          const [, heading, content] = colonMatch;
          formattedContent = (
            <>
              <strong>{heading}:</strong> {content}
            </>
          );
        }
        // Pattern 2: Text in parentheses at the start (like "(Market validated)")
        else if (withoutBullet.match(/^\([^)]+\)/)) {
          const parenMatch = withoutBullet.match(/^(\([^)]+\))\s*(.*)$/);
          if (parenMatch) {
            const [, heading, content] = parenMatch;
            formattedContent = (
              <>
                <strong>{heading}</strong> {content}
            </>
            );
          } else {
            formattedContent = withoutBullet;
          }
        }
        // Pattern 3: Capitalized phrase at the beginning (like "Pain Points", "Market Analysis")
        else if (withoutBullet.match(/^[A-Z][^.!?]*[A-Za-z]\s+/)) {
          // Look for a phrase that could be a heading (usually 1-4 words, capitalized)
          const headingMatch = withoutBullet.match(/^([A-Z][A-Za-z\s]{1,50}?)\s*[-–—]\s*(.+)$/);
          if (headingMatch) {
            const [, heading, content] = headingMatch;
            formattedContent = (
              <>
                <strong>{heading}</strong> - {content}
              </>
            );
          } else {
            // Try to detect if first few words should be bolded
            const words = withoutBullet.split(' ');
            if (words.length > 3 && words[0].match(/^[A-Z]/) && words[1] && words[1].match(/^[A-Z]/)) {
              // First two words are capitalized, might be a heading
              const possibleHeading = words.slice(0, 2).join(' ');
              const restContent = words.slice(2).join(' ');
              formattedContent = (
                <>
                  <strong>{possibleHeading}</strong> {restContent}
                </>
              );
            } else {
              formattedContent = withoutBullet;
            }
          }
        }
        else {
          formattedContent = withoutBullet;
        }
        
        formattedLines.push(
          <li key={formattedLines.length} className="bullet-point">
            {formattedContent}
          </li>
        );
      }
      // Check if line starts with a number (like "1. ", "2. ")
      else if (line.match(/^\d+\.\s+/)) {
        const withoutNumber = line.replace(/^\d+\.\s+/, '').trim();
        
        // Apply same formatting logic as bullets
        let formattedContent;
        const colonMatch = withoutNumber.match(/^([^:]+):\s*(.*)$/);
        if (colonMatch) {
          const [, heading, content] = colonMatch;
          formattedContent = (
            <>
              <strong>{heading}:</strong> {content}
            </>
          );
        } else {
          formattedContent = withoutNumber;
        }
        
        formattedLines.push(
          <li key={formattedLines.length} className="bullet-point">
            {formattedContent}
          </li>
        );
      }
      else if (line.length > 0) {
        // Regular paragraph text - check if it looks like a heading
        if (line.match(/^[A-Z][^.!?]*:?\s*$/) && line.length < 50) {
          // Looks like a standalone heading
          formattedLines.push(
            <p key={formattedLines.length} className="regular-text">
              <strong>{line}</strong>
            </p>
          );
        } else {
          formattedLines.push(
            <p key={formattedLines.length} className="regular-text">
              {line}
            </p>
          );
        }
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
    setAnalyzeResults(null);
    setReachResults(null);

    try {
      // Call both services simultaneously
      const analyzeUrl = process.env.REACT_APP_ANALYZE_API_URL || 'http://localhost:8000/analyze';
      const reachUrl = process.env.REACT_APP_REACH_API_URL || 'http://localhost:8001/reach';
      
      const [analyzeResponse, reachResponse] = await Promise.all([
        fetch(analyzeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idea: idea.trim() }),
        }),
        fetch(reachUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idea: idea.trim() }),
        })
      ]);

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze startup idea');
      }
      if (!reachResponse.ok) {
        throw new Error('Failed to get reach data');
      }

      const analyzeData = await analyzeResponse.json();
      const reachData = await reachResponse.json();
      
      setAnalyzeResults(analyzeData);
      setReachResults(reachData);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderReachResults = (reachData) => {
    if (!reachData || !reachData.relevant_posts) return null;

    return (
      <div className="reach-results">
        <div className="reach-section">
          <h4>🎯 Reddit Posts ({reachData.relevant_posts.length} found)</h4>
          <div className="posts-container">
            {reachData.relevant_posts.slice(0, 5).map((post, index) => (
              <div key={index} className="post-card">
                <div className="post-header">
                  <h5 className="post-title">
                    <a href={post.reddit_url} target="_blank" rel="noopener noreferrer">
                      {post.title}
                    </a>
                  </h5>
                  <span className="post-meta">
                    <strong>r/{post.subreddit}</strong> • {post.score} upvotes • {post.num_comments} comments
                  </span>
                </div>
                <div className="post-body">
                  <p><strong>Author:</strong> u/{post.author}</p>
                  {post.selftext && (
                    <p className="post-excerpt">
                      {post.selftext.slice(0, 200)}...
                    </p>
                  )}
                  <a href={post.reddit_url} target="_blank" rel="noopener noreferrer" className="post-link">
                    View on Reddit →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {reachData.key_users && reachData.key_users.length > 0 && (
          <div className="reach-section">
            <h4>👥 Key Users to Connect With</h4>
            <div className="users-container">
              {reachData.key_users.slice(0, 6).map((user, index) => (
                <div key={index} className="user-card">
                  <p><strong>u/{user.username}</strong></p>
                  <p>Karma: {user.comment_karma + user.link_karma}</p>
                  <a href={user.reddit_url} target="_blank" rel="noopener noreferrer" className="user-link">
                    View Profile →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {reachData.recommended_subreddits && reachData.recommended_subreddits.length > 0 && (
          <div className="reach-section">
            <h4>📱 Recommended Subreddits</h4>
            <div className="subreddits-container">
              {reachData.recommended_subreddits.map((subreddit, index) => (
                <span key={index} className="subreddit-tag">
                  <a href={`https://reddit.com/r/${subreddit}`} target="_blank" rel="noopener noreferrer">
                    r/{subreddit}
                  </a>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1 className="title">🚀 Product Sentiment Scout</h1>
          <p className="subtitle">See what real users love, hate, and request about the product, instantly powered by Reddit</p>
          <p className="created-by">Created by Chloe Fang</p>
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
            {loading ? 'Analyzing & Finding Leads...' : "Let's Scout"}
          </button>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {(analyzeResults || reachResults) && (
          <div className="results-container">
            {/* Analyze Results - Left Column */}
            <div className="analyze-column">
              <h2 className="column-title">🔍 Market Analysis</h2>
              {analyzeResults && (
                <div className="analyze-results">
                  <div className="result-section">
                    <h3>📊 Summary</h3>
                    <div className="result-content">
                      {formatBulletPoints(enhanceBulletPoints(removeCitations(analyzeResults.summary)))}
                    </div>
                  </div>

                  <div className="result-section">
                    <h3>⚠️ Pain Points</h3>
                    <div className="result-content">
                      {formatBulletPoints(enhanceBulletPoints(removeCitations(analyzeResults.pain_points)))}
                    </div>
                  </div>

                  <div className="result-section">
                    <h3>💡 Feature Requests</h3>
                    <div className="result-content">
                      {formatBulletPoints(enhanceBulletPoints(removeCitations(analyzeResults.features)))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reach Results - Right Column */}
            <div className="reach-column">
              <h2 className="column-title">🎯 Lead Generation</h2>
              {reachResults ? (
                renderReachResults(reachResults)
              ) : (
                <div className="loading-placeholder">
                  {loading ? 'Finding leads...' : 'No reach data available'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
