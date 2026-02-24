//Header that currently allows switching users
export default function TopBar({ users, activeUserId, onChangeUser }) {
  return (
    <header className="topbar">
      <div>
        <h1>Pokemon TCG Collection Manager</h1>
      </div>
      <label className="inline-control" htmlFor="user-select">
        Active User
        <select
          id="user-select"
          value={activeUserId}
          onChange={(event) => onChangeUser(Number(event.target.value))}
        >
          {users.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.username}
            </option>
          ))}
        </select>
      </label>
    </header>
  )
}
