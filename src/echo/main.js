const delayTimeEl = document.getElementById("delay-time")

navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    echoCancellationType: "system"
  }
})
  .then((stream) => {
    const audioCtx = new AudioContext();
    const src = audioCtx.createMediaStreamSource(stream)
    // TODO: single function for this.
    const delayTime = Math.max(0.1, parseFloat(delayTimeEl.value))
    let delay = new DelayNode(audioCtx, { delayTime, maxDelayTime: delayTime })
    src.connect(delay)
    delay.connect(audioCtx.destination)
    const analyzer = audioCtx.createAnalyser()

    delayTimeEl.onchange = (e) => {
      const delayTime = Math.max(0.1, parseFloat(e.target.value))
      delay.disconnect(audioCtx.destination)
      src.disconnect(delay)
      delay = new DelayNode(audioCtx, { delayTime, maxDelayTime: delayTime })
      src.connect(delay)
      delay.connect(audioCtx.destination)
    }
  })
  .catch((err) => {
    console.log("getUserMedia error", err);
  })
