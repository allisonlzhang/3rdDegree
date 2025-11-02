import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { apiClient } from '../lib/api'

const GuestRsvp = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { host, guestPhone, guestLogin } = useAuth()
  const [party, setParty] = useState<any>(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhoneInput, setGuestPhoneInput] = useState(guestPhone || '')
  const [rsvpStatus, setRsvpStatus] = useState<'yes' | 'no' | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [rsvpData, setRsvpData] = useState<any>(null)

  useEffect(() => {
    if (guestPhone) {
      setGuestPhoneInput(guestPhone)
    }
    loadParty()
  }, [id, guestPhone])

  const loadParty = async () => {
    if (!id) return
    
    try {
      const partyData = await apiClient.getPartyByInviteCode(id)
      setParty(partyData)
      
      // If user is logged in as host and this is their party, redirect to party details
      if (host && partyData.host_id === host.id) {
        navigate(`/party/${id}/details`)
        return
      }
      
      // If guest is logged in, check if they already RSVP'd to this party
      if (guestPhone) {
        try {
          await apiClient.getGuestPartyRSVP(guestPhone, id)
          // If RSVP exists, redirect to guest dashboard
          navigate('/guest')
          return
        } catch (err) {
          // RSVP doesn't exist, continue to RSVP form
        }
      }
    } catch (err: any) {
      setError(err.message || 'Party not found')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!party || !rsvpStatus) return
    
    setError('')
    setIsSubmitting(true)

    try {
      const invitedByCode = searchParams.get('invited_by')
      const phone = guestPhoneInput.trim()
      
      const rsvpResponse = await apiClient.createRSVP(id!, {
        guest_name: guestName,
        guest_phone: phone,
        is_attending: rsvpStatus === 'yes',
        invited_by_code: invitedByCode || undefined
      })
      
      setRsvpData(rsvpResponse)
      
      // Auto-login guest if not already logged in (first-time RSVP)
      if (!guestPhone) {
        guestLogin(phone)
      }
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit RSVP')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.slice(0, 10)
  }

  if (isLoading) {
    return (
      <div className="guest-rsvp-container">
        <div className="loading">Loading party details...</div>
      </div>
    )
  }

  if (error && !party) {
    return (
      <div className="guest-rsvp-container">
        <h1>Party Not Found</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (success) {
    const getSuccessMessage = () => {
      if (!rsvpData) return "RSVP submitted successfully!"
      
      if (rsvpData.degree === 3) {
        return "🎉 Congratulations! You're confirmed for the party! As a 3rd degree guest, your RSVP is automatically confirmed and you've helped complete the invitation chain!"
      } else if (rsvpData.degree === 2) {
        return "✅ RSVP submitted! You're a 2nd degree guest. To confirm your attendance, you need to invite someone who will become a 3rd degree guest. Share your invitation link below!"
      } else if (rsvpData.degree === 1) {
        return "✅ RSVP submitted! You're a 1st degree guest. To confirm your attendance, you need to invite someone who will become a 2nd degree guest. Share your invitation link below!"
      }
      return "RSVP submitted successfully!"
    }

    const getInvitationInfo = () => {
      if (!rsvpData || rsvpData.degree >= 3 || !rsvpData.invitation_code) return null
      
      const invitationUrl = `${window.location.origin}/party/${id}/rsvp?invited_by=${rsvpData.invitation_code}`
      
      return (
        <div className="invitation-info">
          <h3>📤 Share Your Invitation Link</h3>
          <p>To confirm your RSVP, invite someone to become a {rsvpData.degree + 1} degree guest:</p>
          <div className="invite-link-container">
            <input
              type="text"
              value={invitationUrl}
              readOnly
              className="invite-link-input"
            />
            <button 
              onClick={() => navigator.clipboard.writeText(invitationUrl)}
              className="copy-btn"
            >
              Copy Link
            </button>
          </div>
          <p className="invitation-note">
            Once someone uses your link to RSVP, your attendance will be confirmed!
          </p>
        </div>
      )
    }

    return (
      <div className="guest-rsvp-container">
        <h1>{getSuccessMessage()}</h1>
        <p>Thank you for your RSVP, {guestName}!</p>
        {getInvitationInfo()}
      </div>
    )
  }

  return (
    <div className="guest-rsvp-container">
      <h1>RSVP to Party</h1>
      <div className="party-info">
        <h2>Party Details</h2>
        <p><strong>Party Name:</strong> {party?.name}</p>
        <p><strong>Date & Time:</strong> {party?.start_time ? new Date(party.start_time).toLocaleString() : 'TBD'}</p>
        <p><strong>Location:</strong> {party?.location}</p>
        {party?.description && <p><strong>Description:</strong> {party.description}</p>}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="guestName">Your Name</label>
          <input
            type="text"
            id="guestName"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="guestPhone">Your Phone</label>
          <input
            type="tel"
            id="guestPhone"
            value={guestPhoneInput}
            onChange={(e) => setGuestPhoneInput(formatPhone(e.target.value))}
            placeholder="1234567890"
            maxLength={10}
            required
            disabled={!!guestPhone} // Disable if already logged in
          />
        </div>
        <div className="form-group">
          <label>Will you attend?</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="rsvp"
                value="yes"
                checked={rsvpStatus === 'yes'}
                onChange={(e) => setRsvpStatus(e.target.value as 'yes')}
              />
              Yes, I'll be there!
            </label>
            <label>
              <input
                type="radio"
                name="rsvp"
                value="no"
                checked={rsvpStatus === 'no'}
                onChange={(e) => setRsvpStatus(e.target.value as 'no')}
              />
              Sorry, can't make it
            </label>
          </div>
        </div>
        <button type="submit" disabled={!rsvpStatus || isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
        </button>
      </form>
    </div>
  )
}

export default GuestRsvp
