import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { dcutr } from '@libp2p/dcutr'
import { identify } from '@libp2p/identify'
import { webRTC } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { createLibp2p } from 'libp2p'

export const libp2p = await createLibp2p({
	addresses: {
		listen: ['/webrtc']
	},
	transports: [
		webSockets({
			filter: filters.all
		}),
		webRTC(),
		circuitRelayTransport({
			discoverRelays: 1
		})
	],
	connectionEncryption: [noise()],
	streamMuxers: [yamux()],
	connectionGater: {
		denyDialMultiaddr: () => {
			return false
		}
	},
	services: {
		identify: identify(),
		pubsub: gossipsub(),
		dcutr: dcutr()
	},
	connectionManager: {
		minConnections: 0
	}
})
