export default class MediaStream {
  static createStream(type = 'carmema', ele) {
    let create
    switch (type) {
      case 'display':
        create = this.openDisplay
        break
      case 'mediaElement':
      case 'canvasElement':
        create = this.openMediaEle
        break
      default:
        create = this.openCarema
        break
    }
    return create(ele)
  }

  //打开本地摄像头麦克风
  static openCarema() {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })
  }
  static openDisplay() {
    return navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })
  }
  static openMediaEle(ele) {
    return ele.captureStream()
  }
}
