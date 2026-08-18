export function generateDemoTrack() {
  const sampleRate = 44100
  const bpm = 128
  const beatLen = 60 / bpm
  const bars = 8
  const totalBeats = bars * 4
  const duration = totalBeats * beatLen
  const totalSamples = Math.floor(sampleRate * duration)

  const left = new Float32Array(totalSamples)
  const right = new Float32Array(totalSamples)

  const rootFreq = 73.42
  const bassNotes = [rootFreq, rootFreq, rootFreq * 1.189, rootFreq * 1.334, rootFreq, rootFreq * 1.498, rootFreq * 1.334, rootFreq * 1.189]
  const leadNotes = [293.66, 349.23, 392.00, 440.00, 523.25, 440.00, 392.00, 349.23]

  for (let s = 0; s < totalSamples; s++) {
    const t = s / sampleRate
    const beatPos = (t / beatLen)
    const currentBeat = Math.floor(beatPos)
    const beatFract = beatPos - currentBeat

    let sampleL = 0
    let sampleR = 0

    const kickTime = beatFract * beatLen
    if (kickTime < 0.35) {
      const kickPitchEnv = Math.exp(-kickTime * 32)
      const kickFreq = 45 + 130 * kickPitchEnv
      const kickAmp = Math.exp(-kickTime * 10)
      const kickWave = Math.sin(2 * Math.PI * kickFreq * kickTime) * kickAmp
      const kickClick = Math.sin(2 * Math.PI * 800 * kickTime) * Math.exp(-kickTime * 90) * 0.4
      const kickTotal = (kickWave + kickClick) * 0.95
      sampleL += kickTotal
      sampleR += kickTotal
    }

    const barBeat = currentBeat % 4
    if (barBeat === 1 || barBeat === 3) {
      const snareTime = beatFract * beatLen
      if (snareTime < 0.25) {
        const snareNoise = (Math.random() * 2 - 1) * Math.exp(-snareTime * 18)
        const snareTone = Math.sin(2 * Math.PI * 185 * snareTime) * Math.exp(-snareTime * 25) * 0.6
        const snareTotal = (snareNoise * 0.7 + snareTone * 0.5) * 0.8
        sampleL += snareTotal * 0.95
        sampleR += snareTotal * 0.95
      }
    }

    const sixteenthPos = (beatFract * 4) % 1
    const sixteenthIdx = Math.floor(beatFract * 4)
    const hatTime = sixteenthPos * (beatLen / 4)
    const isOpenHat = (sixteenthIdx === 2)
    const hatDecay = isOpenHat ? 22 : 65
    if (hatTime < 0.15) {
      const hatNoise = (Math.random() * 2 - 1) * Math.exp(-hatTime * hatDecay) * 0.35
      const pan = (sixteenthIdx % 2 === 0) ? 0.85 : 1.15
      sampleL += hatNoise * (2 - pan)
      sampleR += hatNoise * pan
    }

    const bassIdx = (currentBeat * 2 + Math.floor(beatFract * 2)) % bassNotes.length
    const bFreq = bassNotes[bassIdx]
    const bPhase = t * bFreq
    const saw = 2 * (bPhase - Math.floor(bPhase + 0.5))
    const square = Math.sin(2 * Math.PI * bFreq * t) > 0 ? 0.5 : -0.5
    const bassSub = Math.sin(2 * Math.PI * (bFreq * 0.5) * t) * 0.8
    const bassEnv = Math.exp(-((beatFract * 2) % 1) * 6)
    const bassSound = (saw * 0.4 + square * 0.3 + bassSub * 0.6) * bassEnv * 0.55
    sampleL += bassSound * 0.9
    sampleR += bassSound * 0.9

    const leadIdx = Math.floor(t * 8) % leadNotes.length
    const lFreq = leadNotes[leadIdx]
    const lEnv = Math.exp(-((t * 8) % 1) * 9)
    const filterMod = 1 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t)
    const lSaw = (2 * ((t * lFreq) - Math.floor((t * lFreq) + 0.5))) * filterMod
    const leadSound = lSaw * lEnv * 0.35
    const leadPan = Math.sin(2 * Math.PI * 1.5 * t) * 0.4 + 0.5
    sampleL += leadSound * (1 - leadPan)
    sampleR += leadSound * leadPan

    left[s] = Math.tanh(sampleL * 0.85)
    right[s] = Math.tanh(sampleR * 0.85)
  }

  return encodeWAV([left, right], sampleRate)
}

function encodeWAV(channels, sampleRate) {
  const numChannels = channels.length
  const length = channels[0].length * numChannels * 2
  const buffer = new ArrayBuffer(44 + length)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + length, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true)
  view.setUint16(32, numChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, length, true)

  let offset = 44
  for (let i = 0; i < channels[0].length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([view], { type: 'audio/wav' })
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
