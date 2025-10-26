import { useNavigate } from 'react-router-dom'

const PartySuccess = () => {
  const navigate = useNavigate()

  const handleBackToHost = () => {
    navigate('/host')
  }

  // TODO: Generate actual invite link
  const inviteLink = "https://yourdomain.com/party/123/rsvp"

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    // TODO: Show success message
  }

  return (
    <div className="party-success-container">
      <h1>🎉 Party Created Successfully!</h1>
      <div className="success-content">
        <h2>Invite Your Guests</h2>
        <p>Share this link with your guests to let them RSVP:</p>
        <div className="invite-link-container">
          <input
            type="text"
            value={inviteLink}
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
