import { WasmWorker } from '@blockless/runtime-browser-core'

export default {
	execute: () => {
		console.log('executing')

		new WasmWorker(fileBuffer, {
			stdin: new TextEncoder().encode(stdin),
			env: envMap,
			onLog: (s: string) => {
				setWasmTimeEllapsed(Date.now() - timeStart)
				setWasmStdout(s.trim().split('\n'))
			}
		})
	}
}
