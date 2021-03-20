<template>
  <div>
    <div>
      <span>数据采集类型：</span>
      <a-select :value="value" @change="handleChange" style="width: 200px">
        <a-select-option
          v-for="item in list"
          :key="item.type"
          :value="item.type"
        >
          {{ item.label }}
        </a-select-option>
      </a-select>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <a-button type="primary" @click="open">
        打开
      </a-button>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <a-button @click="close">
        关闭
      </a-button>
    </div>
    <div>
      <video
        v-if="value === 'mediaElement'"
        ref="video"
        class="media-ele"
        id="media"
        controls
        autoplay
        loop="loop"
        src="/yuanshen.mp4"
        crossorigin
      ></video>
      <span class="canvas-con">
        <canvas
          v-show="value === 'canvasElement'"
          ref="canvas"
          class="canvas-ele"
          width="400"
          height="400"
          @mousedown="onmousedown"
          @mouseup="onmouseup"
          @mousemove="onmousemove"
        ></canvas>
      </span>
      <video
        class="stream"
        v-if="stream & (type !== 'rtc')"
        :srcObject="stream"
        autoplay
        controls
        muted
      ></video>
    </div>
  </div>
</template>
<script>
  import MediaStream from './MediaStream'
  export default {
    props: {
      type: String,
    },
    data() {
      return {
        value: 'carmema',
        list: [
          {
            label: '摄像头麦克风采集',
            type: 'carmema',
          },
          {
            label: '桌面共享',
            type: 'display',
          },
          {
            label: '媒体元素采集',
            type: 'mediaElement',
          },
          {
            label: 'canvas采集',
            type: 'canvasElement',
          },
        ],
        stream: null,
        painting: false,
        ctx: null,
      }
    },
    mounted() {
      const canvas = this.$refs.canvas
      this.ctx = canvas.getContext('2d')
      this.ctx.fillStyle = '#FF0000'
      this.ctx.strokeStyle = '#FF0000'
    },
    methods: {
      handleChange(value) {
        this.value = value
      },
      async open() {
        if (this.stream) {
          this.close()
        }
        let ele = null
        if (this.value === 'mediaElement') ele = this.$refs.video
        if (this.value === 'canvasElement') ele = this.$refs.canvas
        const stream = await MediaStream.createStream(this.value, ele)
        this.stream = stream
        this.$emit('createStream', stream)
      },
      close() {
        const tracks = this.stream.getTracks()
        tracks.forEach((item) => {
          item.stop()
        })
        this.stream = null
        this.$emit('removeStream')
      },
      onmousedown(e) {
        this.painting = true
        let x = e.offsetX
        let y = e.offsetY
        this.lastPoint = { x: x, y: y }
        this.drawCircle(x, y, 5)
      },
      onmouseup() {
        this.painting = false
      },
      onmousemove(e) {
        if (this.painting) {
          let x = e.offsetX
          let y = e.offsetY
          let newPoint = { x: x, y: y }
          this.drawLine(
            this.lastPoint.x,
            this.lastPoint.y,
            newPoint.x,
            newPoint.y
          )
          this.lastPoint = newPoint
        }
      },
      drawCircle(x, y, radius) {
        const ctx = this.ctx
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2, true)
        ctx.fill()
      },
      drawLine(x1, y1, x2, y2) {
        const ctx = this.ctx
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.closePath()
      },
    },
  }
</script>
<style scoped>
  .media-ele,
  .stream {
    margin: 30px;
    max-width: 40%;
  }
  .canvas-ele {
    margin: 30px;
    border: 1px solid green;
  }
  .canvas-con {
    vertical-align: top;
    position: relative;
    width: 400px;
    height: 400px;
  }
</style>
