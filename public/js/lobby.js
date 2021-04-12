const username = window.document.cookie.split('=')[1]
const createGameBtn = document.querySelector('#create-game-btn')
const logOutBtn = document.querySelector('#logout-btn')
const logOutForm = document.querySelector('#logout-form')
const lobbyTable = document.querySelector('.lobby-table tbody')
const socket = io()

function generateTable(playersWaiting) {
	// Create table body //
	playersWaiting.forEach(({ username, id }, index) => {
		const name = document.createTextNode(username)
		const joinGameBtn = document.createElement('button')

		joinGameBtn.innerText = 'Play Me'
		joinGameBtn.className = 'w-75 btn btn-dark'
		joinGameBtn.classList.add('join-game-btn')
		joinGameBtn.onclick = () => {
			socket.emit('updatePlayersWaiting', id)
			socket.emit('joinGame', { id, color: 'black' })

			window.location.href = '/chess'
		}

		if (index < 5) {
			const rows = document.querySelectorAll('tbody > tr')
			const [nameCell, inviteCell] = rows[index].cells

			nameCell.appendChild(name)
			inviteCell.appendChild(joinGameBtn)
			inviteCell.classList.add('text-center')
		} else {
			const row = lobbyTable.insertRow()
			const nameCell = row.insertCell()
			const inviteCell = row.insertCell()

			nameCell.appendChild(name)
			inviteCell.appendChild(joinGameBtn)
			inviteCell.classList.add('text-center')
		}
	})
}

socket.emit('login', username)

// Get list of opened games and generate a table //
socket.on('playersWaiting', (playersWaiting) => {
	generateTable(playersWaiting)
})

createGameBtn.addEventListener('click', () => {
	socket.emit('joinGame', { color: 'white' })

	// Send player to game room //
	window.location.href = '/chess'
})

logOutBtn.addEventListener('click', () => {
	socket.emit('logout')
	socket.on('logout', ({ id }) => {
		socket.emit('updatePlayersWaiting', id)
	})
	logOutForm.submit()
})
