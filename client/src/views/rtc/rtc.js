import EventEmitter from 'eventemitter3'

export default class Rtc extends EventEmitter {
  constructor(options = {}) {
    super()
    this.myUsername = options.myUsername
    this.targetUsername = options.targetUsername
    this.myPeerConnection = null
    this.dc = null
    this.id = Math.ceil(Math.random() * 100000)
    this.connectId = null
    this.sendToServer = options.sendToServer
    this.remoteStream = null
    this.datachannel = null
  }
  createPeerConnection() {
    const myPeerConnection = this.myPeerConnection = new RTCPeerConnection()
    myPeerConnection.onicecandidate = this.handleICECandidateEvent //发送ICE候选人
    myPeerConnection.ontrack = this.handleTrackEvent
    myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent //开始谈判
    myPeerConnection.onremovetrack = this.handleRemoveTrackEvent
    myPeerConnection.ondatachannel = this.receiveChannelCallback

  }
  createDateChannel() {
    if (this.dc) return;
    const dc = this.myPeerConnection.createDataChannel('my channel')

    this.initDataChannelEvent(dc)
  }
  sendData(data) {
    if (this.dc) {
      this.dc.send(data)
      this.emit('datachannelMessage', this.id + ' send :      ' + data)
    }

  }
  initDataChannelEvent(dc) {
    this.dc = dc
    dc.onmessage = (event) => {
      this.emit('datachannelMessage', this.connectId + ' send :      ' + event.data)
    }

    dc.onopen = () => {
      console.log('datachannel open')
      this.sendData(this.id + ' connect')
    }

    dc.onclose = () => {
      console.log('datachannel close')
    }
  }
  receiveChannelCallback = (event) => {
    console.log('onAddDatachannel')
    this.initDataChannelEvent(event.channel)
  }
  async createStream(stream) {
    stream
      .getTracks()
      .forEach((track) => this.myPeerConnection.addTrack(track, stream))
    this.stream = stream
  }
  handleICECandidateEvent = (event) => {
    if (event.candidate) {
      this.sendToServer({
        type: 'ice',
        target: this.targetUsername,
        candidate: event.candidate,
      })
    }
  }
  handleTrackEvent = (event) => {
    console.log('add', event)
    this.emit('onAddStream', event.streams[0])
  }
  handleRemoveTrackEvent = (event) => {
    console.log('remove', event)
    // this.emit('onRemoveStream', event.streams[0])
  }
  // create offer
  handleNegotiationNeededEvent = () => {
    console.log('=====createOffer')
    const { myPeerConnection } = this
    myPeerConnection
      .createOffer()
      .then(function (offer) {
        return myPeerConnection.setLocalDescription(offer)
      })
      .then(() => {
        this.emit('createOfeer')
        this.sendToServer({
          name: this.myUsername,
          target: this.targetUsername,
          type: 'offer',
          sdp: myPeerConnection.localDescription,
          id: this.id,
        })
      })
      .catch((err) => {
        console.log(err)
      })
  }
  //create answer
  handleVideoOfferMsg(msg) {
    const targetUsername = msg.name

    this.connectId = msg.id
    const { myPeerConnection } = this
    const desc = new RTCSessionDescription(msg.sdp)
    this.emit('onRemoveStream')
    myPeerConnection
      .setRemoteDescription(desc)
      // .then(() => {
      //   return navigator.mediaDevices.getUserMedia({
      //     audio: true,
      //     video: true,
      //   })
      // })
      // .then((stream) => {

      //   return this.createStream(stream)
      // })
      .then(function () {
        return myPeerConnection.createAnswer()
      })
      .then(function (answer) {
        return myPeerConnection.setLocalDescription(answer)
      })
      .then(() => {
        const msg = {
          name: this.myUsername,
          target: targetUsername,
          type: 'answer',
          sdp: myPeerConnection.localDescription,
          id: this.id
        }
        this.sendToServer(msg)
      })
      .catch()
  }

  //remote
  handleAnswerMsg(msg) {
    const { myPeerConnection } = this
    const desc = new RTCSessionDescription(msg.sdp)
    myPeerConnection.setRemoteDescription(desc)
    this.connectId = msg.id
  }

  handleIceMsg(msg) {
    const candidate = new RTCIceCandidate(msg.candidate)
    this.myPeerConnection.addIceCandidate(candidate)
  }
  close() {
    if (this.myPeerConnection) {
      this.myPeerConnection.close()
      this.myPeerConnection = null
      this.dc = null
    }
  }
}
