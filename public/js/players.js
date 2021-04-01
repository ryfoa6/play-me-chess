import { whitePieces, blackPieces } from './pieces.js'

class Player {
	constructor(color, pieces) {
		this.color = color
		this.pieces = pieces
		this.inCheck = false
		this.checkMate = false
		this.staleMate = false
	}

	get kingSquare() {
		return this.pieces.find((piece) => piece.name === 'king')
	}

	copyPlayer() {
		const playerCopy = Object.assign(
			Object.create(Object.getPrototypeOf(this)),
			this
		)
		playerCopy.pieces = [...this.pieces].map((piece) =>
			Object.assign(Object.create(Object.getPrototypeOf(piece)), piece)
		)

		return playerCopy
	}

	checkEscapeMoves(chessBoard, activePlayer) {
		this.escapeCheck = false
		const { pieces } = this.copyPlayer()
		const promotionPieces = ['knight', 'queen']

		// Evaluate if player can escape check //
		piecesLoop: for (const piece of pieces) {
			if (piece.name === 'pawn') {
				const oneSquareUp =
					piece.color === 'white' ? piece.row - 1 : piece.row + 1
				const twoSquareUp =
					piece.color === 'white' ? piece.row - 2 : piece.row + 2

				// Add forward movement squares to possible pawn moves //
				if (twoSquareUp >= 0 && twoSquareUp <= 7) {
					piece.targets.push({ row: oneSquareUp, col: piece.col })
					piece.targets.push({ row: twoSquareUp, col: piece.col })
				}
			}

			// // Add castling squares for king //
			if (piece.name === 'king' && !piece.moved) {
				piece.targets.push({ row: piece.row, col: piece.col - 2 })
				piece.targets.push({ row: piece.row, col: piece.col + 2 })
			}

			for (const target of piece.targets) {
				let breakLoop = false

				// Copy board, players, pieces, and targets //
				let chessBoardCopy = Object.assign(
					Object.create(Object.getPrototypeOf(chessBoard)),
					chessBoard
				)
				chessBoardCopy.copyBoard(chessBoard)

				const playerCopy = this.copyPlayer()
				const opponentCopy = activePlayer.copyPlayer()
				const selectedPiece = playerCopy.pieces.find(
					(pieceCopy) =>
						pieceCopy.row === piece.row && pieceCopy.col === piece.col
				)
				const landingSquare = chessBoardCopy.selectSquare(target)
				const backRank = this.color === 'white' ? 0 : 7

				const { validMove, castle } = selectedPiece.checkMove(
					playerCopy,
					opponentCopy,
					chessBoardCopy,
					landingSquare
				)

				/////////////// Move piece if move is valid ///////////////
				if (validMove) {
					const promotePawn =
						selectedPiece.name === 'pawn' && backRank == target.row
							? true
							: false

					if (castle.validCastle) {
						const rooksLandingSquare = chessBoardCopy.selectSquare(
							castle.rooksLandingSquare
						)

						// Move king //
						chessBoardCopy.movePiece(
							playerCopy,
							opponentCopy,
							selectedPiece,
							landingSquare
						)

						// Move rook //
						chessBoardCopy.movePiece(
							playerCopy,
							opponentCopy,
							castle.rook,
							rooksLandingSquare
						)
					} else if (promotePawn) {
						//////////////////// Check for pawn promotion ////////////////////
						promotionPieces.forEach((promotionPiece) => {
							const newPiece = playerCopy.promotePawn(selectedPiece, {
								color: this.color,
								piece: promotionPiece,
							})

							// Promote pawn //
							chessBoardCopy.movePiece(
								playerCopy,
								opponentCopy,
								newPiece,
								landingSquare
							)

							chessBoardCopy.markEnemySquares(playerCopy, opponentCopy)
							playerCopy.isKingInCheck(chessBoardCopy)

							if (!playerCopy.inCheck) {
								this.escapeCheck = true
								breakLoop = true
							}
						})
					} else {
						// If validMove and not castling or promoting pawn //
						chessBoardCopy.movePiece(
							playerCopy,
							opponentCopy,
							selectedPiece,
							landingSquare
						)
					}

					chessBoardCopy.markEnemySquares(playerCopy, opponentCopy)
					playerCopy.isKingInCheck(chessBoardCopy)

					// Check if player can escape check //
					if (!playerCopy.inCheck) {
						this.escapeCheck = true
						breakLoop = true
					}
				}

				if (breakLoop) break piecesLoop
			}
		}

		if (!this.escapeCheck) {
			if (this.inCheck) {
				this.checkMate = true
			} else chessBoard.staleMate = true
		}
	}

	getPromotedPiece(socket) {
		return new Promise((resolve) => {
			socket.on('promotePawn', (result) => {
				socket.off('promotePawn')
				resolve(result)
			})
		})
	}

	isKingInCheck({ whiteSquares, blackSquares }) {
		const enemySquares =
			this.color === 'white' ? blackSquares.flat() : whiteSquares.flat()

		// Get King's position //
		try {
			const { row, col } = this.kingSquare
			if (
				enemySquares.find((square) => row === square.row && col === square.col)
			) {
				this.inCheck = true
			} else this.inCheck = false
		} catch (err) {
			console.error(err)
		}
	}

	promotePawn(pawn, { color, piece }) {
		const sparePiece = this.sparePieces.find(
			(sparePiece) => sparePiece.name === piece
		)
		const newPiece = Object.assign(
			Object.create(Object.getPrototypeOf(sparePiece)),
			sparePiece
		)
		newPiece.row = pawn.row
		newPiece.col = pawn.col

		const index = this.pieces.indexOf(pawn)
		this.pieces[index] = newPiece

		return newPiece
	}

	selectPieceModal() {
		const promoteModal = document.querySelector('#promote-modal')
		const knight = document.createElement('img')
		const bishop = document.createElement('img')
		const rook = document.createElement('img')
		const queen = document.createElement('img')

		if (this.color === 'white') {
			knight.src = './images/wn.svg'
			knight.setAttribute('data-piece', 'knight')

			bishop.src = './images/wb.svg'
			bishop.setAttribute('data-piece', 'bishop')

			rook.src = './images/wr.svg'
			rook.setAttribute('data-piece', 'rook')

			queen.src = './images/wq.svg'
			queen.setAttribute('data-piece', 'queen')
		} else {
			knight.src = './images/bn.svg'
			knight.classList.add('black-piece')
			knight.setAttribute('data-piece', 'knight')

			bishop.src = './images/bb.svg'
			bishop.classList.add('black-piece')
			bishop.setAttribute('data-piece', 'bishop')

			rook.src = './images/br.svg'
			rook.classList.add('black-piece')
			rook.setAttribute('data-piece', 'rook')

			queen.src = './images/bq.svg'
			queen.classList.add('black-piece')
			queen.setAttribute('data-piece', 'queen')
		}

		promoteModal.innerHTML = ''
		promoteModal.append(knight)
		promoteModal.append(bishop)
		promoteModal.append(rook)
		promoteModal.append(queen)

		setTimeout(function () {
			promoteModal.style.visibility = 'visible'
		}, 300)

		return new Promise((resolve) => {
			promoteModal.addEventListener('click', (e) => {
				const newPiece = {
					color: this.color,
					piece: e.target.dataset.piece,
				}
				promoteModal.style.visibility = 'hidden'
				resolve(newPiece)
			})
		})
	}
}

const whitePlayer = new Player('white', whitePieces)
const blackPlayer = new Player('black', blackPieces)

export { whitePlayer, blackPlayer }
