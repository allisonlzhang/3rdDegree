import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { apiClient } from '../lib/api'
import type { GuestRSVP } from '../lib/api'

const GuestDashboard = () => {
  const [rsvps, setRsvps] = useState<GuestRSVP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { guestPhone, logout } = useAuth()

  useEffect(() => {
    loadRSVPs()
  }, [guestPhone])

  const loadRSVPs = async () => {
    if (!guestPhone) {
      setIsLoading(false)
      return
    }

    try {
      const apiRSVPs = await apiClient.getGuestRSVPs(guestPhone)
      setRsvps(apiRSVPs)
    } catch (err: any) {
      setError(err.message || 'Failed to load RSVPs')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handlePartyClick = (rsvp: GuestRSVP) => {
    navigate(`/guest/party/${rsvp.party.invite_code}`)
  }

  if (isLoading) {
    return (
      <div className="guest-dashboard-container">
        <div className="loading">Loading your RSVPs...</div>
      </div>
    )
  }

  return (
    <div className="guest-dashboard-container">
      <h1>Your RSVPs</h1>
      
      {error && <div className="error-message">{error}</div>}

      {rsvps.length === 0 ? (
        <div className="no-rsvps">
          <p>You haven't RSVP'd to any parties yet.</p>
          <p>Find an invite link to RSVP.</p>
        </div>
      ) : (
        <div className="rsvps-list">
          {rsvps.map((rsvp) => (
            <div key={rsvp.id} className="rsvp-card" onClick={() => handlePartyClick(rsvp)} style={{ cursor: 'pointer' }}>
              <div className="rsvp-header">
                <h3>{rsvp.party?.name || 'Unknown Party'}</h3>
                <div className={`status-badge ${
                  rsvp.is_attending ? 
                    (rsvp.is_confirmed ? 'attending' : 'pending') : 
                    'not-attending'
                }`}>
                  {rsvp.is_attending ? 
                    (rsvp.is_confirmed ? '✅ Confirmed' : `⏳ Pending (${rsvp.degree}° degree)`) : 
                    '❌ Not Attending'
                  }
                </div>
              </div>
              
              {rsvp.party && (
                <div className="party-details">
                  <p><strong>Date:</strong> {formatDate(rsvp.party.start_time)}</p>
                  <p><strong>Time:</strong> {formatTime(rsvp.party.start_time)}</p>
                  <p><strong>Location:</strong> {rsvp.party.location}</p>
                  {rsvp.party.description && (
                    <p><strong>Description:</strong> {rsvp.party.description}</p>
                  )}
                </div>
              )}
              
              <div className="rsvp-info">
                <p><strong>RSVP Date:</strong> {formatDate(rsvp.created_at)}</p>
                <p><strong>Guest Name:</strong> {rsvp.guest_name}</p>
              </div>
              
              {rsvp.invitation_code && rsvp.is_attending && !rsvp.is_confirmed && (
                <div className="invitation-section">
                  <h4>📤 Your Invitation Link</h4>
                  <p>Share this link to invite someone to become a {rsvp.degree + 1}° degree guest:</p>
                  <div className="invite-link-container">
                    <input
                      type="text"
                      value={`${window.location.origin}/party/${rsvp.party?.invite_code}/rsvp?invited_by=${rsvp.invitation_code}`}
                      readOnly
                      className="invite-link-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(`${window.location.origin}/party/${rsvp.party?.invite_code}/rsvp?invited_by=${rsvp.invitation_code}`)
                      }}
                      className="copy-btn"
                    >
                      Copy Link
                    </button>
                  </div>
                  <p className="invitation-note">
                    Once someone uses your link to RSVP, your attendance will be confirmed!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="guest-footer">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  )
}

export default GuestDashboard
