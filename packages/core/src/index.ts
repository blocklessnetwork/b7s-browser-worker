import { multiaddr } from '@multiformats/multiaddr'
import * as uint8arrays from 'uint8arrays'
import { libp2p } from './node'
import executor from './executor'
import { pipe } from 'it-pipe'
import pino from 'pino'

export interface Config {
	bootNodeAddress: string
}

const WORK_PROTOCOL = '/b7s/work/1.0.0'

export const B7S = function b7s(config: Config) {
	this.logger = pino({ browser: { asObject: true } })
	this.libp2pnode = libp2p
	this.peerList = {}
	this.peerIds = []
	this.multiaddrs = []
	this.peerId = libp2p.peerId.toString()

	// think about storing these in app storage, so we can dial back when we drop
	// this is how we function on the go node
	const updatePeerList = () => {
		// Update connections list
		// biome-ignore lint/complexity/noForEach: i don't like this rule
		libp2p.getPeers().forEach((peerId) => {
			this.peerIds.push(peerId.toString())
			this.peerList[peerId.toString()]

			const addrList: string[] = []

			for (const conn of libp2p.getConnections(peerId)) {
				addrList.push(conn.remoteAddr.toString())
			}

			this.peerList[peerId.toString()] = {
				addrList
			}
		})
	}

	// stream listener
	// handle direct connections for work requests
	libp2p.handle(WORK_PROTOCOL, async ({ connection, stream }) => {
		this.logger.info(`direct message message recieved ${WORK_PROTOCOL}`)

		const output = await pipe(stream, async (source) => {
			let string = ''
			const decoder = new TextDecoder()
			for await (const buf of source) {
				// buf is a `Uint8ArrayList` so we must turn it into a `Uint8Array`
				// before decoding it
				string += decoder.decode(buf.subarray())
			}
			return string
		})

		const message = JSON.parse(output)

		// dispatch work to the execution environment
		if (message.type === 'MsgExecute') {
			// fetch function

			// then execute
			executor.execute()

			// we need to dial back, but should probably check
			// if we have a stream available to come back to
			const responseStream = await libp2p.dialProtocol(
				connection.remoteAddr,
				WORK_PROTOCOL
			)

			const resp = JSON.stringify({
				type: 'MsgExecuteResponse',
				request_id: message.request_id,
				results: {
					[libp2p.peerId.toString()]: {
						code: '200',
						result: {
							exit_code: 0,
							stderr: '',
							stdout: 'Hello World From the Browser'
						},
						request_id: message.request_id
					}
				},
				code: '200'
			})

			// return response
			pipe(async function* () {
				// the stream input must be bytes
				yield new TextEncoder().encode(resp)
			}, responseStream)
		}
	})

	// update peer connections
	libp2p.addEventListener('connection:open', () => {
		this.logger.info('connection open')
		updatePeerList()
	})

	libp2p.addEventListener('connection:close', () => {
		this.logger.info('connection closed')
		updatePeerList()
	})

	// update listening addresses
	libp2p.addEventListener('self:peer:update', () => {
		const multiaddrs = libp2p.getMultiaddrs().map((ma) => {
			return ma.toString()
		})
		this.multiaddrs = multiaddrs
	})

	libp2p.services.pubsub.addEventListener('message', async (event) => {
		this.logger.info('pubsub message recieved')
		// we can use multi-topics now in the golang node
		// we should replicate that
		const topic = event.detail.topic
		const message = JSON.parse(uint8arrays.toString(event.detail.data))

		// dispatch work to the execution environment
		if (message.type === 'MsgRollCall') {
			this.logger.info(message)
			// respond if you can do work
			await libp2p.services.pubsub.publish(
				topic,
				uint8arrays.fromString(
					JSON.stringify({
						type: 'MsgRollCallResponse',
						from: libp2p.peerId,
						code: '202', // standard http code
						request_id: message.request_id,
						function_id: message.function_id
					})
				)
			)
		}
	})

	// boot the node
	const topic = 'blockless/b7s/general'
	libp2p.services.pubsub.subscribe(topic)

	// dial boot node
	const boot = async () => {
		const ma = multiaddr(config.bootNodeAddress)
		await libp2p.dial(ma)
	}

	boot()
}
