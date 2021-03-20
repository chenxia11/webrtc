import { createStore } from 'vuex'

export default createStore({
  state: {
    socket: null,
    hasConnect: false,
    id: null,
  },
  mutations: {
    setState(state, payload) {
      Object.keys(payload).forEach((item) => {
        state[item] = payload.item
      })
    },
  },
  actions: {
    connect({ commit }) {
      let socket
      if (!window.WebSocket) {
        window.WebSocket = window.MozWebSocket
      }
      if (window.WebSocket) {
        socket = new WebSocket('ws://localhost:8000/ws')
        socket.onmessage = function(event) {
          const data = event.data
          console.log(data)
        }
        socket.onopen = function() {
          console.log('连接开启')
          commit('setState', {
            hasConnect: true,
          })
        }
        socket.onclose = function() {
          console.log('连接关闭')
          commit('setState', {
            hasConnect: false,
          })
        }
        commit('setState', {
          socket,
        })
      } else {
        alert('你的浏览器不支持 WebSocket！')
      }
    },
    sendMessage({ state }, message) {
      if (!window.WebSocket) {
        return
      }
      const { socket } = state
      if (socket && socket.readyState == WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      } else {
        alert('连接没有开启.')
      }
    },
  },
  modules: {},
})
