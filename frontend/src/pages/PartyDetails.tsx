import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { apiClient } from '../lib/api'

interface RSVPWithReferrer {
  id: number
  guest_name: string
  guest_phone: string
  is_attending: boolean
  degree: number
  invited_by_rsvp_id?: number
  invitation_code?: string
  is_confirmed: boolean
  has_sent_invitation: boolean
  created_at: string
  referrer_name?: string
}

interface PartyDetails {
  party: {
    id: number
    name: string
    start_time: string
    location: string
    description?: string
    invite_code: string
    host_id: number
    created_at: string
  }
  rsvps: RSVPWithReferrer[]
}

const PartyDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPartyDetails()
  }, [id])

  const loadPartyDetails = async () => {
    if (!id) return
    
    try {
      // Get party info
      const party = await apiClient.getPartyByInviteCode(id)
      
      // Get all RSVPs for this party with detailed info
      const rsvpsData = await apiClient.getPartyRSVPsAll(id)
      
      setPartyDetails({
        party,
        rsvps: rsvpsData
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load party details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/party/${id}/rsvp`
    navigator.clipboard.writeText(inviteUrl)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const getStatusBadge = (rsvp: RSVPWithReferrer) => {
    if (!rsvp.is_attending) {
      return <span className="status-badge not-attending">❌ Not Attending</span>
    }
    
    if (rsvp.is_confirmed) {
      return <span className="status-badge attending">✅ Confirmed</span>
    }
    
    return <span className="status-badge pending">⏳ Pending ({rsvp.degree}° degree)</span>
  }

  if (isLoading) {
    return (
      <div className="party-details-container">
        <div className="loading">Loading party details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="party-details-container">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!partyDetails) {
    return (
      <div className="party-details-container">
        <h1>Party Not Found</h1>
      </div>
    )
  }

  const { party, rsvps } = partyDetails
  const attendingCount = rsvps.filter(r => r.is_attending).length
  const confirmedCount = rsvps.filter(r => r.is_attending && r.is_confirmed).length

  return (
    <div className="party-details-container">
      <div className="party-header">
        <h1>{party.name}</h1>
        <div className="party-stats">
          <div className="stat">
            <span className="stat-number">{attendingCount}</span>
            <span className="stat-label">Total RSVPs</span>
          </div>
          <div className="stat">
            <span className="stat-number">{confirmedCount}</span>
            <span className="stat-label">Confirmed</span>
          </div>
        </div>
      </div>

      <div className="party-info">
        <h2>Party Details</h2>
        <p><strong>Date:</strong> {formatDate(party.start_time)}</p>
        <p><strong>Time:</strong> {formatTime(party.start_time)}</p>
        <p><strong>Location:</strong> {party.location}</p>
        {party.description && <p><strong>Description:</strong> {party.description}</p>}
        
        <div className="invite-section">
          <h3>Invite Link</h3>
          <div className="invite-link-container">
            <input
              type="text"
              value={`${window.location.origin}/party/${party.invite_code}/rsvp`}
              readOnly
              className="invite-link-input"
            />
            <button onClick={copyInviteLink} className="copy-btn">
              Copy Link
            </button>
          </div>
        </div>
      </div>

      <div className="rsvps-section">
        <h2>RSVPs ({rsvps.length})</h2>
        {rsvps.length === 0 ? (
          <p>No RSVPs yet. Share your invite link to get started!</p>
        ) : (
          <div className="rsvps-list">
            {rsvps.map((rsvp) => (
              <div key={rsvp.id} className="rsvp-item">
                <div className="rsvp-header">
                  <h3>{rsvp.guest_name}</h3>
                  {getStatusBadge(rsvp)}
                </div>
                <div className="rsvp-details">
                  <p><strong>Phone:</strong> {rsvp.guest_phone}</p>
                  <p><strong>Degree:</strong> {rsvp.degree}°</p>
                  <p><strong>Invited by:</strong> {rsvp.referrer_name}</p>
                  <p><strong>RSVP Date:</strong> {formatDate(rsvp.created_at)}</p>
                  {rsvp.invitation_code && (
                    <p><strong>Invitation Code:</strong> {rsvp.invitation_code}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="party-footer">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  )
}

export default PartyDetails
