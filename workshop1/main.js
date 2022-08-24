import express from 'express'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

// hack 
import range from './node_modules/express-range/index.js'

import {
	findAllGames, findGamesByName, findGameById, countGames,
	findCommentsByGameId, findCommentsByUser, findCommentById,
	insertComment
} from './database.js'
import { mkGameUrl, mkCommentUrl, mkError } from './util.js'

const PORT = parseInt(process.env.PORT) || 3000

const app = express()

app.use(morgan("common"))

// Games
// TODO GET /games
app.get('/games', async (req, resp) => {
	// look in query for offset and limit parameter. if exist, convert to int
	// else offset = 0 or limit = 10
	const offset = parseInt(req.query.offset) || 0
	const limit = parseInt(req.query.limit) || 10

	try {
		// SQL: select * from games offset m and limit n
		// result is an array of game
		const games = await findAllGames(offset, limit)
		const results = []

		// loop through the result and get the id
		for (const g of games) {
			results.push(`/game/${g.id}`)
		}

		// 200 ok
		resp.status(200)
		// Content-Type: application/json
		resp.type('application/json')
		// setting of header
		resp.set("X-My-Name", "Rendy")
		// This is the payload
		resp.json(results)
	} catch (err) {
		resp.status(500)
		resp.json(mkError(err))
	}
})

// TODO GET /game/<game_id>
app.get('/game/:gameId', async (req, resp) => {
	const gameId = parseInt(req.params.gameId)

	try {
		const results = await findGameById(gameId)
		resp.type('application/json')

		if (!results) {
			resp.status(404)
			resp.json({error: `Cannot find game with gameId ${gameId}`})
			return
		}

		resp.status(200)
		resp.json(results)
	} catch (err) {
		resp.status(500)
		resp.json(mkError(err))
	}
})

app.get('/games/search', async (req, resp) => {
	const q = req.query.q
	if (!q)
		return resp.status(400).json({ error: `Missing query parameter q` })

	try {
		const result = await findGamesByName(q)
		resp.status(200)
		resp.json(mkGameUrl(result))
	} catch (err) {
		resp.status(500)
		resp.json(mkError(err))
	}
})

app.get('/games/count', async (req, resp) => {
	try {
		const result = await countGames()
		resp.status(200)
		resp.json({ count: result })
	} catch (err) {
		resp.status(500)
		resp.json(mkError(err))
	}
})


// Comments
// TODO POST /comment


app.get('/game/:gameId/comments', async (req, resp) => {
	const gameId = parseInt(req.params.gameId)
	const offset = parseInt(req.query.offset) || 0
	const limit = parseInt(req.query.limit) || 10
	try {
		const result = await findCommentsByGameId(gameId, offset, limit)
		resp.status(200)
		resp.json(mkCommentUrl(result))
	} catch (err) {
		resp.status(500)
		resp.json(mkError(err))
	}
})

app.get('/comments/:user', async (req, resp) => {
	const user = req.params.user
	const offset = parseInt(req.query.offset) || 0
	const limit = parseInt(req.query.limit) || 10
	try {
		const result = await findCommentsByUser(user, offset, limit)
		resp.status(200)
		resp.json(mkCommentUrl(result))
	} catch (err) {
		resp.status(500)
		resp.json(mkError(err))
	}
})

app.get('/comment/:commentId', async (req, resp) => {
	const commentId = req.params.commentId
	try {
		const comment = await findCommentById(commentId)
		if (!comment) {
			resp.status(404)
			return resp.json(mkError({ error: `Comment ${commentId} not found` }))
		}
		resp.status(200)
		resp.json(comment)
	} catch (err) {
		resp.status(500)
		resp.json(mkError(err))
	}
})

app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`)
})
