import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CreateParty = () => {
  const [partyName, setPartyName] = useState('')
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement party creation logic
    console.log('Creating party:', { partyName, startTime, location })
    navigate('/host/party-success')
  }

  return (
    <div className="create-party-container">
      <h1>Create a Party</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="partyName">Party Name</label>
          <input
            type="text"
            id="partyName"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="Enter party name"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="startTime">Start Time</label>
          <input
            type="datetime-local"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter party location"
            required
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/host')}>
            Cancel
          </button>
          <button type="submit">Create Party</button>
        </div>
      </form>
    </div>
  )
}

export default CreateParty
