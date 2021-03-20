import EventEmitter from 'eventemitter3'
export default class Socket extends EventEmitter {
  constructor(options) {
    super()
    this.options = options
    this.ws = null
    this.reconnectCount = 0
    this.reconnectTimer = null
    this.needReconnect = true
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.options.baseUrl)
      this.needReconnect = true
      this.ws.onopen = (res) => {
        this.onopen(res)
        resolve(res)
      }
      this.ws.onmessage = (res) => this.onmessage(res)

      this.ws.onerror = (error) => {
        this.onerror(error)
        reject(error)
      }
      this.ws.onclose = (error) => {
        this.onclose()
        reject(error)
      }
    })
  }

  onmessage(res) {
    try {
      const msg = JSON.parse(res.data)
      this.emit(msg.type, msg)
      console.log('onmessage', msg)
    } catch (error) {
      console.warn(`Error::${error.message} :: ${res.data}`)
    }
  }

  onopen() {
    this.reconnectCount = 0
  }

  onerror() {
    this.reconnect()
  }

  onclose() {
    if (!this.needReconnect) return
    this.reconnect()
  }

  send(msg) {
    if (this.ws && this.ws.readyState === 1) {
      console.log('send', msg)
      this.ws.send(JSON.stringify(msg))
    }
  }

  reconnect() {
    if (this.reconnectCount < 3 && !this.reconnectTimer) {
      this.reconnectCount++
      this.reconnectTimer = setTimeout(() => {
        this.connect()
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }, 5000)
    }
  }

  close() {
    this.needReconnect = false
    this.ws && this.ws.close()
  }
}
