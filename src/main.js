const SKIP_AMOUNT = 3 // seconds
const SKIP_BACK = 37
const SKIP_FORWARD = 39
const RECORD_PLAY_PAUSE = " ".charCodeAt(0)  // The normal loop will be "record it, then play it, then stop"
const RECORD_STOP = "r".charCodeAt(0)
const PLAY_PAUSE = "p".charCodeAt(0)

const playStateDisplayEl = document.getElementById("play-state-display")
const recordingStateDisplayEl = document.getElementById("recording-state-display")
const recordingStateDurationEl = document.getElementById("recording-state-duration")
const audioEl = document.getElementById("audio")
audioEl.onplay = () => {
  playStateDisplayEl.style.color = "lightgreen"
  playStateDisplayEl.innerText = "playing"
}
audioEl.onpause = () => {
  playStateDisplayEl.style.color = "inherit"
  playStateDisplayEl.innerText = "paused"
}
Promise.all([
  navigator.mediaDevices.getUserMedia({ audio: true }),
  navigator.requestMIDIAccess()
])
  .then(([stream, midiAccess]) => {
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];
    let oldAudioUrl = null
    let recordStartTime = 0


    const updateRecordingTime = () => { // TODO: consider using high-res timestamp we get as arg.
      if (recordStartTime != 0) {
        const elapsed = ((new Date()).getTime() - recordStartTime) / 1000
        recordingStateDurationEl.innerText = `${elapsed}s`
      }
      window.requestAnimationFrame(updateRecordingTime)
    }

    window.requestAnimationFrame(updateRecordingTime)

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    }
    mediaRecorder.onstart = () => {
      recordStartTime = (new Date()).getTime()
      recordingStateDisplayEl.style.color = "red"
      recordingStateDisplayEl.innerText = "recording"
    }
    mediaRecorder.onstop = (e) => {
      recordStartTime = 0
      recordingStateDisplayEl.style.color = "inherit"
      recordingStateDisplayEl.innerText = "stopped"
      const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
      chunks = [];
      const newAudioUrl = window.URL.createObjectURL(blob);
      audioEl.src = newAudioUrl;
      if (oldAudioUrl != null) window.URL.revokeObjectURL(oldAudioUrl)
      oldAudioUrl = newAudioUrl
      audioEl.play()
    }

    function skipBack() {
      audioEl.currentTime = audioEl.currentTime - SKIP_AMOUNT
      audioEl.play()
    }

    function skipForward() {
      audioEl.currentTime = audioEl.currentTime + SKIP_AMOUNT
      audioEl.play()  // technically should be unneeded
    }

    function recordOrStop() {

      if (mediaRecorder.state === "recording") mediaRecorder.stop()
      else {
        // We don't want ot play while we're recording, so stop the player.
        audioEl.pause()
        mediaRecorder.start()
      }
    }

    function playOrPause() {
      // We don't want to play while we're recording, so we'll just make it stop if we're recording
      if (mediaRecorder.state === "recording") mediaRecorder.stop()
      else if (audioEl.ended) {
        audioEl.fastSeek(0)
        audioEl.play()
      } else if (audioEl.paused) audioEl.play()
      else audioEl.pause()
    }

    function recordPlayOrPause() {
      if (!audioEl.paused) audioEl.pause()
      else if (mediaRecorder.state === "recording") mediaRecorder.stop()
      else mediaRecorder.start()
    }

    for (let input of midiAccess.inputs.values()) {
      // TODO: handle getting new midi devices
      input.onmidimessage = (msg) => {
        console.log("midi message", msg)
        recordPlayOrPause()
      }
    }

    window.onkeydown = (e) => {
      switch (e.keyCode) {
        case SKIP_BACK: return skipBack()
        case SKIP_FORWARD: return skipForward()
        case RECORD_STOP: return recordOrStop()
        case PLAY_PAUSE: return playOrPause()
        case RECORD_PLAY_PAUSE: return recordPlayOrPause()
      }
    }
  })
  .catch((err) => {
    console.log("getUserMedia error", err);
  })

function getPeaks() {

}