import { useNavigate, useLocation } from 'react-router-dom'

const PartySuccess = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get party data from navigation state
  const party = location.state?.party
  const inviteUrl = location.state?.inviteUrl

  const handleBackToHost = () => {
    navigate('/host')
  }

  const copyInviteLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      // You could add a toast notification here
    }
  }

  // If no party data, redirect to host dashboard
  if (!party || !inviteUrl) {
    navigate('/host')
    return null
  }

  return (
    <div className="party-success-container">
      <h1>🎉 Party Created Successfully!</h1>
      <div className="success-content">
        <h2>Invite Your Guests</h2>
        <p>Share this link with your guests to let them RSVP for "{party.name}":</p>
        <div className="invite-link-container">
          <input
            type="text"
            value={inviteUrl}
            readOnly
            className="invite-link-input"
          />
          <button onClick={copyInviteLink} className="copy-btn">
            Copy Link
          </button>
        </div>
        <div className="success-actions">
          <button onClick={handleBackToHost} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default PartySuccess
