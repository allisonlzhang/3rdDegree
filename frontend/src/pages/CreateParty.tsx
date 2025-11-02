import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/api'

const CreateParty = () => {
  const [partyName, setPartyName] = useState('')
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const partyData = {
        name: partyName,
        start_time: startTime,
        location: location,
        description: description || undefined
      }
      
      const response = await apiClient.createParty(partyData)
      
      // Navigate to success page with party data
      navigate('/host/party-success', { 
        state: { 
          party: response,
          inviteUrl: `${window.location.origin}/party/${response.invite_code}/rsvp`
        } 
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create party')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="create-party-container">
      <h1>Create a Party</h1>
      {error && <div className="error-message">{error}</div>}
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
        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter party description"
            rows={3}
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/host')}>
            Cancel
          </button>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Party'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateParty
