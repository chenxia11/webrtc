<template>
  <div>
    <madiaStream
      type="rtc"
      @createStream="createStream"
      @removeStream="removeStream"
    />
    <video
      class="remote-stream"
      v-for="item in streamList"
      :key="item.id"
      :srcObject="item"
      autoplay
      controls
      muted
    ></video>

    <div class="flex" v-if="showDatachanel">
      <div class="input-con">
        <a-input placeholder="Basic usage" v-model:value="value"></a-input>
        <a-button class="button" type="primary" @click="handleSend">
          发送
        </a-button>
      </div>
      <a-textarea :value="message" :rows="8"></a-textarea>
    </div>
  </div>
</template>
<script>
  import Rtc from './rtc'
  import Socket from './socket'
  import madiaStream from '../mediaStream/index'
  export default {
    components: { madiaStream },
    data() {
      return {
        peer: null,
        socket: null,
        isOpen: false,
        streamList: [],
        localStream: null,
        message: '',
        value: 'hello',
        showDatachanel: false,
      }
    },
    created() {
      this.connect()
    },
    methods: {
      connect() {
        this.socket = new Socket({
          baseUrl: 'ws://localhost:8000/ws',
        })
        this.socket.connect()

        this.socket.on('offer', (msg) => {
          this.peer?.handleVideoOfferMsg(msg)
        })

        this.socket.on('ice', (msg) => {
          this.peer?.handleIceMsg(msg)
        })

        this.peer = new Rtc({
          sendToServer: (data) => this.socket.send(data),
        })
        this.peer.createPeerConnection()
        this.peer.on('createOfeer', () => {
          this.socket.once('answer', (msg) => {
            this.peer?.handleAnswerMsg(msg)
          })
        })
        this.peer.on('onAddStream', (stream) => {
          window.streamList = stream
          const index = this.streamList.findIndex(function(item) {
            return item.id === stream.id
          })
          if (index === -1) {
            this.streamList.push(stream)
          } else {
            this.streamList[index] = stream
          }
        })
        this.peer.on('onRemoveStream', () => {
          console.log('removeStream')
          this.streamList = []
          // const index = this.streamList.findIndex(function(item) {
          //   return item.id === stream.id
          // })
          // if (index > -1) this.streamList.split(index, 1)
        })
        this.peer.on('datachannelMessage', (data) => {
          this.message = this.message + '\n' + data
        })
      },
      createStream(stream) {
        window.localStream = this.localStream = stream
        console.log('localStream', stream)
        this.peer.createDateChannel()
        this.peer.createStream(stream)
      },
      removeStream() {
        this.localStream = null
      },
      async invite(stream) {
        this.peer.createStream(stream)
      },
      handleSend() {
        if (!this.value) return
        const value = this.value
        this.peer.sendData(value)
        this.value = 'hello'
      },
    },
    unmounted() {
      this.socket.close()
      this.peer.close()
    },
  }
</script>
<style scoped>
  .remote-stream {
    max-width: 80%;
    margin: 30px;
  }
  .flex {
    display: flex;
    margin-top: 30px;
  }
  .input-con {
    text-align: left;
    width: 30%;
    margin-right: 30px;
  }
  .button {
    margin-top: 30px;
  }
</style>
