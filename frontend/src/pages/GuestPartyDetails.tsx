import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { apiClient } from '../lib/api'
import type { GuestRSVP } from '../lib/api'

const GuestPartyDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { guestPhone } = useAuth()
  const [rsvp, setRsvp] = useState<GuestRSVP | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!guestPhone || !id) {
      navigate('/guest')
      return
    }
    loadRSVP()
  }, [id, guestPhone])

  const loadRSVP = async () => {
    if (!id || !guestPhone) return

    try {
      const rsvpData = await apiClient.getGuestPartyRSVP(guestPhone, id)
      setRsvp(rsvpData)
    } catch (err: any) {
      setError(err.message || 'Failed to load RSVP details')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="guest-dashboard-container">
        <div className="loading">Loading RSVP details...</div>
      </div>
    )
  }

  if (error || !rsvp) {
    return (
      <div className="guest-dashboard-container">
        <h1>Error</h1>
        <p>{error || 'RSVP not found'}</p>
        <button onClick={() => navigate('/guest')} className="guest-btn">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="guest-dashboard-container">
      <h1>{rsvp.party.name}</h1>
      
      <div className="party-details">
        <p><strong>Date:</strong> {new Date(rsvp.party.start_time).toLocaleDateString()}</p>
        <p><strong>Time:</strong> {new Date(rsvp.party.start_time).toLocaleTimeString()}</p>
        <p><strong>Location:</strong> {rsvp.party.location}</p>
        {rsvp.party.description && (
          <p><strong>Description:</strong> {rsvp.party.description}</p>
        )}
      </div>

      <div className="rsvp-status-section">
        <h2>Your RSVP Status</h2>
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

        {rsvp.is_confirmed && rsvp.first_downstream_acceptance && (
          <div className="downstream-info">
            <p><strong>Confirmed by:</strong> {rsvp.first_downstream_acceptance.name}</p>
            <p>Your invitation was accepted by {rsvp.first_downstream_acceptance.name}, which confirmed your RSVP!</p>
          </div>
        )}

        {!rsvp.is_confirmed && rsvp.degree === 3 && rsvp.is_attending && (
          <div className="info-box">
            <p>As a 3rd degree guest, your RSVP is automatically confirmed and you don't need to invite anyone!</p>
          </div>
        )}

        {!rsvp.is_confirmed && rsvp.degree < 3 && rsvp.is_attending && (
          <div className="info-box">
            <p>You need one person to use your invitation link and RSVP yes to confirm your attendance.</p>
            {rsvp.invitation_code && (
              <div className="invitation-section">
                <h4>📤 Your Invitation Link</h4>
                <p>Share this link to invite someone to become a {rsvp.degree + 1}° degree guest:</p>
                <div className="invite-link-container">
                  <input
                    type="text"
                    value={`${window.location.origin}/party/${rsvp.party.invite_code}/rsvp?invited_by=${rsvp.invitation_code}`}
                    readOnly
                    className="invite-link-input"
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/party/${rsvp.party.invite_code}/rsvp?invited_by=${rsvp.invitation_code}`)}
                    className="copy-btn"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="guest-footer">
        <button onClick={() => navigate('/guest')} className="guest-btn">
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default GuestPartyDetails

