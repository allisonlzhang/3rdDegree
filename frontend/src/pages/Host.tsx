import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { apiClient } from '../lib/api'
import type { PartyWithCounts } from '../lib/api'

const Host = () => {
  const [parties, setParties] = useState<PartyWithCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { host, logout } = useAuth()

  useEffect(() => {
    loadParties()
  }, [])

  const loadParties = async () => {
    try {
      const data = await apiClient.getParties()
      setParties(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load parties')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateParty = () => {
    navigate('/host/create-party')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleDeleteParty = async (partyId: number) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      try {
        await apiClient.deleteParty(partyId)
        await loadParties() // Reload the parties list
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete party')
      }
    }
  }

  const copyInviteLink = (inviteCode: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const inviteUrl = `${window.location.origin}/party/${inviteCode}/rsvp`
    navigator.clipboard.writeText(inviteUrl)
    // You could add a toast notification here
  }

  const handlePartyClick = (inviteCode: string) => {
    navigate(`/party/${inviteCode}/details`)
  }

  if (isLoading) {
    return (
      <div className="host-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="host-container">
      <div className="host-header">
        <h1>Welcome, {host?.name || 'Host'}!</h1>
      </div>
      
      <div className="host-actions">
        <button onClick={handleCreateParty} className="create-party-btn">
          Create a Party
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="parties-list">
        <h2>Your Parties</h2>
        {parties.length === 0 ? (
          <div className="no-parties">
            <p>No existing parties.</p>
          </div>
        ) : (
          <div className="parties-grid">
            {parties.map((party: any) => (
              <div key={party.id} className="party-card" onClick={() => handlePartyClick(party.invite_code)} style={{ cursor: 'pointer' }}>
                <h3>{party.name}</h3>
                <p><strong>Date:</strong> {new Date(party.start_time).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(party.start_time).toLocaleTimeString()}</p>
                <p><strong>Location:</strong> {party.location}</p>
                <p><strong>RSVPs:</strong> {party.rsvp_count || 0}</p>
                <div className="party-actions">
                  <button 
                    onClick={(e) => copyInviteLink(party.invite_code, e)}
                    className="copy-invite-btn"
                  >
                    Copy Invite Link
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteParty(party.id)
                    }}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="host-footer">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  )
}

export default Host
