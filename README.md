# Intelligent Candidate Discovery

A production-grade AI-powered recruitment platform with hybrid RAG-based candidate ranking, multi-factor scoring, and LLM-powered reasoning generation.

## Features

- **Two User Roles**: Recruiter (job management, rankings) and Candidate (job browsing, applications)
- **Hybrid RAG Retrieval**: BM25 sparse + FAISS dense with intelligent combination
- **Multi-Factor Scoring**: Semantic (45%) + Skill (25%) + Career (15%) + Behavioral (15%) with penalty detection
- **Cross-Encoder Reranking**: Neural reranking with SentenceTransformers
- **PDF Resume Processing**: Automatic text extraction and structured parsing
- **MongoDB Persistence**: Full ACID transaction support
- **ChromaDB Embeddings**: Persistent vector storage with semantic search
- **LLM Integration**: Groq API for factual reasoning generation
- **Production Architecture**: Modular design, proper error handling, comprehensive logging

## Tech Stack

### Backend
- **Framework**: FastAPI 0.111.0 + Uvicorn 0.30.0
- **Database**: MongoDB 4.7.2 (users, jobs, applications, profiles, rankings)
- **Vector DB**: ChromaDB 0.4.28 with DuckDB persistence
- **Embeddings**: Sentence-Transformers 3.0.0 (all-MiniLM-L6-v2)
- **Dense Retrieval**: FAISS 1.8.0 (CPU)
- **Sparse Retrieval**: BM25 (rank-bm25 0.2.2)
- **Neural Reranking**: CrossEncoder (ms-marco-MiniLM-L-6-v2)
- **PDF Processing**: PyPDF2 4.1.1
- **LLM**: Groq API (llama-3.3-70b-versatile)

### Frontend
- **Framework**: React 18.2.0 with Vite 5.0.8
- **Routing**: React Router 6.21.0
- **HTTP**: Axios 1.6.2
- **Styling**: Custom CSS (IBM Carbon-inspired)

## Project Structure

```
backend/
  src/
    __init__.py
    main.py                 # FastAPI app entry point
    config/                 # Configuration management
    api/                    # FastAPI routes
    auth/                   # Authentication service
    candidate/              # Candidate operations
    recruiter/              # Recruiter operations
    database/
      mongodb/              # MongoDB connection & models
      chromadb/             # ChromaDB connection
    pdf_processing/         # Resume extraction & parsing
    embeddings/             # Embedding service
    retrieval/
      bm25/                 # Sparse retrieval
      faiss/                # Dense retrieval
      hybrid.py             # Combined retrieval
    reranker/               # Cross-encoder reranking
    scoring/                # Multi-factor scoring
    detectors/              # Negative signal detection
    llm/                    # Groq integration
    reasoning/              # Reasoning generation
    pipelines/              # End-to-end ranking
    utils/                  # Helpers & logging
  requirements.txt
  .env.example

frontend/
  src/
    main.jsx                # Entry point
    App.jsx                 # Main app
    pages/
      Login.jsx
      CandidateDashboard.jsx
      ApplyPage.jsx
      MyApplications.jsx
      RecruiterDashboard.jsx
      CreateJob.jsx
      Rankings.jsx
    components/
      Navbar.jsx
      JobCard.jsx
    services/
      api.js                # Axios API client
    index.css               # Global styles
  index.html
  package.json
  vite.config.js
```

## Installation

### Prerequisites
- Python 3.11+
- Node.js 16+
- MongoDB 4.7+ (local or Atlas)
- Groq API key

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # - MONGO_URI: MongoDB connection string
   # - GROQ_API_KEY: Your Groq API key
   # - DATABASE_NAME: MongoDB database name
   # - EMBEDDING_MODEL: Sentence transformer model
   # - LLM_MODEL: Groq model (default: llama-3.3-70b-versatile)
   # - CHROMADB_PATH: Path for ChromaDB persistence
   # - UPLOAD_DIR: Resume upload directory
   # - LOG_LEVEL: Logging level (default: INFO)
   ```

5. **Start backend**
   ```bash
   python -m uvicorn src.main:app --reload
   ```
   Backend runs at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend runs at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login

### Candidate Endpoints
- `GET /jobs` - Get all active jobs
- `POST /apply` - Submit job application with resume
- `GET /applications/{candidate_id}` - Get candidate's applications

### Recruiter Endpoints
- `POST /create-job` - Create job posting
- `GET /recruiter-jobs/{recruiter_id}` - Get recruiter's jobs
- `GET /job/{job_id}` - Get job details
- `GET /job/{job_id}/applicants` - Get job applicants
- `POST /rank/{job_id}` - Get AI rankings for job

### System
- `GET /health` - Health check

## How It Works

### Ranking Pipeline

1. **Job Retrieval**: Load job description and applications
2. **Embedding Generation**: Convert JD and resumes to embeddings
3. **Sparse Retrieval**: BM25 full-text search on resumes
4. **Dense Retrieval**: FAISS semantic similarity
5. **Hybrid Combination**: Weighted normalization (50/50 default)
6. **Reranking**: Neural cross-encoder for precision
7. **Multi-Factor Scoring**:
   - Semantic: Embedding similarity (cosine)
   - Skill: Required skill intersection
   - Career: Experience years vs target
   - Behavioral: Keywords matching
   - Penalties: Keyword stuffing, services-only, honeypot buzzwords, business jargon
8. **Final Score**: Weighted formula with penalties
9. **Reasoning**: LLM-generated explanations

### Scoring Formula
```
Final Score = (0.45 * Semantic + 0.25 * Skill + 0.15 * Career + 0.15 * Behavior) - Penalties
Clamped to [0, 1] → Display as percentage (0-100)
```

### Negative Signals Detected
- **Keyword Stuffing**: Repeated words penalty
- **Services-Only**: Service roles for product positions
- **Honeypot**: Buzzwords (ninja, guru, rockstar, etc.)
- **Jargon Overload**: Business language (leverage, synergy, paradigm, etc.)

## Configuration

All settings managed via `.env` file:

```env
MONGO_URI=mongodb://localhost:27017
GROQ_API_KEY=your_groq_api_key
DATABASE_NAME=recruitment_db
EMBEDDING_MODEL=all-MiniLM-L6-v2
LLM_MODEL=llama-3.3-70b-versatile
CHROMADB_PATH=./chromadb_data
UPLOAD_DIR=./uploads
LOG_LEVEL=INFO
```

## Development

### Running Tests
```bash
cd backend
pytest tests/
```

### Building Frontend
```bash
cd frontend
npm run build
```

### Code Quality
- Type hints throughout Python code
- ESLint for JavaScript
- Pydantic models for validation
- Comprehensive logging at all layers

## Performance Considerations

- **Embeddings**: Lazy-loaded models (first request initialization)
- **Vector Indexing**: FAISS IndexFlatIP for fast similarity search
- **Hybrid Retrieval**: Normalized score combination prevents mode dominance
- **Batch Processing**: Efficient batch embedding generation
- **MongoDB Indexing**: Automatic indexes on frequently queried fields
- **ChromaDB Persistence**: DuckDB backend for fast access

## Error Handling

- Graceful fallbacks for LLM failures
- PDF parsing error recovery
- Database connection pooling
- Comprehensive error logging
- User-friendly error messages

## Security Notes

- Passwords hashed with SHA256 (upgrade to bcrypt for production)
- CORS enabled for development (restrict for production)
- Input validation with Pydantic
- Environment variables for secrets (no hardcoding)
- File upload restrictions (PDF only)

## Future Enhancements

- JWT-based authentication
- Rate limiting and throttling
- Advanced caching (Redis)
- Bulk operations API
- Advanced analytics dashboard
- Interview scheduling integration
- Offer management
- Candidate communication portal

## License

MIT

## Support

For issues or questions, refer to the inline code documentation and logging output.
