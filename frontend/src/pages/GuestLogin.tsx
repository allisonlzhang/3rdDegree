import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const GuestLogin = () => {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { guestLogin } = useAuth()

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.slice(0, 10)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    // Store phone in localStorage and context (this is the guest login)
    guestLogin(phone)
    navigate('/guest')
  }

  return (
    <div className="guest-login-container">
      <h1>Third Degree</h1>
      <h2>Guest Login</h2>
      <p className="guest-description">Enter your phone number to view your RSVPs</p>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="1234567890"
            maxLength={10}
            required
          />
        </div>
        <button type="submit">
          View My RSVPs
        </button>
      </form>
    </div>
  )
}

export default GuestLogin
