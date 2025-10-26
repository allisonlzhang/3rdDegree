import { useNavigate } from 'react-router-dom'

const Host = () => {
  const navigate = useNavigate()

  const handleCreateParty = () => {
    navigate('/host/create-party')
  }

  return (
    <div className="host-container">
      <h1>Host Dashboard</h1>
      <div className="host-actions">
        <button onClick={handleCreateParty} className="create-party-btn">
          Create a Party
        </button>
      </div>
      <div className="parties-list">
        <h2>Your Parties</h2>
        <p>No parties yet. Create your first party!</p>
      </div>
    </div>
  )
}

export default Host
