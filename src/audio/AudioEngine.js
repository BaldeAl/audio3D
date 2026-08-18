class AudioEngine {
  constructor() {
    this.ctx = null
    this.analyser = null
    this.gainNode = null
    this.source = null
    this.audioElement = null
    this.frequencyData = null
    this.waveformData = null
    this.isPlaying = false
    this.isReady = false
    this.playbackRate = 1.0
    this._onEndedCb = null

    this._prevBassEnergy = 0
    this._beatThreshold = 0.35
    this._beatHold = 0
    this._beatDecay = 0
    this._kickDetected = false
    this._peakBass = 0
    this._peakMid = 0
    this._peakTreble = 0
    this._smoothBass = 0
    this._smoothMid = 0
    this._smoothTreble = 0
  }

  _ensureContext() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 4096
    this.analyser.smoothingTimeConstant = 0.6
    this.gainNode = this.ctx.createGain()
    this.gainNode.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this.waveformData = new Uint8Array(this.analyser.frequencyBinCount)
  }

  async loadFile(file) {
    this._ensureContext()
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    if (this.audioElement) {
      this.audioElement.pause()
      URL.revokeObjectURL(this.audioElement.src)
    }

    const url = URL.createObjectURL(file)
    this.audioElement = new Audio()
    this.audioElement.crossOrigin = 'anonymous'
    this.audioElement.src = url
    this.audioElement.playbackRate = this.playbackRate

    await new Promise((resolve, reject) => {
      this.audioElement.addEventListener('loadedmetadata', resolve, { once: true })
      this.audioElement.addEventListener('error', reject, { once: true })
    })

    this.source = this.ctx.createMediaElementSource(this.audioElement)
    this.source.connect(this.gainNode)
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false
      if (this._onEndedCb) this._onEndedCb()
    })

    this.isReady = true
    this.isPlaying = false
  }

  play() {
    if (!this.isReady) return
    if (this.ctx.state === 'suspended') this.ctx.resume()
    this.audioElement.play()
    this.isPlaying = true
  }

  pause() {
    if (!this.isReady) return
    this.audioElement.pause()
    this.isPlaying = false
  }

  togglePlay() {
    if (this.isPlaying) this.pause()
    else this.play()
  }

  seek(fraction) {
    if (!this.isReady) return
    this.audioElement.currentTime = fraction * this.audioElement.duration
  }

  seekRelative(seconds) {
    if (!this.isReady) return
    this.audioElement.currentTime = Math.max(0, Math.min(
      this.audioElement.duration,
      this.audioElement.currentTime + seconds
    ))
  }

  setVolume(value) {
    if (this.gainNode) this.gainNode.gain.value = value
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate
    if (this.audioElement) {
      this.audioElement.playbackRate = rate
    }
  }

  get currentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0
  }

  get duration() {
    return this.audioElement ? this.audioElement.duration || 0 : 0
  }

  get progress() {
    if (!this.audioElement || !this.audioElement.duration) return 0
    return this.audioElement.currentTime / this.audioElement.duration
  }

  getFrequencyData() {
    if (!this.analyser) return this.frequencyData || new Uint8Array(2048)
    this.analyser.getByteFrequencyData(this.frequencyData)
    return this.frequencyData
  }

  getWaveformData() {
    if (!this.analyser) return this.waveformData || new Uint8Array(2048)
    this.analyser.getByteTimeDomainData(this.waveformData)
    return this.waveformData
  }

  update() {
    if (!this.analyser) return
    this.getFrequencyData()
    this.getWaveformData()

    const rawBass = this._bandEnergy(0, 12)
    const rawMid = this._bandEnergy(12, 120)
    const rawTreble = this._bandEnergy(120, 500)

    const attackSpeed = 0.6
    const releaseSpeed = 0.08

    this._smoothBass = rawBass > this._smoothBass
      ? this._smoothBass + (rawBass - this._smoothBass) * attackSpeed
      : this._smoothBass + (rawBass - this._smoothBass) * releaseSpeed
    this._smoothMid = rawMid > this._smoothMid
      ? this._smoothMid + (rawMid - this._smoothMid) * attackSpeed
      : this._smoothMid + (rawMid - this._smoothMid) * releaseSpeed
    this._smoothTreble = rawTreble > this._smoothTreble
      ? this._smoothTreble + (rawTreble - this._smoothTreble) * attackSpeed
      : this._smoothTreble + (rawTreble - this._smoothTreble) * releaseSpeed

    const peakDecay = 0.97
    this._peakBass = Math.max(rawBass, this._peakBass * peakDecay)
    this._peakMid = Math.max(rawMid, this._peakMid * peakDecay)
    this._peakTreble = Math.max(rawTreble, this._peakTreble * peakDecay)

    const bassJump = rawBass - this._prevBassEnergy
    this._prevBassEnergy = rawBass

    if (this._beatHold > 0) {
      this._beatHold--
      this._beatDecay *= 0.85
    }

    if (bassJump > this._beatThreshold && rawBass > 0.4 && this._beatHold <= 0) {
      this._kickDetected = true
      this._beatHold = 8
      this._beatDecay = 1.0
    } else {
      this._kickDetected = false
    }
  }

  _bandEnergy(startBin, endBin) {
    const data = this.frequencyData
    if (!data) return 0
    let sum = 0
    const end = Math.min(endBin, data.length)
    for (let i = startBin; i < end; i++) sum += data[i]
    return sum / ((end - startBin) * 255)
  }

  getBass() { return this._smoothBass }
  getMid() { return this._smoothMid }
  getTreble() { return this._smoothTreble }
  getRawBass() { return this._bandEnergy(0, 12) }
  getRawMid() { return this._bandEnergy(12, 120) }
  getRawTreble() { return this._bandEnergy(120, 500) }
  getPeakBass() { return this._peakBass }
  getPeakMid() { return this._peakMid }
  getPeakTreble() { return this._peakTreble }
  isKick() { return this._kickDetected }
  getBeatDecay() { return this._beatDecay }
  getEnergy() { return (this._smoothBass * 1.5 + this._smoothMid + this._smoothTreble * 0.8) / 3.3 }

  onEnded(cb) { this._onEndedCb = cb }

  dispose() {
    if (this.audioElement) {
      this.audioElement.pause()
      URL.revokeObjectURL(this.audioElement.src)
    }
    if (this.source) this.source.disconnect()
    if (this.ctx) this.ctx.close()
  }
}

const audioEngine = new AudioEngine()
export default audioEngine
