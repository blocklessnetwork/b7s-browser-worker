import { B7S } from './index'

// dial a head node
const b7s = new B7S({
	bootNodeAddress:
		'/ip4/127.0.0.1/tcp/59783/ws/p2p/12D3KooWH9GerdSEroL2nqjpd2GuE5dwmqNi7uHX7FoywBdKcP4q'
})

console.log(b7s)
