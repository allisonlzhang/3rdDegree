# Third Degree - Party RSVP Webapp

A social networking/party RSVP webapp with host and guest workflows.

## Project Structure

```
thirddegree/
├── frontend/          # React + Vite frontend
├── backend/           # FastAPI backend
├── README.md
└── requirements.txt   # Python dependencies
```

## Workflows

### Host Workflow
1. Login with phone number and password
2. First time: Setup page → Host dashboard
3. Create party with name, time, location
4. Get invite link for guests

### Guest Workflow
1. Access party via invite link
2. RSVP with guest information
3. View party details

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Database**: Neon PostgreSQL
- **Deployment**: GitHub Pages (frontend) + Render (backend)

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
