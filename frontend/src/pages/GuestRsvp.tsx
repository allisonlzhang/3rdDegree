import { useState } from 'react'
import { useParams } from 'react-router-dom'

const GuestRsvp = () => {
  const { id } = useParams<{ id: string }>()
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [rsvpStatus, setRsvpStatus] = useState<'yes' | 'no' | ''>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement RSVP logic
    console.log('RSVP submission:', { 
      partyId: id, 
      guestName, 
      guestPhone, 
      rsvpStatus 
    })
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.slice(0, 10)
  }

  return (
    <div className="guest-rsvp-container">
      <h1>RSVP to Party</h1>
      <div className="party-info">
        <h2>Party Details</h2>
        <p>Party Name: [Loading...]</p>
        <p>Date & Time: [Loading...]</p>
        <p>Location: [Loading...]</p>
      </div>
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
            value={guestPhone}
            onChange={(e) => setGuestPhone(formatPhone(e.target.value))}
            placeholder="1234567890"
            maxLength={10}
            required
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
        <button type="submit" disabled={!rsvpStatus}>
          Submit RSVP
        </button>
      </form>
    </div>
  )
}

export default GuestRsvp
